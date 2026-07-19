'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.35), -8px -8px 20px rgba(255,255,255,0.9)',
}

const inputShadow = {
  boxShadow:
    'inset 4px 4px 10px rgba(168,155,130,0.22), inset -4px -4px 10px rgba(255,255,255,0.85)',
}

const buttonShadow = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.3), -5px -5px 12px rgba(255,255,255,0.9)',
}

export default function SignupPage() {
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [section, setSection] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
          section,
          role: 'student',
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('duplicate')) {
        setError('This student ID is already registered. Try signing in instead.')
      } else {
        setError(signUpError.message)
      }
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F3EFE7] px-6">
        <div
          className="w-full max-w-sm animate-scale-in rounded-[28px] bg-white p-8 text-center"
          style={clayShadow}
        >
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-[#3A362E]/60">
            We sent a confirmation link to {email}. Confirm your address to
            finish setting up your account.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F3EFE7] px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in-up">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#3A362E]/50 transition hover:text-[#3A362E]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12.5L5.5 8L10 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        <div className="relative mx-auto mt-3 h-36 w-36">
          <div
            className="absolute inset-0 rounded-full bg-[#DCEEE1]"
            style={clayShadow}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/signup-guide.png"
            alt="Illustrated character gesturing toward the sign-up form"
            className="relative z-10 mx-auto h-36 w-auto object-contain"
          />
        </div>

        <div
          className="mt-4 animate-fade-in-up rounded-[28px] bg-white p-6"
          style={{ ...clayShadow, animationDelay: '80ms' }}
        >
          <h1 className="text-center font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
            Create your student account
          </h1>
          <p className="mt-1 text-center text-sm text-[#3A362E]/55">
            Use your own details — your student ID must match your official
            records.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field label="Full name">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="Juan Dela Cruz"
              />
            </Field>

            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Student ID">
              <input
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="2023-00123"
              />
            </Field>

            <Field label="Section">
              <input
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none placeholder:text-[#3A362E]/35"
                placeholder="BSIT 3A"
              />
            </Field>

            <Field label="Password">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
                minLength={8}
              />
            </Field>

            <Field label="Confirm password">
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
                minLength={8}
              />
            </Field>

            {error && (
              <p role="alert" className="text-sm text-[#B3453A]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={buttonShadow}
              className="clay-transition mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#8FC1A3] px-4 py-3 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70"
            >
              {loading && <Spinner className="h-4 w-4" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#3A362E]/75">{label}</span>
      {children}
    </label>
  )
}