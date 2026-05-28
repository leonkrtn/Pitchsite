'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, MessageCircle } from 'lucide-react'
import { Button, Input, OrDivider } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  de: {
    headline: 'Konto erstellen',
    sub: 'Schon dabei?',
    subLink: 'Anmelden',
    name: 'Vollständiger Name',
    namePh: 'Lisa Mayer',
    email: 'E-Mail-Adresse',
    emailPh: 'lisa@beispiel.de',
    password: 'Passwort',
    passwordPh: 'Mindestens 8 Zeichen',
    password2: 'Passwort bestätigen',
    password2Ph: 'Passwort wiederholen',
    agree: 'Ich stimme den',
    agreeAnd: 'und der',
    agreeAGB: 'AGB',
    agreePrivacy: 'Datenschutzerklärung',
    agreeTo: 'zu',
    submit: 'Konto erstellen',
    google: 'Mit Google anmelden',
    googleSoon: 'Google-Login kommt bald!',
    errorMismatch: 'Passwörter stimmen nicht überein.',
    errorWeak: 'Passwort muss mindestens 8 Zeichen haben.',
    errorEmail: 'Diese E-Mail ist bereits registriert.',
    errorGeneric: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    footer: '© 2025 Axion Nord UG (haftungsbeschränkt) · Impressum · Datenschutz',
    pwLabels: ['', 'Schwach', 'Mittel', 'Gut', 'Stark'],
  },
  en: {
    headline: 'Create account',
    sub: 'Already have one?',
    subLink: 'Sign in',
    name: 'Full name',
    namePh: 'Lisa Mayer',
    email: 'Email address',
    emailPh: 'lisa@example.com',
    password: 'Password',
    passwordPh: 'At least 8 characters',
    password2: 'Confirm password',
    password2Ph: 'Repeat password',
    agree: 'I agree to the',
    agreeAnd: 'and the',
    agreeAGB: 'Terms',
    agreePrivacy: 'Privacy Policy',
    agreeTo: '',
    submit: 'Create account',
    google: 'Continue with Google',
    googleSoon: 'Google login coming soon!',
    errorMismatch: 'Passwords do not match.',
    errorWeak: 'Password must be at least 8 characters.',
    errorEmail: 'This email is already registered.',
    errorGeneric: 'Registration failed. Please try again.',
    footer: '© 2025 Axion Nord UG (haftungsbeschränkt) · Imprint · Privacy',
    pwLabels: ['', 'Weak', 'Medium', 'Good', 'Strong'],
  },
}

const features = [
  { Icon: Shield, title: { de: 'Rechtssicherer Vertrag', en: 'Legally binding contract' }, sub: { de: 'Gültig in DE, AT und CH', en: 'Valid in DE, AT and CH' } },
  { Icon: Lock, title: { de: 'Escrow-Schutz', en: 'Escrow protection' }, sub: { de: 'Geld liegt sicher bis zur Abnahme', en: 'Funds secured until approval' } },
  { Icon: MessageCircle, title: { de: 'Echtzeit-Feedback', en: 'Real-time feedback' }, sub: { de: 'Kunden kommentieren direkt auf deinem Design', en: 'Clients comment directly on your design' } },
]

function PwStrength({ pw, labels }: { pw: string; labels: string[] }) {
  const strength = !pw ? 0 : pw.length < 6 ? 1 : pw.length < 8 ? 2 : pw.length < 12 ? 3 : 4
  const colors = ['#E2E8F0', '#DC2626', '#F59E0B', '#3B82F6', '#16A34A']
  if (!pw) return null
  return (
    <div style={{ margin: '8px 0 20px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '9999px', background: i <= strength ? colors[strength] : '#E2E8F0', transition: 'background 200ms' }} />
        ))}
      </div>
      <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: colors[strength] }}>
        {labels[strength]}
      </div>
    </div>
  )
}

export default function SignupPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const { isMobile } = useBreakpoint()
  const supabase = createBrowserClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSubmit = async () => {
    if (!name || !email || !password || !agree) return
    if (password.length < 8) { setError(t.errorWeak); return }
    if (password !== password2) { setError(t.errorMismatch); return }

    setLoading(true)
    setError('')

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    setLoading(false)

    if (signupError) {
      if (signupError.message.includes('already registered') || signupError.message.includes('already exists')) {
        setError(t.errorEmail)
      } else {
        setError(t.errorGeneric)
      }
    } else {
      router.push(`/${locale}/app/dashboard`)
    }
  }

  const isValid = name && email && password && password.length >= 8 && password === password2 && agree

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', padding: '12px 20px',
          borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          animation: 'fadeInUp 200ms ease-out',
        }}>{toast}</div>
      )}

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
            onClick={() => router.push(`/${locale}/app/login`)}
            style={{ color: '#1D4ED8', textDecoration: 'underline', cursor: 'pointer' }}
          >{t.subLink}</span>
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
            fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#991B1B',
          }}>{error}</div>
        )}

        <Input
          label={t.name} placeholder={t.namePh}
          value={name} onChange={e => setName(e.target.value)}
          required autoComplete="name"
        />
        <Input
          label={t.email} type="email" placeholder={t.emailPh}
          value={email} onChange={e => setEmail(e.target.value)}
          required autoComplete="email"
        />
        <div>
          <Input
            label={t.password} type="password" placeholder={t.passwordPh}
            value={password} onChange={e => setPassword(e.target.value)}
            required style={{ marginBottom: '0' }} autoComplete="new-password"
          />
          <PwStrength pw={password} labels={t.pwLabels} />
        </div>
        <Input
          label={t.password2} type="password" placeholder={t.password2Ph}
          value={password2} onChange={e => setPassword2(e.target.value)}
          autoComplete="new-password"
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '24px' }}>
          <input
            type="checkbox" id="agree" checked={agree} onChange={e => setAgree(e.target.checked)}
            style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#1D4ED8', cursor: 'pointer', flexShrink: 0 }}
          />
          <label htmlFor="agree" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', lineHeight: 1.5, cursor: 'pointer' }}>
            {t.agree}{' '}
            <span style={{ color: '#1D4ED8', textDecoration: 'underline' }}>{t.agreeAGB}</span>{' '}
            {t.agreeAnd}{' '}
            <span style={{ color: '#1D4ED8', textDecoration: 'underline' }}>{t.agreePrivacy}</span>{' '}
            {t.agreeTo}
          </label>
        </div>

        <Button
          variant="primary" fullWidth loading={loading} onClick={handleSubmit}
          style={{ height: '48px', fontSize: '16px' }}
          disabled={!isValid}
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
