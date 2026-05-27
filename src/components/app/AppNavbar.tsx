'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, Settings, LogOut, Check } from 'lucide-react'
import { Button } from './ds'
import { createBrowserClient } from '@/lib/supabase'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

// ── LOGO ──────────────────────────────────────────────────

export function AppLogo({ size = 20, dark = false, href }: { size?: number; dark?: boolean; href?: string }) {
  const router = useRouter()
  return (
    <div
      onClick={() => href && router.push(href)}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: href ? 'pointer' : 'default' }}
    >
      <span style={{
        fontSize: `${size}px`, fontWeight: 700,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: dark ? '#fff' : '#0F172A', letterSpacing: '-0.03em',
      }}>pitchsite</span>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: dark ? 'rgba(255,255,255,0.7)' : '#1D4ED8', flexShrink: 0,
      }} />
    </div>
  )
}

// ── DASHBOARD NAVBAR ──────────────────────────────────────

interface NavbarDashboardProps {
  locale: string
  userName?: string
  userInitials?: string
}

export function NavbarDashboard({ locale, userName, userInitials = 'PS' }: NavbarDashboardProps) {
  const router = useRouter()
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/app/login`)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 50,
      background: '#fff', borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <div
        onClick={() => router.push(`/${locale}/app/dashboard`)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <span style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', color: '#0F172A',
        }}>
          Pitchsite
        </span>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
        <span style={{
          fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A',
        }}>
          Dashboard
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <LanguageToggle />
        <div style={{ position: 'relative', marginLeft: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Bell size={20} color="#64748B" />
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626',
            border: '1.5px solid #fff',
          }} />
        </div>

        <div ref={dropRef} style={{ position: 'relative', marginLeft: '16px' }}>
          <div
            onClick={() => setDropOpen(v => !v)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none',
              fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#fff',
            }}
          >
            {userInitials}
          </div>

          {dropOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              width: '200px', background: '#fff',
              border: '1px solid #E2E8F0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,.12)', padding: '8px 0',
              animation: 'dropIn 150ms ease-out',
            }}>
              {userName && (
                <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{userName}</div>
                </div>
              )}
              <DropItem icon={<User size={16} />} label="Mein Profil" onClick={() => setDropOpen(false)} />
              <DropItem icon={<Settings size={16} />} label="Einstellungen" onClick={() => setDropOpen(false)} />
              <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />
              <DropItem icon={<LogOut size={16} />} label="Abmelden" color="#DC2626" textColor="#DC2626" onClick={handleSignOut} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DropItem({ icon, label, color = '#64748B', textColor, onClick }: {
  icon: React.ReactNode; label: string; color?: string; textColor?: string; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        height: '40px', padding: '0 16px', cursor: 'pointer',
        background: hov ? '#F8FAFC' : 'transparent', transition: 'background 120ms',
      }}
    >
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: textColor || '#374151' }}>{label}</span>
    </div>
  )
}

// ── MARKETING NAVBAR ──────────────────────────────────────

export function NavbarMarketing({ locale }: { locale: string }) {
  const router = useRouter()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 50,
      background: '#fff', borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <AppLogo href={`/${locale}/app/pitch`} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LanguageToggle />
        <Button variant="secondary" size="sm" onClick={() => router.push(`/${locale}/app/login`)} style={{ marginLeft: '8px' }}>
          {locale === 'en' ? 'Sign in' : 'Anmelden'}
        </Button>
        <Button variant="primary" size="sm" onClick={() => router.push(`/${locale}/app/signup`)}>
          {locale === 'en' ? 'Get started' : 'Kostenlos starten'}
        </Button>
      </div>
    </div>
  )
}

// ── PROGRESS HEADER ───────────────────────────────────────

export function ProgressHeader({ step, locale = 'de' }: { step: number; locale?: string }) {
  const steps = locale === 'en'
    ? [{ label: 'Design viewed', n: 1 }, { label: 'Review contract', n: 2 }, { label: 'Payment', n: 3 }]
    : [{ label: 'Design angesehen', n: 1 }, { label: 'Vertrag prüfen', n: 2 }, { label: 'Bezahlen', n: 3 }]

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 50,
      background: '#fff', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <AppLogo />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {steps.map((s, i) => (
          <span key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: '48px', height: '1px', background: s.n <= step ? '#16A34A' : '#E2E8F0', margin: '0 4px' }} />
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {s.n < step ? (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={13} color="#fff" strokeWidth={2.5} />
                </div>
              ) : (
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: s.n === step ? '#1D4ED8' : '#F1F5F9',
                  border: s.n === step ? 'none' : '1.5px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                  color: s.n === step ? '#fff' : '#94A3B8',
                }}>{s.n}</div>
              )}
              <span style={{
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                fontWeight: s.n <= step ? 600 : 400,
                color: s.n < step ? '#16A34A' : s.n === step ? '#0F172A' : '#94A3B8',
              }}>{s.label}</span>
            </span>
          </span>
        ))}
      </div>
      <span style={{ fontSize: '13px', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
        {locale === 'en' ? `Step ${step} of 3` : `Schritt ${step} von 3`}
      </span>
    </div>
  )
}
