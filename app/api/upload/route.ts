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

  return NextResponse.json({ url: publicUrl })
}
