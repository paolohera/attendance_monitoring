import { createClient } from '@supabase/supabase-js'

// Server-only client using the service role key. This bypasses RLS
// entirely, so it must NEVER be imported into a 'use client' component
// or anything that ships to the browser — only API routes / server
// actions. The service role key itself must live in `.env.local` as
// SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix, so Next.js never
// inlines it into client bundles).

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}