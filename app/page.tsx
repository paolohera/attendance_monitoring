import Link from 'next/link'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.35), -8px -8px 20px rgba(255,255,255,0.9)',
}

const clayShadowSm = {
  boxShadow:
    '6px 6px 14px rgba(168,155,130,0.3), -5px -5px 12px rgba(255,255,255,0.9)',
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F3EFE7] px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div
          className="relative mx-auto h-44 w-44 animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          <div
            className="absolute inset-0 rounded-full bg-[#DCEEE1]"
            style={clayShadow}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/welcome.png"
            alt="Illustrated character waving hello"
            className="relative z-10 mx-auto h-44 w-auto object-contain"
          />
        </div>

        <div
          className="mx-auto mt-4 inline-flex animate-fade-in-up items-center gap-1 rounded-full bg-[#DCEEE1] px-3.5 py-1.5"
          style={{ ...clayShadowSm, animationDelay: '80ms' }}
        >
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#4C8266]">
            Student Council
          </span>
        </div>

        <h1
          className="mt-5 animate-fade-in-up font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[#3A362E]"
          style={{ animationDelay: '140ms' }}
        >
          Attendance Monitoring
        </h1>
        <p
          className="mt-3 animate-fade-in-up text-sm leading-relaxed text-[#3A362E]/60"
          style={{ animationDelay: '200ms' }}
        >
          Generate your event pass, or scan attendees at the door — all in one
          place.
        </p>

        <div
          className="mt-9 flex animate-fade-in-up flex-col gap-3"
          style={{ animationDelay: '260ms' }}
        >
          <Link
            href="/signup"
            style={clayShadowSm}
            className="clay-transition rounded-2xl bg-[#8FC1A3] px-4 py-3 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            Create a student account
          </Link>
          <Link
            href="/login"
            style={clayShadowSm}
            className="clay-transition rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#3A362E] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            Sign in
          </Link>
        </div>

        <p
          className="mt-6 animate-fade-in-up text-xs text-[#3A362E]/40"
          style={{ animationDelay: '320ms' }}
        >
          SSC and admin accounts sign in the same way — you&apos;ll land on the
          right dashboard automatically.
        </p>
      </div>
    </main>
  )
}