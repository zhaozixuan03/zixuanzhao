import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'zxz_session'
const SESSION_VALUE = 'authenticated'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export function isAuthenticatedFromRequest(req: NextRequest): boolean {
  return req.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export function checkPassword(password: string): boolean {
  return password === process.env.SITE_PASSWORD
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_COOKIE_VALUE = SESSION_VALUE
