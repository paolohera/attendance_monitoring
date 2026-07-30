import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { MessagesInboxList, type ConversationRow } from '@/components/MessagesInboxList'

export default async function MessagesInboxPage() {
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

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_one, participant_two, last_message_at')
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  const otherIds = (conversations ?? []).map((c) =>
    c.participant_one === user.id ? c.participant_two : c.participant_one
  )

  const { data: otherProfiles } = otherIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', otherIds)
    : { data: [] as { id: string; full_name: string; avatar_url: string | null; role: string }[] }

  const conversationIds = (conversations ?? []).map((c) => c.id)

  const { data: allMessages } = conversationIds.length
    ? await supabase
        .from('messages')
        .select('conversation_id, sender_id, content, created_at, read_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
    : { data: [] as { conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null }[] }

  const initialRows: ConversationRow[] = (conversations ?? []).map((c) => {
    const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one
    const other = otherProfiles?.find((p) => p.id === otherId)
    const messagesForThis = (allMessages ?? []).filter((m) => m.conversation_id === c.id)
    const lastMessage = messagesForThis[0] ?? null
    const unreadCount = messagesForThis.filter(
      (m) => m.sender_id !== user.id && m.read_at === null
    ).length

    return {
      id: c.id,
      other,
      lastMessage,
      unreadCount,
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
          Messages
        </h1>

        <MessagesInboxList initialRows={initialRows} currentUserId={user.id} />
      </main>
    </div>
  )
}