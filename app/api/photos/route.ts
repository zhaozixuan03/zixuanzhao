export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'

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
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { photo_id } = await req.json()
  const { data: photo } = await supabase
    .from('photos')
    .select('url')
    .eq('id', photo_id)
    .single()
  if (!photo) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const filename = (photo.url as string).split('/').pop()!
  await supabase.storage.from(BUCKET).remove([filename])
  await supabase.from('photos').delete().eq('id', photo_id)
  return NextResponse.json({ ok: true })
}
