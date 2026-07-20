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

export function CreateEventForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [requiresTimeOut, setRequiresTimeOut] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function resetAndClose() {
    setTitle('')
    setLocation('')
    setStartTime('')
    setEndTime('')
    setRequiresTimeOut(false)
    setError(null)
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

    const { error: insertError } = await supabase.from('events').insert({
      title,
      location,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      requires_time_out: requiresTimeOut,
      created_by: userId,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    resetAndClose()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={clayShadowSm}
        className="clay-transition rounded-2xl bg-[#8FC1A3] px-4 py-2.5 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        + New event
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#3A362E]/40 px-6 py-10 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) resetAndClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !loading) resetAndClose()
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="my-auto flex w-full max-w-sm animate-scale-in flex-col gap-4 rounded-[28px] bg-white p-6"
            style={clayShadow}
          >
            <div className="flex items-center justify-between">
              <h2
                id="create-event-title"
                className="font-[family-name:var(--font-display)] text-base font-semibold text-[#3A362E]"
              >
                New event
              </h2>
              <button
                type="button"
                onClick={resetAndClose}
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

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#3A362E]/75">Starts</span>
                <input
                  required
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={inputShadow}
                  className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#3A362E]/75">Ends</span>
                <input
                  required
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputShadow}
                  className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
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
              {loading ? 'Creating…' : 'Create event'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}