import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { CreateEventForm } from '@/components/CreateEventForm'
import { EventQRButton } from '@/components/EventQRButton'
import { EditEventForm } from '@/components/EditEventForm'

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
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ssc' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .gt('end_time', new Date().toISOString())
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
            <div
              key={event.id}
              className="clay-transition flex animate-fade-in-up flex-col gap-3 rounded-2xl bg-white p-4 hover:-translate-y-0.5"
              style={{ ...cardShadow, animationDelay: `${80 + i * 60}ms` }}
            >
              <p className="font-[family-name:var(--font-display)] font-semibold text-[#3A362E]">
                {event.title}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[#4C8266]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  {new Date(event.start_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'Asia/Manila',
                  })}
                </p>
                <span className="rounded-full bg-[#DCEEE1] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#4C8266]">
                  {event.status}
                </span>
                {event.location && (
                  <p className="flex items-center gap-1.5 text-xs text-[#3A362E]/45">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path
                        d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    {event.location}
                  </p>
                )}
              </div>

              <div className="flex flex-shrink-0 items-center justify-end gap-2">
                <EditEventForm
                  event={{
                    id: event.id,
                    title: event.title,
                    location: event.location,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    requires_time_out: event.requires_time_out,
                  }}
                />
                <EventQRButton
                  event={{ id: event.id, title: event.title, end_time: event.end_time }}
                  userId={user.id}
                />
                <Link
                  href={`/staff/attendance/${event.id}`}
                  aria-label={`View attendance for ${event.title}`}
                  title="Attendance"
                  style={{
                    boxShadow:
                      '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
                  }}
                  className="clay-transition flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3A362E]/70 hover:-translate-y-0.5 hover:text-[#3A362E] active:translate-y-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </Link>
                <Link
                  href={`/staff/scan/${event.id}`}
                  aria-label={`Scan for ${event.title}`}
                  title="Scan"
                  className="clay-transition flex h-9 w-9 items-center justify-center rounded-full bg-[#3A362E] text-white hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" fill="currentColor" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}