'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.user) {
      setLoading(false)
      setError('Incorrect email or password.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .single()

    setLoading(false)

    const destination = profile?.role === 'student' ? '/dashboard' : '/staff'
    router.push(destination)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1C2620]">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-[#1C2620]/60">Welcome back.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#1C2620]/80">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm text-[#1C2620] outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#1C2620]/80">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-[#1C2620]/15 px-3 py-2 text-sm text-[#1C2620] outline-none focus:border-[#2F6F4E] focus:ring-1 focus:ring-[#2F6F4E]"
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
          className="mt-2 rounded-md bg-[#1C2620] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1C2620]/85 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}