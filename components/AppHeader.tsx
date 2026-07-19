'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

export function AppHeader({ role }: { role: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleConfirmSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-[#1C2620]/10 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[#1C2620]">
            Attendance
          </span>
          <span className="rounded-full bg-[#E3EFE7] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[#2F6F4E]">
            {role}
          </span>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-sm text-[#1C2620]/60 transition hover:text-[#1C2620]"
        >
          Sign out
        </button>
      </header>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#1C2620]/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !signingOut) setConfirmOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !signingOut) setConfirmOpen(false)
          }}
        >
          <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-[#1C2620]/10 bg-white p-6 shadow-lg">
            <h2
              id="signout-title"
              className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1C2620]"
            >
              Sign out?
            </h2>
            <p className="mt-1.5 text-sm text-[#1C2620]/60">
              You&apos;ll need to sign back in to view your dashboard or generate event QR codes.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="rounded-md px-4 py-2 text-sm font-medium text-[#1C2620]/70 transition hover:bg-[#1C2620]/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                className="clay-transition flex items-center gap-2 rounded-md bg-[#B3453A] px-4 py-2 text-sm font-medium text-white hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              >
                {signingOut && <Spinner className="h-4 w-4" />}
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}