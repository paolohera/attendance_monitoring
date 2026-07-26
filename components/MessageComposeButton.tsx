'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

export function MessageComposeButton({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: userId,
    })

    setLoading(false)

    if (rpcError || !data) {
      setError('Could not start conversation.')
      return
    }

    router.push(`/messages/${data}`)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={`Message ${userName}`}
        title={`Message ${userName}`}
        className="clay-transition flex h-8 w-8 items-center justify-center rounded-full text-[#4C8266] hover:bg-[#DCEEE1] hover:text-[#3A362E] disabled:opacity-50"
      >
        {loading ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {error && <p className="text-[11px] text-[#B3453A]">{error}</p>}
    </div>
  )
}