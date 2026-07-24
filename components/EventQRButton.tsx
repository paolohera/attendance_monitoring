'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

type EventInfo = {
  id: string
  title: string
  end_time: string
}

type AttendanceState = {
  time_in: string | null
  time_out: string | null
} | null

// A token minted for this event stays valid this long past the
// event's official end time — so a "time out" QR generated right
// as (or shortly after) the event ends isn't born already-expired.
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

export function EventQRButton({
  event,
  userId,
  attendance = null,
  requiresTimeOut = false,
}: {
  event: EventInfo
  userId: string
  attendance?: AttendanceState
  requiresTimeOut?: boolean
}) {
  const supabase = createClient()

  const hasTimedIn = !!attendance?.time_in
  const hasTimedOut = !!attendance?.time_out
  const awaitingTimeOut = hasTimedIn && requiresTimeOut && !hasTimedOut
  const fullyCheckedIn = hasTimedIn && (!requiresTimeOut || hasTimedOut)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setOpen(true)

    // Reuse an existing, still-valid, unused token for this student + event
    // instead of minting a new one every time they open the QR screen.
    const { data: existing } = await supabase
      .from('qr_tokens')
      .select('signature, expires_at')
      .eq('student_id', userId)
      .eq('event_id', event.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) {
      setSignature(existing.signature)
      setExpiresAt(existing.expires_at)
      setLoading(false)
      return
    }

    const newSignature = crypto.randomUUID()
    const tokenExpiresAt = new Date(
      new Date(event.end_time).getTime() + GRACE_PERIOD_MS
    ).toISOString()

    const { data: inserted, error: insertError } = await supabase
      .from('qr_tokens')
      .insert({
        student_id: userId,
        event_id: event.id,
        signature: newSignature,
        expires_at: tokenExpiresAt,
      })
      .select('signature, expires_at')
      .single()

    setLoading(false)

    if (insertError || !inserted) {
      setError('Could not generate a QR code. Try again.')
      return
    }

    setSignature(inserted.signature)
    setExpiresAt(inserted.expires_at)
  }

  return (
    <>
      {fullyCheckedIn ? (
        <div
          aria-label="Already checked in"
          title="Checked in"
          style={{
            boxShadow:
              '4px 4px 10px rgba(168,155,130,0.28), -3px -3px 8px rgba(255,255,255,0.9)',
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCEEE1] text-[#4C8266]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          aria-label={
            awaitingTimeOut ? `Generate time-out QR for ${event.title}` : `Generate QR for ${event.title}`
          }
          title={awaitingTimeOut ? 'Time out' : 'Generate QR'}
          style={{
            boxShadow:
              '4px 4px 10px rgba(168,155,130,0.28), -3px -3px 8px rgba(255,255,255,0.9)',
          }}
          className={`clay-transition flex h-9 w-9 items-center justify-center rounded-full hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.95] ${
            awaitingTimeOut
              ? 'bg-[#F0B489] text-[#5A3A1B]'
              : 'bg-[#8FC1A3] text-[#28402F]'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <path
              d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM17 17h1v1h-1zM20 20h1v1h-1z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#3A362E]/40 px-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="flex w-full max-w-xs animate-scale-in flex-col items-center rounded-[28px] bg-white p-6 text-center"
            style={{
              boxShadow:
                '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
            }}
          >
            <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[#3A362E]">
              {event.title}
            </p>
            {awaitingTimeOut && (
              <p className="mt-0.5 text-xs font-medium text-[#B3763F]">Time-out QR</p>
            )}

            {loading && (
              <div className="mt-8 mb-8 flex flex-col items-center gap-2 text-sm text-[#3A362E]/60">
                <Spinner className="h-6 w-6 text-[#4C8266]" />
                Generating…
              </div>
            )}

            {!loading && error && (
              <p role="alert" className="mt-8 mb-8 text-sm text-[#B3453A]">
                {error}
              </p>
            )}

            {!loading && !error && signature && (
              <>
                <div
                  className="mt-4 animate-clay-pop rounded-2xl border border-dashed border-[#3A362E]/15 bg-[#F3EFE7] p-3"
                >
                  <QRCodeSVG
                    value={JSON.stringify({ signature, event_id: event.id })}
                    size={180}
                  />
                </div>
                <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/50">
                  Valid until{' '}
                  {expiresAt &&
                    new Date(expiresAt).toLocaleString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                </p>
              </>
            )}

            <button
              onClick={() => setOpen(false)}
              className="clay-transition mt-6 text-sm text-[#3A362E]/55 hover:text-[#3A362E]"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}