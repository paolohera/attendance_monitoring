import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const rows = (conversations ?? []).map((c) => {
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

        {rows.length === 0 && (
          <p className="mt-4 animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
            No conversations yet.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/messages/${row.id}`}
              className="clay-transition flex animate-fade-in-up items-center gap-3 rounded-2xl bg-white px-4 py-3 hover:-translate-y-0.5"
              style={{ ...cardShadow, animationDelay: `${80 + i * 30}ms` }}
            >
              {row.other?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={row.other.avatar_url}
                  alt=""
                  className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <ClayAvatar
                  tone={toneForName(row.other?.full_name ?? row.id)}
                  className="h-11 w-11 flex-shrink-0 rounded-full"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-[family-name:var(--font-display)] text-sm font-medium text-[#3A362E]">
                    {row.other?.full_name ?? 'Unknown'}
                  </p>
                  {row.other?.role && (
                    <span className="flex-shrink-0 rounded-full bg-[#DCEEE1] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#4C8266]">
                      {row.other.role}
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-xs ${
                    row.unreadCount > 0 ? 'font-medium text-[#3A362E]' : 'text-[#3A362E]/45'
                  }`}
                >
                  {row.lastMessage
                    ? `${row.lastMessage.sender_id === user.id ? 'You: ' : ''}${row.lastMessage.content}`
                    : 'No messages yet'}
                </p>
              </div>

              {row.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#D98D80] px-1.5 text-[10px] font-semibold text-white">
                  {row.unreadCount > 9 ? '9+' : row.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}