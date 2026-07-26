'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClayAvatar } from '@/components/ClayAvatar'
import { Spinner } from '@/components/Spinner'

const AVATAR_TONES = ['mint', 'peach', 'sky', 'blush'] as const

function toneForName(name: string) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

const inputShadow = {
  boxShadow:
    'inset 4px 4px 10px rgba(168,155,130,0.22), inset -4px -4px 10px rgba(255,255,255,0.85)',
}

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

type OtherParticipant = {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherParticipant,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  otherParticipant: OtherParticipant
  initialMessages: Message[]
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set(initialMessages.map((m) => m.id)))

  // Mark anything from the other person as read the moment this
  // thread is opened.
  useEffect(() => {
    const unreadIds = initialMessages
      .filter((m) => m.sender_id !== currentUserId && m.read_at === null)
      .map((m) => m.id)

    if (unreadIds.length === 0) return

    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .then(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`thread-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          if (seenIds.current.has(incoming.id)) return
          seenIds.current.add(incoming.id)
          setMessages((prev) => [...prev, incoming])

          // If it's from the other person and this thread is open,
          // mark it read right away.
          if (incoming.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', incoming.id)
              .then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, supabase])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return

    setSending(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select('id, sender_id, content, created_at, read_at')
      .single()

    setSending(false)

    if (insertError || !data) {
      setError('Could not send. Try again.')
      return
    }

    seenIds.current.add(data.id)
    setMessages((prev) => [...prev, data])
    setDraft('')
  }

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-[#3A362E]/8 pb-4">
        {otherParticipant.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={otherParticipant.avatar_url}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <ClayAvatar
            tone={toneForName(otherParticipant.full_name)}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          />
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#3A362E]">
            {otherParticipant.full_name}
            <span className="rounded-full bg-[#DCEEE1] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#4C8266]">
              {otherParticipant.role}
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-[#3A362E]/45">
            No messages yet — say hello.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine
                      ? 'bg-[#8FC1A3] text-[#28402F]'
                      : 'bg-white text-[#3A362E]'
                  }`}
                  style={
                    isMine
                      ? undefined
                      : {
                          boxShadow:
                            '4px 4px 10px rgba(168,155,130,0.2), -3px -3px 8px rgba(255,255,255,0.9)',
                        }
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`mt-1 text-right font-[family-name:var(--font-mono)] text-[10px] ${
                      isMine ? 'text-[#28402F]/60' : 'text-[#3A362E]/40'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'Asia/Manila',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#3A362E]/8 pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          style={inputShadow}
          className="flex-1 rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          style={{
            boxShadow:
              '4px 4px 10px rgba(168,155,130,0.28), -3px -3px 8px rgba(255,255,255,0.9)',
          }}
          className="clay-transition flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#8FC1A3] text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          {sending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12l16-8-6 8 6 8-16-8z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-[#B3453A]">{error}</p>}
    </div>
  )
}