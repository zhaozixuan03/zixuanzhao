export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { log } from '@/lib/log'
import { countWords } from '@/lib/utils'

const BUCKET = 'images'

// GET — return all soft-deleted posts and photos
export async function GET(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [{ data: posts }, { data: photos }] = await Promise.all([
    supabase.from('posts').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('photos').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ])

  return NextResponse.json({ posts: posts || [], photos: photos || [] })
}

// PATCH — restore a post or photo
export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, type } = await req.json()

  if (type === 'post') {
    const { error } = await supabase.from('posts').update({ deleted_at: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await log('post_restored', { post_id: id })
  } else {
    const { error } = await supabase.from('photos').update({ deleted_at: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await log('photo_restored', { photo_id: id })
  }

  return NextResponse.json({ ok: true })
}

// DELETE — permanently delete a post or photo
export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, type } = await req.json()

  if (type === 'post') {
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()
    await log('post_permanently_deleted', {
      post_id: id,
      title: post?.title,
      word_count: countWords(post?.content_text || ''),
      tags: post?.tags,
    })
    await supabase.from('photos').delete().eq('post_id', id)
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: photo } = await supabase.from('photos').select('*').eq('id', id).single()
    if (photo) {
      const filename = (photo.url as string).split('/').pop()!
      await supabase.storage.from(BUCKET).remove([filename])
      await log('photo_permanently_deleted', { photo_id: id, url: photo.url, caption: photo.caption })
    }
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
