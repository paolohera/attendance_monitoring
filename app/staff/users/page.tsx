import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { ClayAvatar } from '@/components/ClayAvatar'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

const AVATAR_TONES = ['mint', 'peach', 'sky', 'blush'] as const

function toneForName(name: string) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

const ROLE_ORDER: Record<string, number> = { admin: 0, ssc: 1, student: 2 }

export default async function UsersPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/staff')
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')

  const studentIds = (allProfiles ?? [])
    .filter((p) => p.role === 'student')
    .map((p) => p.id)

  const { data: students } = studentIds.length
    ? await supabase
        .from('students')
        .select('id, student_id, section, gender')
        .in('id', studentIds)
    : { data: [] as { id: string; student_id: string; section: string; gender: 'male' | 'female' | null }[] }

  const rows = (allProfiles ?? [])
    .map((p) => ({
      ...p,
      student: students?.find((s) => s.id === p.id) ?? null,
    }))
    .sort((a, b) => {
      const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
      if (roleDiff !== 0) return roleDiff
      return (a.full_name ?? '').localeCompare(b.full_name ?? '')
    })

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader
        role={profile.role}
        avatarUrl={profile.avatar_url}
        fullName={profile.full_name ?? undefined}
      />

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
          Manage users
        </h1>
        <p
          className="mt-1 animate-fade-in-up text-sm text-[#3A362E]/55"
          style={{ animationDelay: '60ms' }}
        >
          Reset a password if someone gets locked out.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="flex animate-fade-in-up items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
              style={{ ...cardShadow, animationDelay: `${80 + i * 30}ms` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                {row.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={row.avatar_url}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                ) : row.student?.gender ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/avatars/${row.student.gender}.png`}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <ClayAvatar
                    tone={toneForName(row.full_name ?? row.id)}
                    className="h-10 w-10 flex-shrink-0 rounded-full"
                  />
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm font-medium text-[#3A362E]">
                    <span className="truncate">{row.full_name ?? 'Unnamed'}</span>
                    <span className="flex-shrink-0 rounded-full bg-[#DCEEE1] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#4C8266]">
                      {row.role}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/45">
                    {row.role === 'student' && row.student
                      ? `${row.student.student_id}${row.student.section ? ` · ${row.student.section}` : ''}`
                      : row.email}
                  </p>
                </div>
              </div>

              {row.id === user.id ? (
                <span className="flex-shrink-0 text-xs text-[#3A362E]/35">This is you</span>
              ) : (
                <div className="flex-shrink-0">
                  <ResetPasswordButton userId={row.id} userName={row.full_name ?? 'this user'} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}