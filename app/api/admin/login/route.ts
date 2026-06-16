import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, checkAdminPassword, isAdminConfigured } from '@/lib/admin/auth'

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment. Set ADMIN_SECRET.' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
