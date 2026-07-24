import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

export default async function StaffHistoryPage() {
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

  // Mirror of the GRACE_PERIOD_MS cutoff used in app/staff/page.tsx —
  // an event only moves here once its time-out grace window is fully
  // over. If these two cutoffs ever drift apart, the same event can
  // show up in both "Events" and "Event history" at once.
  const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour
  const cutoffIso = new Date(Date.now() - GRACE_PERIOD_MS).toISOString()

  // Past events: grace period fully elapsed, or explicitly cancelled —
  // either way, no longer relevant for scanning, only for looking back at.
  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status')
    .or(`end_time.lt.${cutoffIso},status.eq.cancelled`)
    .order('start_time', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile.role} avatarUrl={profile.avatar_url} fullName={profile.full_name ?? undefined} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/staff"
          className="clay-transition inline-flex items-center gap-1 text-sm text-[#3A362E]/50 hover:text-[#3A362E]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12.5L5.5 8L10 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to events
        </Link>

        <h1 className="mt-3 animate-fade-in-up font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
          Event history
        </h1>
        <p
          className="mt-1 animate-fade-in-up text-sm text-[#3A362E]/55"
          style={{ animationDelay: '60ms' }}
        >
          Past and cancelled events move here automatically.
        </p>

        {(!events || events.length === 0) && (
          <p
            className="mt-4 animate-fade-in-up text-sm text-[#3A362E]/55"
            style={{ animationDelay: '100ms' }}
          >
            Nothing here yet.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {events?.map((event, i) => (
            <div
              key={event.id}
              className="clay-transition flex animate-fade-in-up items-center justify-between gap-3 rounded-2xl bg-white p-4 hover:-translate-y-0.5"
              style={{ ...cardShadow, animationDelay: `${100 + i * 50}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-display)] font-semibold text-[#3A362E]">
                  {event.title}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {new Date(event.start_time).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <span className="rounded-full bg-[#3A362E]/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#3A362E]/50">
                    {event.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                  </span>
                </div>
                {event.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#3A362E]/40">
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

              <Link
                href={`/staff/attendance/${event.id}`}
                aria-label={`View attendance for ${event.title}`}
                title="Attendance"
                style={{
                  boxShadow:
                    '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
                }}
                className="clay-transition flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#3A362E]/70 hover:-translate-y-0.5 hover:text-[#3A362E] active:translate-y-0"
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
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}