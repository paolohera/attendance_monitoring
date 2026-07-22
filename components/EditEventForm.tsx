'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
}

const clayShadowSm = {
  boxShadow:
    '5px 5px 12px rgba(168,155,130,0.28), -4px -4px 10px rgba(255,255,255,0.9)',
}

const inputShadow = {
  boxShadow:
    'inset 4px 4px 10px rgba(168,155,130,0.22), inset -4px -4px 10px rgba(255,255,255,0.85)',
}

type EventInfo = {
  id: string
  title: string
  location: string | null
  start_time: string
  end_time: string
  requires_time_out: boolean
}

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in the browser's local
// time — this converts a stored ISO timestamp into that shape, mirroring
// how CreateEventForm turns the same field back into an ISO string.
function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditEventForm({ event }: { event: EventInfo }) {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState(event.title)
  const [location, setLocation] = useState(event.location ?? '')
  const [startTime, setStartTime] = useState(toLocalInputValue(event.start_time))
  const [endTime, setEndTime] = useState(toLocalInputValue(event.end_time))
  const [requiresTimeOut, setRequiresTimeOut] = useState(event.requires_time_out)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function resetToOriginal() {
    setTitle(event.title)
    setLocation(event.location ?? '')
    setStartTime(toLocalInputValue(event.start_time))
    setEndTime(toLocalInputValue(event.end_time))
    setRequiresTimeOut(event.requires_time_out)
    setError(null)
  }

  function handleClose() {
    resetToOriginal()
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title,
        location,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        requires_time_out: requiresTimeOut,
      })
      .eq('id', event.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Edit ${event.title}`}
        title="Edit event"
        style={{
          boxShadow:
            '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
        }}
        className="clay-transition flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3A362E]/70 hover:-translate-y-0.5 hover:text-[#3A362E] active:translate-y-0"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.83l-1.17-1.17a2 2 0 0 0-2.83 0L4 16v4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-title"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#3A362E]/40 px-6 py-10 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) handleClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !loading) handleClose()
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="my-auto flex w-full max-w-sm animate-scale-in flex-col gap-4 rounded-[28px] bg-white p-6"
            style={clayShadow}
          >
            <div className="flex items-center justify-between">
              <h2
                id="edit-event-title"
                className="font-[family-name:var(--font-display)] text-base font-semibold text-[#3A362E]"
              >
                Edit event
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="clay-transition text-sm text-[#3A362E]/50 hover:text-[#3A362E] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="General Assembly"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="Covered Court"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm font-medium text-[#3A362E]/75">Starts</span>
                <input
                  required
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={inputShadow}
                  className="w-full min-w-0 rounded-2xl bg-[#F3EFE7] px-3 py-2.5 text-sm text-[#3A362E] outline-none"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm font-medium text-[#3A362E]/75">Ends</span>
                <input
                  required
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputShadow}
                  className="w-full min-w-0 rounded-2xl bg-[#F3EFE7] px-3 py-2.5 text-sm text-[#3A362E] outline-none"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#3A362E]/75">
              <input
                type="checkbox"
                checked={requiresTimeOut}
                onChange={(e) => setRequiresTimeOut(e.target.checked)}
                className="h-4 w-4 rounded accent-[#4C8266]"
              />
              Require time-out scan too
            </label>

            {error && (
              <p role="alert" className="text-sm text-[#B3453A]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={clayShadowSm}
              className="clay-transition mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[#8FC1A3] px-4 py-3 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
            >
              {loading && <Spinner className="h-4 w-4" />}
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}