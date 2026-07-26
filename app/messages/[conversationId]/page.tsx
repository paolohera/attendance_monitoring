import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { MessageThread } from '@/components/MessageThread'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
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

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_one, participant_two')
    .eq('id', conversationId)
    .maybeSingle()

  // RLS already blocks non-participants from seeing this row at all,
  // so a null result here means either it doesn't exist or the
  // current user isn't part of it — either way, not found.
  if (!conversation) {
    notFound()
  }

  const otherId =
    conversation.participant_one === user.id
      ? conversation.participant_two
      : conversation.participant_one

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', otherId)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

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

        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
          otherParticipant={{
            id: otherProfile?.id ?? otherId,
            full_name: otherProfile?.full_name ?? 'Unknown',
            avatar_url: otherProfile?.avatar_url ?? null,
            role: otherProfile?.role ?? 'student',
          }}
          initialMessages={messages ?? []}
        />
      </main>
    </div>
  )
}