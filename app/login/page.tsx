'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError || !signInData.user) {
        setError('Incorrect email or password.')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single()

      if (profileError) {
        setError('Signed in, but could not load your profile. Check your connection and try again.')
        return
      }

      const destination = profile?.role === 'student' ? '/dashboard' : '/staff'
      router.push(destination)
      router.refresh()
    } catch {
      setError('Could not reach the server. Check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
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
            src="/signin-guide.png"
            alt="Illustrated character gesturing toward the sign-in form"
            className="relative z-10 mx-auto h-36 w-auto object-contain"
          />
        </div>

        <div
          className="mt-4 animate-fade-in-up rounded-[28px] bg-white p-6"
          style={{ ...clayShadow, animationDelay: '80ms' }}
        >
          <h1 className="text-center font-[family-name:var(--font-display)] text-xl font-semibold text-[#3A362E]">
            Sign in
          </h1>
          <p className="mt-1 text-center text-sm text-[#3A362E]/55">Welcome back.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
              />
            </label>

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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}