'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

    setTitle('')
    setLocation('')
    setStartTime('')
    setEndTime('')
    setRequiresTimeOut(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-[#2F6F4E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#26593F]"
      >
        + New event
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-[#1C2620]/10 bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#1C2620]">
          New event
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#1C2620]/50 hover:text-[#1C2620]"
        >
          Cancel
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#1C2620]/80">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
          placeholder="General Assembly"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#1C2620]/80">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
          placeholder="Covered Court"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#1C2620]/80">Starts</span>
          <input
            required
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#1C2620]/80">Ends</span>
          <input
            required
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#1C2620]/80">
        <input
          type="checkbox"
          checked={requiresTimeOut}
          onChange={(e) => setRequiresTimeOut(e.target.checked)}
          className="h-4 w-4 rounded border-[#1C2620]/30 accent-[#2F6F4E]"
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
        className="mt-1 rounded-md bg-[#1C2620] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1C2620]/85 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create event'}
      </button>
    </form>
  )
}