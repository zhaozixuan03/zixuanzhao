export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { log } from '@/lib/log'

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { event_type, payload } = await req.json()
  await log(event_type, payload)
  return NextResponse.json({ ok: true })
}
