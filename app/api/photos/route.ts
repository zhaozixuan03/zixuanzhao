export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { log } from '@/lib/log'

const BUCKET = 'images'

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { url } = await req.json()
  const { data, error } = await supabase
    .from('photos')
    .insert({ url, post_id: null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await log('photo_uploaded', { photo_id: data.id, url: data.url })

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { photo_id, caption } = await req.json()
  const { data, error } = await supabase
    .from('photos')
    .update({ caption })
    .eq('id', photo_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await log('photo_captioned', { photo_id, caption })

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { photo_id } = await req.json()
  const { data: photo } = await supabase
    .from('photos')
    .select('url, caption')
    .eq('id', photo_id)
    .single()
  if (!photo) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const filename = (photo.url as string).split('/').pop()!
  await supabase.storage.from(BUCKET).remove([filename])
  await supabase.from('photos').delete().eq('id', photo_id)

  await log('photo_deleted', { photo_id, url: photo.url, caption: photo.caption })

  return NextResponse.json({ ok: true })
}
