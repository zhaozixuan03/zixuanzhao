import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password, action } = await req.json()

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true })
    res.cookies.delete(SESSION_COOKIE_NAME)
    return res
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return res
}
