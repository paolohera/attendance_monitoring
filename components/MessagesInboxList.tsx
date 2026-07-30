'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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

type OtherProfile = { id: string; full_name: string; avatar_url: string | null; role: string }
type MessageRow = {
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export type ConversationRow = {
  id: string
  other: OtherProfile | undefined
  lastMessage: MessageRow | null
  unreadCount: number
}

async function fetchInbox(currentUserId: string): Promise<ConversationRow[]> {
  const supabase = createClient()

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, participant_one, participant_two, last_message_at')
    .or(`participant_one.eq.${currentUserId},participant_two.eq.${currentUserId}`)
    .order('last_message_at', { ascending: false })

  if (convError) throw convError

  const otherIds = (conversations ?? []).map((c) =>
    c.participant_one === currentUserId ? c.participant_two : c.participant_one
  )

  const { data: otherProfiles } = otherIds.length
    ? await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', otherIds)
    : { data: [] as OtherProfile[] }

  const conversationIds = (conversations ?? []).map((c) => c.id)

  const { data: allMessages } = conversationIds.length
    ? await supabase
        .from('messages')
        .select('conversation_id, sender_id, content, created_at, read_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
    : { data: [] as MessageRow[] }

  return (conversations ?? []).map((c) => {
    const otherId = c.participant_one === currentUserId ? c.participant_two : c.participant_one
    const other = otherProfiles?.find((p) => p.id === otherId)
    const messagesForThis = (allMessages ?? []).filter((m) => m.conversation_id === c.id)
    const lastMessage = messagesForThis[0] ?? null
    const unreadCount = messagesForThis.filter(
      (m) => m.sender_id !== currentUserId && m.read_at === null
    ).length

    return { id: c.id, other, lastMessage, unreadCount }
  })
}

export function MessagesInboxList({
  initialRows,
  currentUserId,
}: {
  initialRows: ConversationRow[]
  currentUserId: string
}) {
  // Same pattern as StaffEventsList: render instantly from what the
  // server already fetched, cache under a stable key so leaving and
  // returning to /messages serves the list immediately instead of
  // re-running three queries every single visit.
  const { data: rows } = useSWR<ConversationRow[]>(
    ['messages-inbox', currentUserId],
    () => fetchInbox(currentUserId),
    {
      fallbackData: initialRows,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  )

  const visibleRows = (rows ?? []).filter((row) => row.lastMessage !== null)

  if (visibleRows.length === 0) {
    return (
      <p className="mt-4 animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
        No conversations yet.
      </p>
    )
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      {visibleRows.map((row, i) => (
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
                ? `${row.lastMessage.sender_id === currentUserId ? 'You: ' : ''}${row.lastMessage.content}`
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
  )
}