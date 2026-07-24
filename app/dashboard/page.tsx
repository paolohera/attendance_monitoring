import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { EventQRButton } from '@/components/EventQRButton'
import { ClayAvatar } from '@/components/ClayAvatar'
import { EventStatusBadge } from '@/components/EventStatusBadge'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
}

// How long an event stays visible/scannable after its official end
// time — students (and SSC/admin) who timed in still need a window
// to time out, so the event can't just vanish the instant the clock
// hits end_time.
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

const AVATAR_TONES = ['mint', 'peach', 'sky', 'blush'] as const

function toneForName(name: string) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: student } = await supabase
    .from('students')
    .select('student_id, section, gender')
    .eq('id', user.id)
    .single()

  // An event with end_time >= this cutoff is still within its grace
  // period (i.e. end_time + GRACE_PERIOD_MS >= now), so it stays
  // visible even though it's technically "ended".
  const cutoffIso = new Date(Date.now() - GRACE_PERIOD_MS).toISOString()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .gte('end_time', cutoffIso)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  const eventIds = events?.map((e) => e.id) ?? []

  const { data: myAttendance } = eventIds.length
    ? await supabase
        .from('attendance')
        .select('event_id, time_in, time_out')
        .eq('student_id', user.id)
        .in('event_id', eventIds)
    : { data: [] as { event_id: string; time_in: string | null; time_out: string | null }[] }

  const fullName = profile?.full_name ?? 'Student'

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader
        role={profile?.role ?? 'student'}
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name ?? undefined}
        gender={student?.gender}
      />

      <main className="mx-auto max-w-md px-6 py-12">
        <p className="animate-fade-in-up font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#3A362E]/45">
          Your attendance pass
        </p>

        <div
          className="relative mt-3 flex animate-fade-in-up items-center gap-4 rounded-[28px] bg-white px-5 py-5"
          style={{ ...clayShadow, animationDelay: '60ms' }}
        >
          <Link
            href="/dashboard/history"
            aria-label="View attendance history"
            title="Attendance history"
            className="clay-transition absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#3A362E]/45 hover:bg-[#3A362E]/5 hover:text-[#3A362E]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12a9 9 0 1 0 3-6.7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M3 4v5h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v4l3 2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {profile?.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
              style={{
                boxShadow:
                  '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
              }}
            />
          ) : student?.gender ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/avatars/${student.gender}.png`}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
              style={{
                boxShadow:
                  '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
              }}
            />
          ) : (
            <ClayAvatar
              tone={toneForName(fullName)}
              className="h-16 w-16 flex-shrink-0 rounded-full"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#3A362E]">
              {fullName}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-[family-name:var(--font-mono)] text-sm text-[#3A362E]/50">
                {student?.student_id ?? '—'}
              </span>
              <span className="flex-shrink-0 rounded-full bg-[#DCEEE1] px-2.5 py-1 text-xs font-medium text-[#4C8266]">
                {student?.section ?? 'No section'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[#3A362E]/45">
            Upcoming events
          </h2>

          {(!events || events.length === 0) && (
            <p className="mt-3 text-sm text-[#3A362E]/55">
              Nothing yet — events you can check in to will show up here once
              SSC creates them.
            </p>
          )}

          <div className="mt-3 flex flex-col gap-3">
            {events?.map((event, i) => (
              <div
                key={event.id}
                className="clay-transition flex animate-fade-in-up items-center justify-between gap-3 rounded-2xl bg-white p-4 hover:-translate-y-0.5"
                style={{
                  boxShadow:
                    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
                  animationDelay: `${180 + i * 60}ms`,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-display)] font-semibold text-[#3A362E]">
                    {event.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[#4C8266]">
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
                  <div className="mt-1.5">
                    <EventStatusBadge status={event.status} endTime={event.end_time} />
                  </div>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#3A362E]/45">
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

                <div className="flex flex-shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/attendance/${event.id}`}
                    aria-label={`View your attendance for ${event.title}`}
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

                  <EventQRButton
                    event={{ id: event.id, title: event.title, end_time: event.end_time }}
                    userId={user.id}
                    attendance={
                      myAttendance?.find((a) => a.event_id === event.id) ?? null
                    }
                    requiresTimeOut={event.requires_time_out}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}