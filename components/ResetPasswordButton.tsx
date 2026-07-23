'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
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

export function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const [open, setOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [reason, setReason] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleClose() {
    setOpen(false)
    setNewPassword('')
    setReason('')
    setShowPassword(false)
    setError(null)
    setDone(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (reason.trim().length < 3) {
      setError('Please note why this reset is happening (e.g. "Verified in person").')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, newPassword, reason }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Could not reset password. Try again.')
        setLoading(false)
        return
      }

      setDone(true)
    } catch {
      setError('Could not reset password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="clay-transition text-xs font-medium text-[#4C8266] hover:text-[#3A362E]"
      >
        Reset password
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#3A362E]/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) handleClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !loading) handleClose()
          }}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-[28px] bg-white p-6"
            style={clayShadow}
          >
            {done ? (
              <>
                <div className="mx-auto flex h-12 w-12 animate-clay-pop items-center justify-center rounded-full bg-[#DCEEE1]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#4C8266"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-center text-sm font-medium text-[#3A362E]">
                  Password reset for {userName}.
                </p>
                <button
                  onClick={handleClose}
                  style={clayShadowSm}
                  className="clay-transition mt-5 w-full rounded-2xl bg-[#8FC1A3] px-4 py-2.5 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Done
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2
                    id="reset-password-title"
                    className="font-[family-name:var(--font-display)] text-base font-semibold text-[#3A362E]"
                  >
                    Reset password
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

                <p className="-mt-2 text-xs text-[#3A362E]/50">
                  Set a new password for <span className="font-medium text-[#3A362E]/70">{userName}</span>.
                  They'll need to use it next time they sign in.
                </p>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#3A362E]/75">New password</span>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={inputShadow}
                      className="w-full rounded-2xl bg-[#F3EFE7] px-4 py-2.5 pr-11 text-sm text-[#3A362E] outline-none"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                      className="clay-transition absolute right-3 top-1/2 -translate-y-1/2 text-[#3A362E]/40 hover:text-[#3A362E]/70"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path
                            d="M10.6 5.1A10.9 10.9 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-.4 1-1.1 2.2-2.1 3.3M6.6 6.6C4.5 8 3 10 1.5 12c1 2.5 5 7 10.5 7 1.4 0 2.7-.3 3.9-.8"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.9 10a3 3 0 0 0 4.2 4.2"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#3A362E]/75">Reason</span>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={inputShadow}
                    rows={2}
                    placeholder="e.g. Verified in person, forgot password"
                    className="resize-none rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                  />
                  <span className="text-xs text-[#3A362E]/40">
                    Logged for audit purposes — confirm you verified their identity first.
                  </span>
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
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}