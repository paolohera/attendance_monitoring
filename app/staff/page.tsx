import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { CreateEventForm } from '@/components/CreateEventForm'
import { StaffEventCard } from '@/components/StaffEventCard'

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
        <div className="flex animate-fade-in-up items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
            Events
          </h1>
          <CreateEventForm userId={user.id} />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {(!events || events.length === 0) && (
            <p className="animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
              No upcoming events. Create one to get started.
            </p>
          )}

          {events?.map((event, i) => (
            <StaffEventCard
              key={event.id}
              event={event}
              userId={user.id}
              animationDelay={`${80 + i * 60}ms`}
            />
          ))}
        </div>
      </main>
    </div>
  )
}