'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { createClient } from '@/lib/supabase/client'
import { ClayAvatar } from '@/components/ClayAvatar'
import { Spinner } from '@/components/Spinner'

type EventInfo = {
  id: string
  title: string
}

type PreviewData = {
  signature: string
  student_name: string
  avatar_url: string | null
  role: 'student' | 'ssc' | 'admin'
  student_id: string | null
  section: string | null
  gender: 'male' | 'female' | null
  requires_time_out: boolean
  has_time_in: boolean
  has_time_out: boolean
}

type ConfirmResult = {
  success: boolean
  reason?: string
  action?: 'time_in' | 'time_out'
  student_name?: string
  student_id?: string
  section?: string
  status?: string
  role?: 'student' | 'ssc' | 'admin'
  at?: string
}

const AVATAR_TONES = ['mint', 'peach', 'sky', 'blush'] as const

function toneForName(name: string) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
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
  time_out_not_required: "This event doesn't require a time-out scan.",
  not_timed_in_yet: "This person hasn't timed in yet.",
  invalid_action: 'Something went wrong. Try again.',
}

export function EventScanner({ event }: { event: EventInfo }) {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const busyRef = useRef(false)
  const lastSignatureRef = useRef<string | null>(null)
  const cardOpenRef = useRef(false)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [confirming, setConfirming] = useState<'time_in' | 'time_out' | null>(null)
  const [lastResult, setLastResult] = useState<ConfirmResult | null>(null)
  const [count, setCount] = useState(0)

  function closeCard() {
    setPreview(null)
    setPreviewError(null)
    cardOpenRef.current = false
    // Give the same signature a moment before it can be scanned again,
    // in case the staff member backs out without confirming.
    setTimeout(() => {
      lastSignatureRef.current = null
    }, 500)
  }

  const handlePayload = useCallback(
    async (raw: string) => {
      if (busyRef.current || cardOpenRef.current) return

      let payload: { signature?: string; event_id?: string }
      try {
        payload = JSON.parse(raw)
      } catch {
        setPreviewError(REASON_MESSAGES.invalid_token)
        return
      }

      if (!payload.signature || payload.event_id !== event.id) {
        setPreviewError(REASON_MESSAGES.invalid_token)
        return
      }

      // Avoid re-firing on the same QR every animation frame while it's
      // still in view — only process a given signature once per hold.
      if (lastSignatureRef.current === payload.signature) return
      lastSignatureRef.current = payload.signature

      busyRef.current = true
      setPreviewError(null)

      const { data, error } = await supabase.rpc('preview_attendance_scan', {
        p_signature: payload.signature,
        p_event_id: event.id,
      })

      busyRef.current = false

      if (error) {
        console.error('preview_attendance_scan RPC error:', error)
        setPreviewError(REASON_MESSAGES.rpc_error)
        setTimeout(() => {
          lastSignatureRef.current = null
        }, 1500)
        return
      }

      const result = data as { success: boolean; reason?: string } & Partial<PreviewData>

      if (!result.success) {
        setPreviewError(REASON_MESSAGES[result.reason ?? ''] ?? 'Scan failed.')
        setTimeout(() => {
          lastSignatureRef.current = null
        }, 1500)
        return
      }

      cardOpenRef.current = true
      setPreview(result as PreviewData)
    },
    [event.id, supabase]
  )

  async function handleConfirm(action: 'time_in' | 'time_out') {
    if (!preview) return
    setConfirming(action)

    const { data, error } = await supabase.rpc('confirm_attendance_scan', {
      p_signature: preview.signature,
      p_event_id: event.id,
      p_action: action,
    })

    setConfirming(null)

    if (error) {
      console.error('confirm_attendance_scan RPC error:', error)
      setLastResult({ success: false, reason: 'rpc_error' })
      closeCard()
      return
    }

    const result = data as ConfirmResult
    result.at = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setLastResult(result)
    if (result.success) setCount((c) => c + 1)
    closeCard()
  }

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

  const defaultAvatarSrc = preview?.gender ? `/avatars/${preview.gender}.png` : null
  const fullyDone = preview ? preview.has_time_in && (!preview.requires_time_out || preview.has_time_out) : false

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

        {preview && (
          <div className="absolute inset-0 flex animate-fade-in items-center justify-center bg-[#3A362E]/60 p-4">
            <div
              className="w-full max-w-xs animate-scale-in rounded-[24px] bg-white p-5"
              style={{
                boxShadow:
                  '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
              }}
            >
              <div className="flex items-center gap-3">
                {preview.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview.avatar_url}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                  />
                ) : defaultAvatarSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={defaultAvatarSrc}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <ClayAvatar
                    tone={toneForName(preview.student_name)}
                    className="h-14 w-14 flex-shrink-0 rounded-full"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-[#3A362E]">
                    {preview.student_name}
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#3A362E]/50">
                    {preview.role === 'student'
                      ? `${preview.student_id ?? '—'}${preview.section ? ` · ${preview.section}` : ''}`
                      : preview.role}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#3A362E]/50">
                {fullyDone
                  ? 'Already fully checked in for this event.'
                  : preview.has_time_in
                    ? 'Timed in — awaiting time-out.'
                    : 'Not checked in yet.'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleConfirm('time_in')}
                  disabled={preview.has_time_in || confirming !== null}
                  className="clay-transition flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#8FC1A3] px-3 py-2.5 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:opacity-40"
                >
                  {confirming === 'time_in' && <Spinner className="h-4 w-4" />}
                  Time In
                </button>
                <button
                  onClick={() => handleConfirm('time_out')}
                  disabled={
                    !preview.requires_time_out ||
                    !preview.has_time_in ||
                    preview.has_time_out ||
                    confirming !== null
                  }
                  className="clay-transition flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#F0B489] px-3 py-2.5 text-sm font-medium text-[#5A3A1B] hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:opacity-40"
                >
                  {confirming === 'time_out' && <Spinner className="h-4 w-4" />}
                  Time Out
                </button>
              </div>

              <button
                onClick={closeCard}
                disabled={confirming !== null}
                className="clay-transition mt-3 w-full text-center text-xs text-[#3A362E]/45 hover:text-[#3A362E] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        key={
          preview
            ? 'card-open'
            : lastResult
              ? `${lastResult.success}-${lastResult.student_id ?? lastResult.reason}-${Date.now()}`
              : previewError
                ? `err-${Date.now()}`
                : 'idle'
        }
        className={`mt-4 w-full max-w-xs animate-scale-in rounded-2xl px-4 py-3 text-center text-sm font-medium transition ${
          preview
            ? 'bg-white/60 text-[#3A362E]/40'
            : previewError
              ? 'bg-[#F3D9D4] text-[#B3453A]'
              : lastResult === null
                ? 'bg-white/60 text-[#3A362E]/40'
                : lastResult.success
                  ? 'bg-[#DCEEE1] text-[#4C8266]'
                  : 'bg-[#F3D9D4] text-[#B3453A]'
        }`}
      >
        {preview && 'Confirm above to record attendance.'}
        {!preview && previewError}
        {!preview && !previewError && lastResult === null && 'Point the camera at a student QR code.'}
        {!preview && !previewError && lastResult?.success && (
          <>
            {lastResult.action === 'time_out' ? 'Timed out: ' : 'Timed in: '}
            {lastResult.student_name} — {lastResult.at}
            {lastResult.status === 'late' && (
              <span className="ml-1.5 rounded-full bg-[#F3D9D4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#B3453A]">
                Late
              </span>
            )}
          </>
        )}
        {!preview && !previewError && lastResult && !lastResult.success &&
          (REASON_MESSAGES[lastResult.reason ?? ''] ?? 'Scan failed.')}
      </div>
    </div>
  )
}