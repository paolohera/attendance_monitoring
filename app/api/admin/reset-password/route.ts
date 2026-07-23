import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin'

const RATE_LIMIT_MAX_PER_HOUR = 10

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Re-check the caller's role server-side — never trust a role claim
  // sent from the client, only what's actually on their session.
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can reset other users\u2019 passwords.' },
      { status: 403 }
    )
  }

  let body: { targetUserId?: string; newPassword?: string; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { targetUserId, newPassword, reason } = body

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'Missing target user.' }, { status: 400 })
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: 'Use the Password tab on your own profile to change your password.' },
      { status: 400 }
    )
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    )
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return NextResponse.json(
      { error: 'Please note why this reset is happening (e.g. "Verified in person").' },
      { status: 400 }
    )
  }

  // Rate limit: an admin session that's compromised (or an admin going
  // rogue) shouldn't be able to silently loop through every account.
  // This uses the admin client since regular clients can't read this
  // table at all — see the RLS policy on admin_password_resets.
  const adminClient = createAdminClient()

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count: recentResetCount, error: rateLimitError } = await adminClient
    .from('admin_password_resets')
    .select('id', { count: 'exact', head: true })
    .eq('admin_id', user.id)
    .gte('created_at', oneHourAgo)

  if (rateLimitError) {
    console.error('Rate limit check failed:', rateLimitError)
    return NextResponse.json({ error: 'Could not verify rate limit. Try again.' }, { status: 500 })
  }

  if ((recentResetCount ?? 0) >= RATE_LIMIT_MAX_PER_HOUR) {
    return NextResponse.json(
      {
        error: `You've reset ${RATE_LIMIT_MAX_PER_HOUR} passwords in the last hour. Wait a bit before resetting more.`,
      },
      { status: 429 }
    )
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log after the reset succeeds — if this insert fails, the password
  // was still changed, so we don't want to report failure to the admin
  // for something the user's actual login already reflects. We just
  // log the logging failure itself for follow-up.
  const { error: logError } = await adminClient.from('admin_password_resets').insert({
    admin_id: user.id,
    target_user_id: targetUserId,
    reason: reason.trim(),
  })

  if (logError) {
    console.error('Failed to write password-reset audit log:', logError)
  }

  return NextResponse.json({ success: true })
}