'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

type EventInfo = {
  id: string
  title: string
  end_time: string
}

export function EventQRButton({ event, userId }: { event: EventInfo; userId: string }) {
  const supabase = createClient()

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

    const { data: inserted, error: insertError } = await supabase
      .from('qr_tokens')
      .insert({
        student_id: userId,
        event_id: event.id,
        signature: newSignature,
        expires_at: event.end_time,
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
      <button
        onClick={handleGenerate}
        className="rounded-md bg-[#2F6F4E] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#26593F]"
      >
        Generate QR
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#1C2620]/40 px-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex w-full max-w-xs animate-scale-in flex-col items-center rounded-2xl border border-[#1C2620]/10 bg-white p-6 text-center shadow-lg">
            <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[#1C2620]">
              {event.title}
            </p>

            {loading && (
              <div className="mt-8 mb-8 flex flex-col items-center gap-2 text-sm text-[#1C2620]/60">
                <Spinner className="h-6 w-6 text-[#2F6F4E]" />
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
                <div className="mt-4 animate-clay-pop rounded-xl border border-dashed border-[#1C2620]/15 p-3">
                  <QRCodeSVG
                    value={JSON.stringify({ signature, event_id: event.id })}
                    size={180}
                  />
                </div>
                <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[#1C2620]/50">
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
              className="mt-6 text-sm text-[#1C2620]/60 hover:text-[#1C2620]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}