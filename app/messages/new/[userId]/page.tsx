import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { NewMessageComposer } from '@/components/NewMessageComposer'

export default async function NewConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: otherUserId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (otherUserId === user.id) {
    redirect('/messages')
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

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', otherUserId)
    .maybeSingle()

  if (!otherProfile) {
    notFound()
  }

  // If a conversation already exists between these two — from a real
  // prior exchange, or someone hitting this URL directly a second time
  // — send them to the real thread instead of risking a duplicate.
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) {
    redirect(`/messages/${existing.id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F3EFE7]">
      <AppHeader
        role={profile?.role ?? 'student'}
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name ?? undefined}
        gender={student?.gender}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        <Link
          href="/messages"
          className="clay-transition inline-flex w-fit items-center gap-1 text-sm text-[#3A362E]/50 hover:text-[#3A362E]"
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
          Messages
        </Link>

        <NewMessageComposer
          otherParticipant={{
            id: otherProfile.id,
            full_name: otherProfile.full_name ?? 'Unknown',
            avatar_url: otherProfile.avatar_url,
            role: otherProfile.role,
          }}
        />
      </main>
    </div>
  )
}