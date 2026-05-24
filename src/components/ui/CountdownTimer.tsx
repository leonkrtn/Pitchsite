'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

const LAUNCH_DATE = new Date('2026-08-01T00:00:00Z')

function getTimeLeft() {
  const now = new Date()
  const diff = LAUNCH_DATE.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value !== prev) {
      setAnimating(true)
      const t = setTimeout(() => {
        setPrev(value)
        setAnimating(false)
      }, 180)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative overflow-hidden w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl bg-surface border border-gray-100">
        <span
          key={animating ? 'new' : 'stable'}
          className={`font-display font-bold text-2xl sm:text-3xl text-ink tabular-nums transition-all duration-[180ms] ease-out ${
            animating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs font-medium text-muted uppercase tracking-widest">{label}</span>
    </div>
  )
}

export function CountdownTimer() {
  const t = useTranslations('countdown')
  const [time, setTime] = useState(getTimeLeft())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="h-24" />
  }

  return (
    <div className="flex items-end gap-3 sm:gap-4">
      <TimeUnit value={time.days} label={t('days')} />
      <span className="text-2xl font-bold text-muted pb-8">·</span>
      <TimeUnit value={time.hours} label={t('hours')} />
      <span className="text-2xl font-bold text-muted pb-8">·</span>
      <TimeUnit value={time.minutes} label={t('minutes')} />
      <span className="text-2xl font-bold text-muted pb-8">·</span>
      <TimeUnit value={time.seconds} label={t('seconds')} />
    </div>
  )
}
