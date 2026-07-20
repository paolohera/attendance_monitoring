'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { createClient } from '@/lib/supabase/client'

type EventInfo = {
  id: string
  title: string
}

type ScanResult = {
  success: boolean
  reason?: string
  student_name?: string
  student_id?: string
  section?: string
  status?: string
}

const REASON_MESSAGES: Record<string, string> = {
  invalid_token: 'QR code not recognized.',
  rpc_error: 'Scan failed — check console for details.',
  already_used: 'This QR was already scanned.',
  expired: 'This QR has expired.',
  event_not_active: 'This event is not active.',
  not_eligible_section: 'Not eligible for this event.',
  already_recorded: 'Attendance already recorded.',
  not_authorized: 'Not authorized to scan.',
  student_not_found: 'Student record not found.',
  event_not_found: 'Event not found.',
}

export function EventScanner({ event }: { event: EventInfo }) {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const busyRef = useRef(false)
  const lastSignatureRef = useRef<string | null>(null)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [count, setCount] = useState(0)

  const handlePayload = useCallback(
    async (raw: string) => {
      if (busyRef.current) return

      let payload: { signature?: string; event_id?: string }
      try {
        payload = JSON.parse(raw)
      } catch {
        setLastResult({ success: false, reason: 'invalid_token' })
        return
      }

      if (!payload.signature || payload.event_id !== event.id) {
        setLastResult({ success: false, reason: 'invalid_token' })
        return
      }

      // Avoid re-firing on the same QR every animation frame while it's
      // still in view — only process a given signature once per hold.
      if (lastSignatureRef.current === payload.signature) return
      lastSignatureRef.current = payload.signature

      busyRef.current = true

      const { data, error } = await supabase.rpc('record_attendance_scan', {
        p_signature: payload.signature,
        p_event_id: event.id,
      })

      busyRef.current = false

      if (error) {
        console.error('record_attendance_scan RPC error:', error)
        setLastResult({ success: false, reason: 'rpc_error' })
        return
      }

      const result = data as ScanResult
      setLastResult(result)
      if (result.success) setCount((c) => c + 1)

      // Allow the next distinct QR to be processed; clear the "seen" guard
      // shortly after so someone can't be scanned twice by holding still.
      setTimeout(() => {
        lastSignatureRef.current = null
      }, 2000)
    },
    [event.id, supabase]
  )

  useEffect(() => {
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          tick()
        }
      } catch {
        setCameraError('Camera access denied or unavailable.')
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) handlePayload(code.data)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    start()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [handlePayload])

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 text-sm text-[#3A362E]/60">
        <span className="font-[family-name:var(--font-mono)]">{count}</span>
        <span>checked in</span>
      </div>

      <div
        className="relative mt-4 aspect-square w-full max-w-xs overflow-hidden rounded-[28px] bg-black"
        style={{
          boxShadow:
            '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
        }}
      >
        {cameraError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/80">
            {cameraError}
          </div>
        ) : (
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div
        key={lastResult ? `${lastResult.success}-${lastResult.student_id ?? lastResult.reason}-${Date.now()}` : 'idle'}
        className={`mt-4 w-full max-w-xs animate-scale-in rounded-2xl px-4 py-3 text-center text-sm font-medium transition ${
          lastResult === null
            ? 'bg-white/60 text-[#3A362E]/40'
            : lastResult.success
              ? 'bg-[#DCEEE1] text-[#4C8266]'
              : 'bg-[#F3D9D4] text-[#B3453A]'
        }`}
      >
        {lastResult === null && 'Point the camera at a student QR code.'}
        {lastResult?.success && (
          <>
            {lastResult.student_name} — {lastResult.student_id} ({lastResult.section})
            {lastResult.status === 'late' && (
              <span className="ml-1.5 rounded-full bg-[#F3D9D4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#B3453A]">
                Late
              </span>
            )}
          </>
        )}
        {lastResult && !lastResult.success &&
          (REASON_MESSAGES[lastResult.reason ?? ''] ?? 'Scan failed.')}
      </div>
    </div>
  )
}