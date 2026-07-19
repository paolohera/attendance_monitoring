import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { CreateEventForm } from '@/components/CreateEventForm'

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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ssc' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen">
      <AppHeader role={profile.role} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1C2620]">
            Events
          </h1>
          <CreateEventForm userId={user.id} />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {(!events || events.length === 0) && (
            <p className="text-sm text-[#1C2620]/60">
              No events yet. Create one to get started.
            </p>
          )}

          {events?.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl border border-[#1C2620]/10 bg-white px-5 py-4"
            >
              <div>
                <p className="font-[family-name:var(--font-display)] font-medium text-[#1C2620]">
                  {event.title}
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#1C2620]/50">
                  {new Date(event.start_time).toLocaleString()}
                  {event.location ? ` · ${event.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#E3EFE7] px-2.5 py-1 text-xs font-medium text-[#2F6F4E]">
                  {event.status}
                </span>
                <Link
                  href={`/staff/scan/${event.id}`}
                  className="rounded-md bg-[#1C2620] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1C2620]/85"
                >
                  Scan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}