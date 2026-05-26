'use client'

import { useEffect, useState } from 'react'

const EFFECT_DURATION = 4100
const EFFECT_INTERVAL = 30000

function Star({ size = 7 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M4 0L4.5 3.5L8 4L4.5 4.5L4 8L3.5 4.5L0 4L3.5 3.5L4 0Z" fill="currentColor" />
    </svg>
  )
}

export function SparkleText({ children }: { children: string }) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    const stop = setTimeout(() => setIsAnimating(false), EFFECT_DURATION)
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), EFFECT_DURATION)
    }, EFFECT_INTERVAL)
    return () => { clearTimeout(stop); clearInterval(interval) }
  }, [])

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={isAnimating ? {
          background: 'linear-gradient(105deg, #1D4ED8 0%, #1D4ED8 28%, #93c5fd 43%, #dbeafe 50%, #93c5fd 57%, #1D4ED8 72%, #1D4ED8 100%)',
          backgroundSize: '280% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          animation: 'sparkle-sweep 2.8s linear forwards',
        } : { color: '#1D4ED8' }}
      >
        {children}
      </span>

      {isAnimating && (
        <>
          <span style={{ position: 'absolute', color: '#93C5FD', pointerEvents: 'none', top: '-0.55em', right: '-0.25em', animation: 'sparkle-pop 2.4s ease-in-out forwards', animationDelay: '0s' }}>
            <Star size={7} />
          </span>
          <span style={{ position: 'absolute', color: '#BFDBFE', pointerEvents: 'none', top: '0.05em', left: '0.05em', animation: 'sparkle-pop 2.4s ease-in-out forwards', animationDelay: '0.85s' }}>
            <Star size={5} />
          </span>
          <span style={{ position: 'absolute', color: '#60A5FA', pointerEvents: 'none', bottom: '-0.35em', right: '0.2em', animation: 'sparkle-pop 2.4s ease-in-out forwards', animationDelay: '1.6s' }}>
            <Star size={5} />
          </span>
        </>
      )}
    </span>
  )
}
