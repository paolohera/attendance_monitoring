import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
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

  const fullName = profile?.full_name ?? 'Student'

  return (
    <div className="min-h-screen">
      <AppHeader role={profile?.role ?? 'student'} />

      <main className="mx-auto max-w-md px-6 py-12">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#1C2620]/50">
          Your attendance pass
        </p>

        <div className="mt-3 flex overflow-hidden rounded-2xl border border-[#1C2620]/10 bg-white shadow-sm">
          <div className="flex w-20 flex-shrink-0 items-center justify-center bg-[#2F6F4E] font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            {getInitials(fullName)}
          </div>
          <div className="flex-1 border-l border-dashed border-[#1C2620]/15 px-5 py-4">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1C2620]">
              {fullName}
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm text-[#1C2620]/60">
              {student?.student_id ?? '—'}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-[#E3EFE7] px-2.5 py-1 text-xs font-medium text-[#2F6F4E]">
                {student?.section ?? 'No section'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[#1C2620]/50">
            Upcoming events
          </h2>
          <p className="mt-3 text-sm text-[#1C2620]/60">
            Nothing yet — events you can check in to will show up here once SSC creates them.
          </p>
        </div>
      </main>
    </div>
  )
}