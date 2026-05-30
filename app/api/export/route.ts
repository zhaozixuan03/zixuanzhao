export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAuthenticatedFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [{ data: posts }, { data: photos }, { data: activity_log }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('photos').select('*').order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }),
  ])

  const date = new Date().toISOString().slice(0, 10)
  const body = JSON.stringify({ exported_at: new Date().toISOString(), posts, photos, activity_log }, null, 2)

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="zorazhao-export-${date}.json"`,
    },
  })
}
