import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

type AttendanceRow = {
  time_in: string | null
  time_out: string | null
  status: string
  events: { title: string; location: string | null } | null
}

export default async function HistoryPage() {
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

  const { data: student } = await supabase
    .from('students')
    .select('gender')
    .eq('id', user.id)
    .maybeSingle()

  const { data: attendance } = await supabase
    .from('attendance')
    .select('time_in, time_out, status, events(title, location)')
    .eq('student_id', user.id)
    .order('time_in', { ascending: false })
    .returns<AttendanceRow[]>()

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader
        role={profile?.role ?? 'student'}
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name ?? undefined}
        gender={student?.gender}
      />

      <main className="mx-auto max-w-md px-6 py-12">
        <Link
          href="/dashboard"
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
          Back
        </Link>

        <h1 className="mt-3 animate-fade-in-up font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
          Attendance history
        </h1>

        {(!attendance || attendance.length === 0) && (
          <p className="mt-4 animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
            No attendance recorded yet.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {attendance?.map((row, i) => (
            <div
              key={i}
              className="animate-fade-in-up rounded-2xl bg-white px-4 py-3"
              style={{ ...cardShadow, animationDelay: `${80 + i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="font-[family-name:var(--font-display)] font-medium text-[#3A362E]">
                  {row.events?.title ?? 'Unknown event'}
                </p>
                <span className="rounded-full bg-[#DCEEE1] px-2.5 py-1 text-xs font-medium text-[#4C8266]">
                  {row.status}
                </span>
              </div>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                In:{' '}
                {row.time_in
                  ? new Date(row.time_in).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Manila',
                    })
                  : '—'}
              </p>
              {row.time_out && (
                <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                  Out:{' '}
                  {new Date(row.time_out).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Manila',
                  })}
                </p>
              )}
              {row.events?.location && (
                <p className="mt-1 text-xs text-[#3A362E]/40">{row.events.location}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}