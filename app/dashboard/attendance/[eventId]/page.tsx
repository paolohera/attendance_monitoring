    import { createClient } from '@/lib/supabase/server'
    import { redirect, notFound } from 'next/navigation'
    import Link from 'next/link'
    import { AppHeader } from '@/components/AppHeader'
    import { ClayAvatar } from '@/components/ClayAvatar'

    const cardShadow = {
    boxShadow:
        '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
    }

    const AVATAR_TONES = ['mint', 'peach', 'sky', 'blush'] as const

    function toneForName(name: string) {
    const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_TONES[sum % AVATAR_TONES.length]
    }

    export default async function MyEventAttendancePage({
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
        .select('role, full_name, avatar_url')
        .eq('id', user.id)
        .single()

    const { data: student } = await supabase
        .from('students')
        .select('gender')
        .eq('id', user.id)
        .maybeSingle()

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
        ? supabase
            .from('students')
            .select('id, student_id, section, gender')
            .in('id', studentIds)
        : Promise.resolve({
            data: [] as { id: string; student_id: string; section: string; gender: 'male' | 'female' | null }[],
            }),
        studentIds.length
        ? supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', studentIds)
        : Promise.resolve({
            data: [] as { id: string; full_name: string; avatar_url: string | null; role: string }[],
            }),
    ])

    const rows = (attendance ?? []).map((a) => {
        const attendee = students?.find((s) => s.id === a.student_id)
        const attendeeProfile = profiles?.find((p) => p.id === a.student_id)
        return {
        ...a,
        student: attendee,
        name: attendeeProfile?.full_name ?? 'Unknown',
        avatarUrl: attendeeProfile?.avatar_url ?? null,
        gender: attendee?.gender ?? null,
        role: attendeeProfile?.role ?? 'student',
        isYou: a.student_id === user.id,
        }
    })

    return (
        <div className="min-h-screen bg-[#F3EFE7]">
        <AppHeader
            role={profile?.role ?? 'student'}
            avatarUrl={profile?.avatar_url}
            fullName={profile?.full_name ?? undefined}
            gender={student?.gender}
        />

        <main className="mx-auto max-w-2xl px-6 py-12">
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
                className={`flex animate-fade-in-up items-center justify-between rounded-2xl bg-white px-4 py-3 ${
                    row.role !== 'student' ? 'border-2 border-[#8FC1A3]' : row.isYou ? 'border-2 border-[#3A362E]/20' : ''
                }`}
                style={{ ...cardShadow, animationDelay: `${80 + i * 40}ms` }}
                >
                <div className="flex min-w-0 items-center gap-3">
                    {row.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={row.avatarUrl}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                    ) : row.gender ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={`/avatars/${row.gender}.png`}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                    ) : (
                    <ClayAvatar
                        tone={toneForName(row.name)}
                        className="h-10 w-10 flex-shrink-0 rounded-full"
                    />
                    )}
                    <div className="min-w-0">
                    <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[#3A362E]">
                        {row.name}
                        {row.isYou && <span className="ml-1.5 text-xs font-normal text-[#3A362E]/40">(You)</span>}
                    </p>
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                        {row.role === 'student'
                        ? `${row.student?.student_id ?? '—'}${row.student?.section ? ` · ${row.student.section}` : ''}`
                        : 'Staff check-in'}
                    </p>
                    </div>
                </div>
                <div className="flex flex-col items-end justify-between self-stretch text-right">
                    <div>
                    <p
                        className={`font-[family-name:var(--font-mono)] text-xs ${
                        row.status === 'late' ? 'font-semibold text-[#B3453A]' : 'text-[#3A362E]/60'
                        }`}
                    >
                        {row.status === 'late' ? 'Late' : 'In'}:{' '}
                        {row.time_in
                        ? new Date(row.time_in).toLocaleTimeString('en-US', {
                            timeZone: 'Asia/Manila',
                            hour: 'numeric',
                            minute: '2-digit',
                            })
                        : '—'}
                    </p>
                    {row.time_out && (
                        <p className="font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/60">
                        Out:{' '}
                        {new Date(row.time_out).toLocaleTimeString('en-US', {
                            timeZone: 'Asia/Manila',
                            hour: 'numeric',
                            minute: '2-digit',
                        })}
                        </p>
                    )}
                    </div>
                    {row.role !== 'student' && (
                    <span className="mt-1 rounded-full bg-[#DCEEE1] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#4C8266]">
                        {row.role}
                    </span>
                    )}
                </div>
                </div>
            ))}
            </div>
        </main>
        </div>
    )
    }