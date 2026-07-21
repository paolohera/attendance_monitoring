import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: student } = await supabase
    .from('students')
    .select('student_id, section, gender')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader
        role={profile?.role ?? 'student'}
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name ?? undefined}
        gender={student?.gender}
      />

      <main className="mx-auto max-w-sm px-6 py-12">
        <Link
          href={profile?.role === 'student' ? '/dashboard' : '/staff'}
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
          Your profile
        </h1>
        <p
          className="mt-1 animate-fade-in-up text-sm text-[#3A362E]/55"
          style={{ animationDelay: '60ms' }}
        >
          Update your details and photo.
        </p>

        <ProfileForm
          userId={user.id}
          email={profile?.email ?? user.email ?? ''}
          fullName={profile?.full_name ?? ''}
          avatarUrl={profile?.avatar_url ?? null}
          role={profile?.role ?? 'student'}
          studentId={student?.student_id ?? null}
          section={student?.section ?? ''}
          gender={student?.gender ?? null}
        />
      </main>
    </div>
  )
}