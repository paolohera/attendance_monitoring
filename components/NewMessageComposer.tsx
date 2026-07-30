'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

type OtherParticipant = {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

export function NewMessageComposer({
  otherParticipant,
}: {
  otherParticipant: OtherParticipant
}) {
  const supabase = createClient()
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return

    setSending(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('send_first_message', {
      p_other_user_id: otherParticipant.id,
      p_content: content,
    })

    if (rpcError || !data || data.length === 0) {
      setSending(false)
      setError('Could not send message. Try again.')
      return
    }

    // The conversation now genuinely exists (with this message already
    // in it) — hand off to the real thread view from here on out.
    router.replace(`/messages/${data[0].conversation_id}`)
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

      <div className="flex-1 py-4">
        <p className="mt-8 text-center text-sm text-[#3A362E]/45">
          Nothing is saved until you send a message.
        </p>
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#3A362E]/8 pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          autoFocus
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