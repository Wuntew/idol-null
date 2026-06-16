// Shared-secret admin gate. Mirrors the CRON_SECRET bearer-token pattern already
// used by app/api/cron/simulate/route.ts. No session/JWT infra: the cookie value
// IS the secret, compared with ===. Must stay crypto-free — middleware.ts runs on
// the Edge runtime, which has no Node `crypto` module.
export const ADMIN_COOKIE = 'idolnull_admin'

export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_SECRET
}

export function checkAdminPassword(password: string): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return password === secret
}

export function isValidAdminCookie(value: string | undefined | null): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret || !value) return false
  return value === secret
}
