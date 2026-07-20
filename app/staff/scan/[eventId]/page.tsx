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
    <div className="min-h-screen">
      <AppHeader role={profile.role} />

      <main className="mx-auto max-w-md px-6 py-12">
        <Link href="/staff" className="text-sm text-[#1C2620]/50 hover:text-[#1C2620]">
          ← Back to events
        </Link>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1C2620]">
          {event.title}
        </h1>
        <p className="mt-1 text-sm text-[#1C2620]/60">Scan student QR codes at the door.</p>

        <div className="mt-6">
          <EventScanner event={{ id: event.id, title: event.title }} />
        </div>
      </main>
    </div>
  )
}