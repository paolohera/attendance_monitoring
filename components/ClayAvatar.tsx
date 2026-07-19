const TONES = {
  mint: { base: '#8FC1A3', light: '#C3E4CE' },
  peach: { base: '#F0B489', light: '#F8D9BB' },
  sky: { base: '#8FB6D9', light: '#C6DCEE' },
  blush: { base: '#E6A0B4', light: '#F2CBD7' },
} as const

type Tone = keyof typeof TONES

export function ClayAvatar({
  tone = 'mint',
  className = '',
  style,
}: {
  tone?: Tone
  className?: string
  style?: React.CSSProperties
}) {
  const c = TONES[tone]
  const gradId = `clay-avatar-${tone}`

  return (
    <svg viewBox="0 0 64 64" className={className} style={style} role="img" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="100%" stopColor={c.base} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${gradId})`} />
      <circle cx="23" cy="30" r="3.2" fill="#3A362E" />
      <circle cx="41" cy="30" r="3.2" fill="#3A362E" />
      <path
        d="M22 41 Q32 49 42 41"
        stroke="#3A362E"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="17" cy="37" rx="4" ry="2.5" fill="#3A362E" opacity="0.12" />
      <ellipse cx="47" cy="37" rx="4" ry="2.5" fill="#3A362E" opacity="0.12" />
    </svg>
  )
}