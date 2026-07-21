import type { Metadata } from 'next'
import { Baloo_2, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Attendance Monitoring',
  description: 'Event attendance monitoring for student council',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.94); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes clayPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.06); }
            100% { transform: scale(1); }
          }
          .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
          .animate-scale-in { animation: scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
          .animate-fade-in { animation: fadeIn 0.2s ease-out both; }
          .animate-clay-pop { animation: clayPop 0.35s ease-out; }
          .clay-transition { transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease-out; }
        `}</style>
      </head>
      <body
        className={`${baloo2.variable} ${inter.variable} ${plexMono.variable} font-[family-name:var(--font-body)] antialiased bg-[#F7F6F2] text-[#1C2620]`}
      >
        {children}
      </body>
    </html>
  )
}