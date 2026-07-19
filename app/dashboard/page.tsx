import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { EventQRButton } from '@/components/EventQRButton'
import { ClayAvatar } from '@/components/ClayAvatar'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
}

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { data: student } = await supabase
    .from('students')
    .select('student_id, section')
    .eq('id', user.id)
    .single()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status')
    .in('status', ['upcoming', 'ongoing'])
    .order('start_time', { ascending: true })

  const fullName = profile?.full_name ?? 'Student'

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile?.role ?? 'student'} />

      <main className="mx-auto max-w-md px-6 py-12">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#3A362E]/45">
          Your attendance pass
        </p>

        <div
          className="mt-3 flex items-center gap-4 rounded-[28px] bg-white px-5 py-5"
          style={clayShadow}
        >
          <ClayAvatar
            tone={toneForName(fullName)}
            className="h-16 w-16 flex-shrink-0 rounded-full"
          />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#3A362E]">
              {fullName}
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm text-[#3A362E]/50">
              {student?.student_id ?? '—'}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-[#DCEEE1] px-2.5 py-1 text-xs font-medium text-[#4C8266]">
                {student?.section ?? 'No section'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10">
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
            {events?.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                style={{
                  boxShadow:
                    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
                }}
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
                <EventQRButton
                  event={{ id: event.id, title: event.title, end_time: event.end_time }}
                  userId={user.id}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}