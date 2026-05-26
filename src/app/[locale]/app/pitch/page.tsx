'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/app/ds'
import { NavbarMarketing } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'

const T = {
  de: {
    badge: 'Sicherer Pitch-Zugang',
    headline: 'Dein Design wartet.',
    sub: 'Gib deinen 10-stelligen Projektcode ein um das Design deines Designers zu sehen.',
    codeLabel: 'Projektcode',
    noCode: 'Du hast keinen Code? Bitte deinen Designer darum.',
    submit: 'Design ansehen →',
    errorInvalid: 'Ungültiger Code. Bitte prüfe deine Eingabe.',
    trust: ['Rechtssicher', 'Verschlüsselt', '4,9 / 5 von Designern'],
  },
  en: {
    badge: 'Secure pitch access',
    headline: 'Your design is waiting.',
    sub: 'Enter your 10-digit project code to view your designer\'s work.',
    codeLabel: 'Project code',
    noCode: "Don't have a code? Ask your designer.",
    submit: 'View design →',
    errorInvalid: 'Invalid code. Please check your input.',
    trust: ['Legally binding', 'Encrypted', '4.9 / 5 by designers'],
  },
}

export default function PitchLandingPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    setCode(val)
    setError(false)
  }

  const handleSubmit = async () => {
    if (code.length < 10) { setError(true); return }
    setLoading(true)

    // Verify code exists in DB
    const { data } = await supabase
      .from('projects')
      .select('code')
      .eq('code', code)
      .single()

    setLoading(false)
    if (!data) { setError(true); return }
    router.push(`/${locale}/app/pitch/${code}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <NavbarMarketing locale={locale} />
      <div style={{ paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '80px 24px', width: '100%', maxWidth: '600px', animation: 'fadeInUp 250ms ease-out' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '6px 16px', marginBottom: '24px' }}>
            <Lock size={14} color="#1D4ED8" />
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1D4ED8' }}>
              {t.badge}
            </span>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', lineHeight: 1.1, marginBottom: '16px' }}>
            {t.headline}
          </h1>
          <p style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', color: '#64748B', maxWidth: '440px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            {t.sub}
          </p>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '36px 40px', maxWidth: '480px', margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
              {t.codeLabel}
            </div>
            <CodeInput value={code} onChange={handleInput} onKeyDown={e => e.key === 'Enter' && handleSubmit()} error={error} />
            <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', textAlign: 'center', marginTop: '10px' }}>
              {t.noCode}
            </div>
            <Button
              variant="primary" fullWidth loading={loading}
              onClick={handleSubmit}
              disabled={code.length < 10}
              style={{ height: '52px', fontSize: '16px', marginTop: '24px' }}
            >
              {t.submit}
            </Button>
            {error && (
              <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#DC2626', textAlign: 'center', marginTop: '12px' }}>
                {t.errorInvalid}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              { Icon: ShieldCheck, text: t.trust[0] },
              { Icon: Lock, text: t.trust[1] },
              { Icon: Star, text: t.trust[2] },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={16} color="#94A3B8" />
                <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeInput({ value, onChange, onKeyDown, error }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  error: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="· · · · · · · · · ·"
      maxLength={10}
      style={{
        width: '100%', height: '64px',
        border: `2px solid ${error ? '#DC2626' : focused ? '#1D4ED8' : '#E2E8F0'}`,
        borderRadius: '12px', background: '#fff',
        textAlign: 'center', fontSize: '28px', fontWeight: 700,
        fontFamily: '"Geist Mono", "Courier New", monospace',
        color: '#0F172A', letterSpacing: '0.25em',
        padding: '0 20px', outline: 'none',
        boxShadow: focused ? (error ? '0 0 0 4px rgba(220,38,38,.12)' : '0 0 0 4px rgba(29,78,216,.12)') : 'none',
        transition: 'all 150ms',
      }}
    />
  )
}
