'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

export function MessageComposeButton({
  userId,
  userName,
  currentUserId,
}: {
  userId: string
  userName: string
  currentUserId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    // Only look — never create here. A conversation row should only
    // ever come into existence together with its first real message
    // (see send_first_message), so clicking "Message" and backing out
    // without typing anything doesn't leave an empty conversation behind.
    const { data: existing, error: queryError } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_one.eq.${currentUserId},participant_two.eq.${userId}),and(participant_one.eq.${userId},participant_two.eq.${currentUserId})`
      )
      .maybeSingle()

    setLoading(false)

    if (queryError) {
      setError('Could not open conversation.')
      return
    }

    router.push(existing ? `/messages/${existing.id}` : `/messages/new/${userId}`)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={`Message ${userName}`}
        className="clay-transition flex items-center gap-1.5 text-xs font-medium text-[#4C8266] hover:text-[#3A362E] disabled:opacity-50"
      >
        {loading && <Spinner className="h-3.5 w-3.5" />}
        Message
      </button>
      {error && <p className="text-[11px] text-[#B3453A]">{error}</p>}
    </div>
  )
}