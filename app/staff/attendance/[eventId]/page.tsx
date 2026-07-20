import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

export default async function EventAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
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

  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .single()

  if (!event) {
    notFound()
  }

  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, time_in, time_out, status')
    .eq('event_id', eventId)
    .order('time_in', { ascending: true })

  const studentIds = attendance?.map((a) => a.student_id) ?? []

  const [{ data: students }, { data: profiles }] = await Promise.all([
    studentIds.length
      ? supabase.from('students').select('id, student_id, section').in('id', studentIds)
      : Promise.resolve({ data: [] as { id: string; student_id: string; section: string }[] }),
    studentIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ])

  const rows = (attendance ?? []).map((a) => ({
    ...a,
    student: students?.find((s) => s.id === a.student_id),
    name: profiles?.find((p) => p.id === a.student_id)?.full_name ?? 'Unknown',
  }))

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile.role} />

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

        <div className="mt-3 flex animate-fade-in-up items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
            {event.title}
          </h1>
          <span className="font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
            {rows.length} checked in
          </span>
        </div>

        {rows.length === 0 && (
          <p className="mt-4 animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
            No one has checked in yet.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex animate-fade-in-up items-center justify-between rounded-2xl bg-white px-4 py-3"
              style={{ ...cardShadow, animationDelay: `${80 + i * 40}ms` }}
            >
              <div>
                <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[#3A362E]">
                  {row.name}
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                  {row.student?.student_id ?? '—'}
                  {row.student?.section ? ` · ${row.student.section}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-[family-name:var(--font-mono)] text-xs ${
                    row.status === 'late' ? 'font-semibold text-[#B3453A]' : 'text-[#3A362E]/60'
                  }`}
                >
                  {row.status === 'late' ? 'Late' : 'In'}:{' '}
                  {row.time_in ? new Date(row.time_in).toLocaleTimeString() : '—'}
                </p>
                {row.time_out && (
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/60">
                    Out: {new Date(row.time_out).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}