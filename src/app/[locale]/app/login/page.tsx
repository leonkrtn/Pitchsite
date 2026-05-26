'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Shield, Lock, MessageCircle } from 'lucide-react'
import { Button, Input, OrDivider } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  de: {
    headline: 'Willkommen zurück',
    sub: 'Noch kein Konto?',
    subLink: 'Kostenlos starten',
    email: 'E-Mail-Adresse',
    emailPh: 'lisa@beispiel.de',
    password: 'Passwort',
    passwordPh: 'Dein Passwort',
    remember: 'Angemeldet bleiben',
    forgot: 'Passwort vergessen?',
    submit: 'Anmelden',
    google: 'Mit Google anmelden',
    googleSoon: 'Google-Login kommt bald!',
    errorInvalid: 'Ungültige E-Mail oder Passwort.',
    footer: '© 2025 Pitchsite GmbH · Impressum · Datenschutz',
  },
  en: {
    headline: 'Welcome back',
    sub: 'No account yet?',
    subLink: 'Get started free',
    email: 'Email address',
    emailPh: 'lisa@example.com',
    password: 'Password',
    passwordPh: 'Your password',
    remember: 'Stay logged in',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    google: 'Continue with Google',
    googleSoon: 'Google login coming soon!',
    errorInvalid: 'Invalid email or password.',
    footer: '© 2025 Pitchsite GmbH · Imprint · Privacy',
  },
}

const features = [
  { Icon: Shield, title: { de: 'Rechtssicherer Vertrag', en: 'Legally binding contract' }, sub: { de: 'Gültig in DE, AT und CH', en: 'Valid in DE, AT and CH' } },
  { Icon: Lock, title: { de: 'Escrow-Schutz', en: 'Escrow protection' }, sub: { de: 'Geld liegt sicher bis zur Abnahme', en: 'Funds secured until approval' } },
  { Icon: MessageCircle, title: { de: 'Echtzeit-Feedback', en: 'Real-time feedback' }, sub: { de: 'Kunden kommentieren direkt auf deinem Design', en: 'Clients comment directly on your design' } },
]

export default function LoginPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const { isMobile } = useBreakpoint()
  const supabase = createBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(t.errorInvalid)
    } else {
      router.push(`/${locale}/app/dashboard`)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', padding: '12px 20px',
          borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          animation: 'fadeInUp 200ms ease-out',
        }}>{toast}</div>
      )}

      {/* Left panel — hidden on mobile */}
      {!isMobile && (
        <div style={{
          width: '50%', background: '#1D4ED8', position: 'relative',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          padding: '64px',
        }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '80px', right: '40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />

          <AppLogo size={24} dark />

          <div style={{ marginTop: '48px', flex: 1 }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
              Endlich bezahlt.
            </h1>
            <p style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.8)', maxWidth: '380px', marginBottom: '48px', lineHeight: 1.5 }}>
              Pitchsite sichert dein Honorar bevor du eine Zeile Code schreibst.
            </p>

            {features.map(({ Icon, title, sub }) => (
              <div key={title.de} style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(255,255,255,.15)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#fff' }}>
                    {title[locale as 'de' | 'en'] ?? title.de}
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.7)', marginTop: '2px' }}>
                    {sub[locale as 'de' | 'en'] ?? sub.de}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.6)' }}>
            Bereits 1.200+ Designer auf der Warteliste
          </div>
        </div>
      )}

      {/* Right panel */}
      <div style={{
        width: isMobile ? '100%' : '50%',
        background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '40px 24px' : '64px 80px',
        overflow: 'auto',
      }}>
        {isMobile && <div style={{ marginBottom: '32px' }}><AppLogo size={22} /></div>}

        <h2 style={{ fontSize: '30px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
          {t.headline}
        </h2>
        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '40px' }}>
          {t.sub}{' '}
          <span
            onClick={() => router.push(`/${locale}/app/signup`)}
            style={{ color: '#1D4ED8', textDecoration: 'underline', cursor: 'pointer' }}
          >{t.subLink}</span>
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
          }}>
            <AlertCircle size={16} color="#DC2626" />
            <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#991B1B' }}>{error}</span>
          </div>
        )}

        <Input
          label={t.email} type="email" placeholder={t.emailPh}
          value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label={t.password} type="password" placeholder={t.passwordPh}
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoComplete="current-password"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#1D4ED8' }} />
            {t.remember}
          </label>
          <span style={{ fontSize: '14px', color: '#1D4ED8', fontFamily: 'Inter, sans-serif', cursor: 'pointer', textDecoration: 'underline' }}>
            {t.forgot}
          </span>
        </div>

        <Button
          variant="primary" fullWidth loading={loading} onClick={handleSubmit}
          style={{ height: '48px', fontSize: '16px' }}
          disabled={!email || !password}
        >
          {t.submit}
        </Button>

        <OrDivider label={locale === 'en' ? 'or' : 'oder'} />

        <GoogleButton label={t.google} onDemoClick={() => showToast(t.googleSoon)} />

        <p style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '40px', textAlign: 'center' }}>
          {t.footer}
        </p>
      </div>
    </div>
  )
}

function GoogleButton({ label, onDemoClick }: { label: string; onDemoClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onDemoClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        background: hov ? '#F8FAFC' : '#fff', border: '1.5px solid #E2E8F0',
        borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
        fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A',
        transition: 'all 150ms',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  )
}
