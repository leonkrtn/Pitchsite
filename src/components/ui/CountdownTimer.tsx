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
      const t = setTimeout(() => { setPrev(value); setAnimating(false) }, 180)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        width: '64px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9',
      }}>
        <span
          key={animating ? 'new' : 'stable'}
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 700, fontSize: '24px', color: '#0F172A',
            fontVariantNumeric: 'tabular-nums',
            transition: 'opacity 180ms ease-out, transform 180ms ease-out',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(-8px)' : 'translateY(0)',
          }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {label}
      </span>
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

  if (!mounted) return <div style={{ height: '96px' }} />

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
      <TimeUnit value={time.days} label={t('days')} />
      <span style={{ fontSize: '24px', fontWeight: 700, color: '#64748B', paddingBottom: '32px' }}>·</span>
      <TimeUnit value={time.hours} label={t('hours')} />
      <span style={{ fontSize: '24px', fontWeight: 700, color: '#64748B', paddingBottom: '32px' }}>·</span>
      <TimeUnit value={time.minutes} label={t('minutes')} />
      <span style={{ fontSize: '24px', fontWeight: 700, color: '#64748B', paddingBottom: '32px' }}>·</span>
      <TimeUnit value={time.seconds} label={t('seconds')} />
    </div>
  )
}
