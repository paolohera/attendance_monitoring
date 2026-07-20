import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { EventScanner } from '@/components/EventScanner'

export default async function ScanPage({
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

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <AppHeader role={profile.role} />

      <main className="mx-auto max-w-md px-6 py-12">
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
          {event.title}
        </h1>
        <p className="mt-1 animate-fade-in-up text-sm text-[#3A362E]/60" style={{ animationDelay: '60ms' }}>
          Scan student QR codes at the door.
        </p>

        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <EventScanner event={{ id: event.id, title: event.title }} />
        </div>
      </main>
    </div>
  )
}