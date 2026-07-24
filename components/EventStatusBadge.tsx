'use client'

import { useEffect, useState } from 'react'

// Keep this in sync with the GRACE_PERIOD_MS used in the server
// components that decide whether an event still shows up at all
// (app/staff/page.tsx, app/dashboard/page.tsx, EventQRButton.tsx).
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export function EventStatusBadge({
  status,
  endTime,
}: {
  status: string
  endTime: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (status === 'cancelled') {
    return (
      <span className="rounded-full bg-[#F3D9D4] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#B3453A]">
        cancelled
      </span>
    )
  }

  const end = new Date(endTime).getTime()
  const graceEnd = end + GRACE_PERIOD_MS
  const hasEnded = now >= end
  const inGracePeriod = hasEnded && now < graceEnd

  if (inGracePeriod) {
    return (
      <span className="rounded-full bg-[#F0DDBB] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#8A6A2F]">
        Ended · {formatRemaining(graceEnd - now)} to time out
      </span>
    )
  }

  if (hasEnded) {
    // Shouldn't normally render — pages filter these out entirely once
    // the grace period is over — but fall back gracefully just in case.
    return (
      <span className="rounded-full bg-[#3A362E]/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#3A362E]/50">
        ended
      </span>
    )
  }

  return (
    <span className="rounded-full bg-[#DCEEE1] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#4C8266]">
      {status}
    </span>
  )
}