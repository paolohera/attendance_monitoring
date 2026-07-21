'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

const clayShadowSm = {
  boxShadow:
    '5px 5px 12px rgba(168,155,130,0.28), -4px -4px 10px rgba(255,255,255,0.9)',
}

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
}

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
      <header className="flex items-center justify-between bg-[#F3EFE7] px-6 py-5">
        <Link
          href={role === 'student' ? '/dashboard' : '/staff'}
          className="clay-transition flex items-center gap-2 hover:opacity-80"
        >
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[#3A362E]">
            Attendance
          </span>
          <span
            className="rounded-full bg-[#DCEEE1] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[#4C8266]"
            style={clayShadowSm}
          >
            {role}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            aria-label="Profile"
            title="Profile"
            className="clay-transition flex h-9 w-9 items-center justify-center rounded-full text-[#3A362E]/55 hover:bg-[#3A362E]/5 hover:text-[#3A362E]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label="Sign out"
            title="Sign out"
            className="clay-transition flex h-9 w-9 items-center justify-center rounded-full text-[#3A362E]/55 hover:bg-[#3A362E]/5 hover:text-[#3A362E]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 15l4-3-4-3M20 12H9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {confirmOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#3A362E]/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !signingOut) setConfirmOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !signingOut) setConfirmOpen(false)
          }}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-[28px] bg-white p-6"
            style={clayShadow}
          >
            <h2
              id="signout-title"
              className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#3A362E]"
            >
              Sign out?
            </h2>
            <p className="mt-1.5 text-sm text-[#3A362E]/60">
              You&apos;ll need to sign back in to view your dashboard or generate event QR codes.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="clay-transition rounded-2xl px-4 py-2 text-sm font-medium text-[#3A362E]/70 hover:bg-[#3A362E]/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                style={clayShadowSm}
                className="clay-transition flex items-center gap-2 rounded-2xl bg-[#D98D80] px-4 py-2 text-sm font-medium text-[#4A211B] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              >
                {signingOut && <Spinner className="h-4 w-4" />}
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}