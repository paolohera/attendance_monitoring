import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { StaffEventsList } from '@/components/StaffEventsList'

// Keep an event visible/scannable for a while after its official end
// time, so anyone who timed in still has a window to time out instead
// of the event just vanishing from the SSC/admin dashboard.
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

export default async function StaffPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ssc' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const cutoffIso = new Date(Date.now() - GRACE_PERIOD_MS).toISOString()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .gt('end_time', cutoffIso)
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile.role} avatarUrl={profile.avatar_url} fullName={profile.full_name ?? undefined} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <StaffEventsList initialEvents={events ?? []} userId={user.id} />
      </main>
    </div>
  )
}