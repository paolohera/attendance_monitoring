'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'
import { ClayAvatar } from '@/components/ClayAvatar'

const clayShadow = {
  boxShadow:
    '10px 10px 24px rgba(168,155,130,0.3), -8px -8px 20px rgba(255,255,255,0.9)',
}

const inputShadow = {
  boxShadow:
    'inset 4px 4px 10px rgba(168,155,130,0.22), inset -4px -4px 10px rgba(255,255,255,0.85)',
}

const clayShadowSm = {
  boxShadow:
    '5px 5px 12px rgba(168,155,130,0.28), -4px -4px 10px rgba(255,255,255,0.9)',
}

const MAX_INPUT_FILE_SIZE = 15 * 1024 * 1024 // 15MB — generous, since we compress before upload
const TARGET_DIMENSION = 400 // px, plenty for any avatar display size in this app
const JPEG_QUALITY = 0.82

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Crop to a centered square first, so avatars aren't stretched
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2

      const canvas = document.createElement('canvas')
      canvas.width = TARGET_DIMENSION
      canvas.height = TARGET_DIMENSION
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_DIMENSION, TARGET_DIMENSION)

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objectUrl
  })
}

export function ProfileForm({
  userId,
  email,
  fullName: initialFullName,
  avatarUrl: initialAvatarUrl,
  role,
  studentId,
  section: initialSection,
  gender: initialGender,
}: {
  userId: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  studentId: string | null
  section: string
  gender: 'male' | 'female' | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initialFullName)
  const [section, setSection] = useState(initialSection)
  const [gender, setGender] = useState<'male' | 'female' | null>(initialGender)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [avatarSaved, setAvatarSaved] = useState(false)

  const isStudent = role === 'student'

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_INPUT_FILE_SIZE) {
      setError('Image is too large (max 15MB).')
      return
    }

    setUploading(true)

    let compressed: Blob
    try {
      compressed = await compressImage(file)
    } catch {
      setUploading(false)
      setError('Could not process that image. Try a different one.')
      return
    }

    // Fixed path per user — re-uploading overwrites the old photo instead
    // of leaving orphaned files behind in storage.
    const filePath = `${userId}/avatar.jpg`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressed, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) {
      setUploading(false)
      setError('Upload failed. Try again.')
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    // Cache-bust so the browser doesn't keep showing the old cached image
    // at the same URL after an overwrite.
    const freshUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: freshUrl })
      .eq('id', userId)

    setUploading(false)

    if (updateError) {
      setError('Could not save your new photo. Try again.')
      return
    }

    setAvatarUrl(freshUrl)
    setAvatarSaved(true)
    setTimeout(() => setAvatarSaved(false), 2500)
    router.refresh()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)

    if (profileError) {
      setSaving(false)
      setError('Could not save changes. Try again.')
      return
    }

    if (isStudent) {
      const { error: studentError } = await supabase
        .from('students')
        .update({ section, gender })
        .eq('id', userId)

      if (studentError) {
        setSaving(false)
        setError('Could not save changes. Try again.')
        return
      }
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  const defaultAvatarSrc = gender ? `/avatars/${gender}.png` : null

  return (
    <div
      className="mt-4 animate-fade-in-up rounded-[28px] bg-white p-6"
      style={{ ...clayShadow, animationDelay: '120ms' }}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
              style={clayShadowSm}
            />
          ) : defaultAvatarSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={defaultAvatarSrc}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
              style={clayShadowSm}
            />
          ) : (
            <ClayAvatar tone="mint" className="h-24 w-24 rounded-full" />
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#3A362E]/40">
              <Spinner className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {avatarSaved && (
          <p className="mt-2 animate-scale-in text-xs font-medium text-[#4C8266]">
            Photo updated
          </p>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="clay-transition mt-3 text-xs font-medium text-[#4C8266] hover:text-[#3A362E] disabled:opacity-50"
        >
          Change photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {avatarUrl && (
          <button
            type="button"
            onClick={async () => {
              setAvatarUrl(null)
              await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
              router.refresh()
            }}
            className="clay-transition mt-1 text-xs text-[#3A362E]/40 hover:text-[#B3453A]"
          >
            Remove photo
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#3A362E]/75">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputShadow}
            className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#3A362E]/75">Email</span>
          <input
            disabled
            value={email}
            style={inputShadow}
            className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E]/50 outline-none"
          />
        </label>

        {isStudent && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Student ID</span>
              <input
                disabled
                value={studentId ?? ''}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E]/50 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Section</span>
              <input
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={inputShadow}
                className="rounded-2xl bg-[#F3EFE7] px-4 py-2.5 text-sm text-[#3A362E] outline-none"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#3A362E]/75">Default avatar</span>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    style={gender === g ? clayShadowSm : inputShadow}
                    className={`clay-transition flex flex-col items-center gap-2 rounded-2xl px-3 py-3 ${
                      gender === g
                        ? 'bg-[#DCEEE1] text-[#4C8266]'
                        : 'bg-[#F3EFE7] text-[#3A362E]/60'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/avatars/${g}.png`} alt="" className="h-12 w-12 object-contain" />
                    <span className="text-xs font-medium capitalize">{g}</span>
                  </button>
                ))}
              </div>
              <p className="mt-0.5 text-xs text-[#3A362E]/40">
                Used when you don&apos;t have a custom photo set.
              </p>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-[#B3453A]">
            {error}
          </p>
        )}
        {saved && (
          <div
            className="flex animate-scale-in items-center gap-2 rounded-2xl bg-[#DCEEE1] px-4 py-3"
            role="status"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <path
                d="M5 13l4 4L19 7"
                stroke="#4C8266"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium text-[#4C8266]">
              Profile updated successfully
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={clayShadowSm}
          className="clay-transition mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[#8FC1A3] px-4 py-3 text-sm font-medium text-[#28402F] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
        >
          {saving && <Spinner className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}