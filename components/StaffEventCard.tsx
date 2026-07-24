'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EditEventForm } from '@/components/EditEventForm'
import { EventQRButton } from '@/components/EventQRButton'

// Keep in sync with the GRACE_PERIOD_MS used in app/staff/page.tsx,
// app/dashboard/page.tsx, app/staff/history/page.tsx, and
// EventQRButton.tsx.
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

const cardShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.25), -5px -5px 12px rgba(255,255,255,0.9)',
}

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

type EventInfo = {
  id: string
  title: string
  location: string | null
  start_time: string
  end_time: string
  status: string
  requires_time_out: boolean
}

type CardState = 'upcoming' | 'ongoing' | 'ended' | 'cancelled' | 'past-grace'

const STATE_STYLES: Record<
  CardState,
  { border: string; bannerBg: string; bannerText: string; pulse: boolean; label: string }
> = {
  upcoming: {
    border: 'border-[#8FC1A3]',
    bannerBg: 'bg-[#DCEEE1]',
    bannerText: 'text-[#4C8266]',
    pulse: false,
    label: 'Upcoming',
  },
  ongoing: {
    border: 'border-[#8FB6D9]',
    bannerBg: 'bg-[#D9E9F5]',
    bannerText: 'text-[#3D6C91]',
    pulse: false,
    label: 'Ongoing',
  },
  ended: {
    border: 'border-[#E8A33D]',
    bannerBg: 'bg-[#F0DDBB]',
    bannerText: 'text-[#8A6A2F]',
    pulse: true,
    label: 'Ended',
  },
  cancelled: {
    border: 'border-[#D98D80]',
    bannerBg: 'bg-[#F3D9D4]',
    bannerText: 'text-[#B3453A]',
    pulse: false,
    label: 'Cancelled',
  },
  'past-grace': {
    border: 'border-[#3A362E]/15',
    bannerBg: 'bg-[#3A362E]/8',
    bannerText: 'text-[#3A362E]/50',
    pulse: false,
    label: 'Ended',
  },
}

export function StaffEventCard({
  event,
  userId,
  animationDelay,
}: {
  event: EventInfo
  userId: string
  animationDelay: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const end = new Date(event.end_time).getTime()
  const graceEnd = end + GRACE_PERIOD_MS
  const hasEnded = now >= end
  const inGracePeriod = hasEnded && now < graceEnd

  const cardState: CardState =
    event.status === 'cancelled'
      ? 'cancelled'
      : inGracePeriod
        ? 'ended'
        : hasEnded
          ? 'past-grace'
          : event.status === 'ongoing'
            ? 'ongoing'
            : 'upcoming'

  const style = STATE_STYLES[cardState]

  const bannerText =
    cardState === 'ended'
      ? `Ended · ${formatRemaining(graceEnd - now)} left to time out`
      : style.label

  return (
    <div
      className="clay-transition relative animate-fade-in-up rounded-2xl hover:-translate-y-0.5"
      style={{ ...cardShadow, animationDelay }}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-10 rounded-2xl border-2 ${style.border} ${
          style.pulse ? 'animate-pulse' : ''
        }`}
      />

      <div className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-4">
        <p className="font-[family-name:var(--font-display)] font-semibold text-[#3A362E]">
          {event.title}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[#4C8266]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {new Date(event.start_time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'Asia/Manila',
            })}
          </p>
          {event.location && (
            <p className="flex items-center gap-1.5 text-xs text-[#3A362E]/45">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path
                  d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {event.location}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2">
          <EditEventForm
            event={{
              id: event.id,
              title: event.title,
              location: event.location,
              start_time: event.start_time,
              end_time: event.end_time,
              requires_time_out: event.requires_time_out,
            }}
          />

{/* atay */}

          <EventQRButton
            event={{ id: event.id, title: event.title, end_time: event.end_time }}
            userId={userId}
          />
          <Link
            href={`/staff/attendance/${event.id}`}
            aria-label={`View attendance for ${event.title}`}
            title="Attendance"
            style={{
              boxShadow:
                '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
            }}
            className="clay-transition flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3A362E]/70 hover:-translate-y-0.5 hover:text-[#3A362E] active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href={`/staff/scan/${event.id}`}
            aria-label={`Scan for ${event.title}`}
            title="Scan"
            className="clay-transition flex h-9 w-9 items-center justify-center rounded-full bg-[#3A362E] text-white hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" fill="currentColor" />
            </svg>
          </Link>
        </div>

        <div
          className={`-mx-4 -mb-4 mt-1 rounded-b-2xl px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide ${style.bannerBg} ${style.bannerText}`}
        >
          {bannerText}
        </div>
      </div>
    </div>
  )
}