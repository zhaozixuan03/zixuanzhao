export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

const BUCKET = 'images'

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${uuidv4()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  // Also record in photos table (standalone tracking)
  await supabase.from('photos').insert({ url: publicUrl })

  return NextResponse.json({ url: publicUrl })
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
