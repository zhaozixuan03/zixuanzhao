export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase, Visibility } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { generateSlug, extractPlainText, extractImages, countWords } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

// GET /api/posts - list posts
export async function GET(req: NextRequest) {
  const authed = isAuthenticatedFromRequest(req)
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false })

  if (!authed) {
    query = query.in('visibility', ['public', 'quiet'])
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

  const { title, content, visibility } = await req.json()
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
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/posts - update post
export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id, title, content, visibility } = await req.json()
  const content_text = extractPlainText(content || '')
  const image_urls = extractImages(content || '')

  const { data, error } = await supabase.from('posts').update({
    title: title || null,
    content,
    content_text,
    image_urls,
    visibility: visibility as Visibility,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/posts
export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
