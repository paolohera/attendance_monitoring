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
        className="clay-transition flex items-center gap-1.5 text-xs font-medium text-[#4C8266] hover:text-[#3A362E] disabled:opacity-50"
      >
        {loading && <Spinner className="h-3.5 w-3.5" />}
        Message
      </button>
      {error && <p className="text-[11px] text-[#B3453A]">{error}</p>}
    </div>
  )
}