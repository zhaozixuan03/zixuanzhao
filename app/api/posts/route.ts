export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase, Visibility } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { generateSlug, extractPlainText, extractImages, countWords } from '@/lib/utils'
import { log } from '@/lib/log'
import { v4 as uuidv4 } from 'uuid'

// GET /api/posts - list posts (excludes soft-deleted)
export async function GET(req: NextRequest) {
  const authed = isAuthenticatedFromRequest(req)
  let query = supabase.from('posts').select('*').is('deleted_at', null).order('created_at', { ascending: false })

  if (!authed) {
    query = query.in('visibility', ['public'])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/posts - create post
export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { title, content, visibility, card_color, card_text_color, card_color_mode, tags, writing_seconds } = await req.json()
  const id = uuidv4()
  const content_text = extractPlainText(content || '')
  const image_urls = extractImages(content || '')
  const slug = generateSlug(title, id)

  const { data, error } = await supabase.from('posts').insert({
    id,
    title: title || null,
    content: content || '',
    content_text,
    image_urls,
    visibility: visibility as Visibility,
    slug,
    card_color: card_color || null,
    card_text_color: card_text_color || '#1a1a18',
    card_color_mode: card_color_mode || 'contrast',
    tags: tags || [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (image_urls.length > 0) {
    await supabase.from('photos').insert(image_urls.map((url: string) => ({ url, post_id: id })))
  }

  await log('post_created', {
    post_id: data.id,
    title: data.title,
    word_count: countWords(content_text),
    tags,
    visibility,
    card_color,
    writing_seconds,
    content_preview: content_text.slice(0, 100),
  })

  return NextResponse.json(data)
}

// PATCH /api/posts - update post
export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id, title, content, visibility, card_color, card_text_color, card_color_mode, tags, writing_seconds } = await req.json()
  const content_text = extractPlainText(content || '')
  const image_urls = extractImages(content || '')

  const { data: prev } = await supabase.from('posts').select('*').eq('id', id).single()
  const { data: current } = await supabase.from('posts').select('edit_history').eq('id', id).single()
  const newHistory = [...(current?.edit_history || []), new Date().toISOString()]

  const { data, error } = await supabase.from('posts').update({
    title: title || null,
    content,
    content_text,
    image_urls,
    visibility: visibility as Visibility,
    card_color: card_color || null,
    card_text_color: card_text_color || '#1a1a18',
    card_color_mode: card_color_mode || 'contrast',
    tags: tags || [],
    edit_history: newHistory,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('photos').delete().eq('post_id', id)
  if (image_urls.length > 0) {
    await supabase.from('photos').insert(image_urls.map((url: string) => ({ url, post_id: id })))
  }

  await log('post_updated', {
    post_id: id,
    title: data.title,
    word_count: countWords(content_text),
    prev_word_count: countWords(prev?.content_text || ''),
    tags,
    visibility,
    prev_visibility: prev?.visibility,
    changed_fields: [
      ...(title !== prev?.title ? ['title'] : []),
      ...(content !== prev?.content ? ['content'] : []),
      ...(visibility !== prev?.visibility ? ['visibility'] : []),
      ...(tags?.join() !== prev?.tags?.join() ? ['tags'] : []),
    ],
    writing_seconds,
    content_preview: content_text.slice(0, 100),
  })

  return NextResponse.json(data)
}

// DELETE /api/posts - soft delete
export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()

  await log('post_deleted', {
    post_id: id,
    title: post?.title,
    word_count: countWords(post?.content_text || ''),
    tags: post?.tags,
    content_preview: post?.content_text?.slice(0, 100),
  })

  const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
