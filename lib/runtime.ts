export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const SUPABASE_SERVICE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Hard requirements — cron will not run without these
export function getMissingProductionEnv() {
  return [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
  ].filter(name => !process.env[name])
}

// Advisory — simulation runs without these; AI features are skipped gracefully
export function getMissingAiEnv() {
  return [
    'DEEPSEEK_API_KEY',
  ].filter(name => !process.env[name])
}
