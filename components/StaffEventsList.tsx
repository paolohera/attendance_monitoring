'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CreateEventForm } from '@/components/CreateEventForm'
import { StaffEventCard, type EventInfo } from '@/components/StaffEventCard'

// Keep in sync with the GRACE_PERIOD_MS used in app/staff/page.tsx,
// app/dashboard/page.tsx, app/staff/history/page.tsx, StaffEventCard.tsx,
// and EventQRButton.tsx.
const GRACE_PERIOD_MS = 60 * 60 * 1000 // 1 hour

async function fetchStaffEvents(): Promise<EventInfo[]> {
  const supabase = createClient()
  const cutoffIso = new Date(Date.now() - GRACE_PERIOD_MS).toISOString()

  const { data, error } = await supabase
    .from('events')
    .select('id, title, location, start_time, end_time, status, requires_time_out')
    .gt('end_time', cutoffIso)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data ?? []
}

function sortByStart(events: EventInfo[]) {
  return [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

type NewEventInput = {
  title: string
  location: string
  start_time: string // ISO
  end_time: string // ISO
  requires_time_out: boolean
}

export function StaffEventsList({
  initialEvents,
  userId,
}: {
  initialEvents: EventInfo[]
  userId: string
}) {
  // `fallbackData` renders instantly using what the server already fetched
  // (no loading flash on first load), while SWR caches the result under
  // the 'staff-events' key in memory — so navigating away (Scan, Attendance,
  // etc.) and back serves the cached list immediately instead of re-hitting
  // Supabase, then quietly revalidates in the background.
  const { data: events, mutate } = useSWR<EventInfo[]>('staff-events', fetchStaffEvents, {
    fallbackData: initialEvents,
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
  })

  // The actual insert lives here (not inside CreateEventForm) so it can be
  // wrapped in SWR's optimistic mutate: a temporary placeholder shows in
  // the list immediately, then gets swapped for the real server row once
  // the insert resolves — or the whole thing rolls back cleanly on error,
  // with no separate re-fetch needed either way.
  async function handleCreateEvent(input: NewEventInput): Promise<{ error: string | null }> {
    const supabase = createClient()
    const tempId = `temp-${Date.now()}`

    const optimisticEvent: EventInfo = {
      id: tempId,
      title: input.title,
      location: input.location || null,
      start_time: input.start_time,
      end_time: input.end_time,
      status: 'upcoming',
      requires_time_out: input.requires_time_out,
    }

    let insertErrorMessage: string | null = null

    try {
      await mutate(
        async (current) => {
          const { data, error } = await supabase
            .from('events')
            .insert({
              title: input.title,
              location: input.location,
              start_time: input.start_time,
              end_time: input.end_time,
              requires_time_out: input.requires_time_out,
              created_by: userId,
            })
            .select('id, title, location, start_time, end_time, status, requires_time_out')
            .single()

          if (error || !data) {
            insertErrorMessage = error?.message ?? 'Could not create event.'
            throw error ?? new Error(insertErrorMessage)
          }

          const withoutTemp = (current ?? []).filter((e) => e.id !== tempId)
          return sortByStart([...withoutTemp, data as EventInfo])
        },
        {
          optimisticData: (current) => sortByStart([...(current ?? []), optimisticEvent]),
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch {
      // Error message already captured above; mutate's rollbackOnError
      // already restored the cache to its pre-optimistic state.
    }

    return { error: insertErrorMessage }
  }

  // Same shape as handleCreateEvent, but patches one existing card in
  // place instead of appending — the card's fields update the instant
  // the edit succeeds, with no extra fetch and automatic rollback if
  // the update fails.
  async function handleEditEvent(
    id: string,
    input: NewEventInput
  ): Promise<{ error: string | null }> {
    const supabase = createClient()
    let updateErrorMessage: string | null = null

    try {
      await mutate(
        async (current) => {
          const { data, error } = await supabase
            .from('events')
            .update({
              title: input.title,
              location: input.location,
              start_time: input.start_time,
              end_time: input.end_time,
              requires_time_out: input.requires_time_out,
            })
            .eq('id', id)
            .select('id, title, location, start_time, end_time, status, requires_time_out')
            .single()

          if (error || !data) {
            updateErrorMessage = error?.message ?? 'Could not save changes.'
            throw error ?? new Error(updateErrorMessage)
          }

          const updated = (current ?? []).map((e) => (e.id === id ? (data as EventInfo) : e))
          return sortByStart(updated)
        },
        {
          optimisticData: (current) =>
            sortByStart(
              (current ?? []).map((e) =>
                e.id === id
                  ? {
                      ...e,
                      title: input.title,
                      location: input.location || null,
                      start_time: input.start_time,
                      end_time: input.end_time,
                      requires_time_out: input.requires_time_out,
                    }
                  : e
              )
            ),
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch {
      // Error captured above; cache already rolled back by SWR.
    }

    return { error: updateErrorMessage }
  }

  return (
    <>
      <div className="flex animate-fade-in-up items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
          Events
        </h1>
        <div className="flex items-center gap-2">
          <CreateEventForm userId={userId} onCreate={handleCreateEvent} />
          <Link
            href="/staff/history"
            aria-label="Event history"
            title="History"
            style={{
              boxShadow:
                '4px 4px 10px rgba(168,155,130,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
            }}
            className="clay-transition flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#3A362E]/70 hover:-translate-y-0.5 hover:text-[#3A362E] active:translate-y-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12a9 9 0 1 0 3-6.7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M3 4v5h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v4l3 2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(!events || events.length === 0) && (
          <p className="animate-fade-in-up text-sm text-[#3A362E]/55" style={{ animationDelay: '80ms' }}>
            No upcoming events. Create one to get started.
          </p>
        )}

        {events?.map((event, i) => (
          <StaffEventCard
            key={event.id}
            event={event}
            userId={userId}
            animationDelay={`${80 + i * 60}ms`}
            onEditEvent={handleEditEvent}
          />
        ))}
      </div>
    </>
  )
}