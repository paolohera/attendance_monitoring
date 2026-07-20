import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { CreateEventForm } from '@/components/CreateEventForm'

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ssc' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile.role} />

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
              No events yet. Create one to get started.
            </p>
          )}

          {events?.map((event, i) => (
            <div
              key={event.id}
              className="clay-transition flex animate-fade-in-up items-center justify-between rounded-2xl bg-white px-5 py-4 hover:-translate-y-0.5"
              style={{ ...cardShadow, animationDelay: `${80 + i * 60}ms` }}
            >
              <div>
                <p className="font-[family-name:var(--font-display)] font-medium text-[#3A362E]">
                  {event.title}
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                  {new Date(event.start_time).toLocaleString()}
                  {event.location ? ` · ${event.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#DCEEE1] px-2.5 py-1 text-xs font-medium text-[#4C8266]">
                  {event.status}
                </span>
                <Link
                  href={`/staff/scan/${event.id}`}
                  className="clay-transition rounded-2xl bg-[#3A362E] px-3 py-1.5 text-xs font-medium text-white hover:-translate-y-0.5 active:translate-y-0"
                >
                  Scan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}