'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Shield, Lock, MessageCircle, Hash } from 'lucide-react'
import { Button, Input, OrDivider } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  de: {
    tabLogin: 'Anmelden',
    tabSignup: 'Registrieren',
    // login
    loginHeadline: 'Willkommen zurück',
    email: 'E-Mail-Adresse',
    emailPh: 'lisa@beispiel.de',
    password: 'Passwort',
    passwordPh: 'Dein Passwort',
    remember: 'Angemeldet bleiben',
    forgot: 'Passwort vergessen?',
    loginSubmit: 'Anmelden',
    loginError: 'Ungültige E-Mail oder Passwort.',
    // signup
    signupHeadline: 'Konto erstellen',
    name: 'Vollständiger Name',
    namePh: 'Lisa Mayer',
    newPassword: 'Passwort',
    newPasswordPh: 'Mindestens 8 Zeichen',
    password2: 'Passwort bestätigen',
    password2Ph: 'Passwort wiederholen',
    signupSubmit: 'Konto erstellen',
    signupErrorMismatch: 'Passwörter stimmen nicht überein.',
    signupErrorWeak: 'Passwort muss mindestens 8 Zeichen haben.',
    signupErrorEmail: 'Diese E-Mail ist bereits registriert.',
    signupErrorGeneric: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    pwLabels: ['', 'Schwach', 'Mittel', 'Gut', 'Stark'] as string[],
    // google
    google: 'Mit Google anmelden',
    googleSoon: 'Google-Login kommt bald!',
    // code
    codeTitle: 'Projektcode eingeben',
    codeSub: 'Code von deinem Designer erhalten?',
    codePh: 'z.B. AB3X7K9PQR',
    codeSubmit: 'Öffnen',
    codeError: 'Code nicht gefunden. Bitte prüfe deine Eingabe.',
    // footer
    footer: '© 2025 Pitchsite GmbH · Impressum · Datenschutz',
  },
  en: {
    tabLogin: 'Sign in',
    tabSignup: 'Register',
    loginHeadline: 'Welcome back',
    email: 'Email address',
    emailPh: 'lisa@example.com',
    password: 'Password',
    passwordPh: 'Your password',
    remember: 'Stay logged in',
    forgot: 'Forgot password?',
    loginSubmit: 'Sign in',
    loginError: 'Invalid email or password.',
    signupHeadline: 'Create account',
    name: 'Full name',
    namePh: 'Lisa Mayer',
    newPassword: 'Password',
    newPasswordPh: 'At least 8 characters',
    password2: 'Confirm password',
    password2Ph: 'Repeat password',
    signupSubmit: 'Create account',
    signupErrorMismatch: 'Passwords do not match.',
    signupErrorWeak: 'Password must be at least 8 characters.',
    signupErrorEmail: 'This email is already registered.',
    signupErrorGeneric: 'Registration failed. Please try again.',
    pwLabels: ['', 'Weak', 'Medium', 'Good', 'Strong'] as string[],
    google: 'Continue with Google',
    googleSoon: 'Google login coming soon!',
    codeTitle: 'Enter project code',
    codeSub: 'Received a code from your designer?',
    codePh: 'e.g. AB3X7K9PQR',
    codeSubmit: 'Open',
    codeError: 'Code not found. Please check your input.',
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
  const tr = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const { isMobile } = useBreakpoint()
  const supabase = createBrowserClient()

  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [toast, setToast] = useState('')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Signup state
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPw, setSuPw] = useState('')
  const [suPw2, setSuPw2] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')

  // Code state
  const [code, setCode] = useState('')
  const [codeFocused, setCodeFocused] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogin = async () => {
    if (!email || !password) return
    setLoginLoading(true)
    setLoginError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoginLoading(false)
    if (authError) setLoginError(tr.loginError)
    else router.push(`/${locale}/app/dashboard`)
  }

  const handleSignup = async () => {
    if (suPw !== suPw2) { setSignupError(tr.signupErrorMismatch); return }
    if (suPw.length < 8) { setSignupError(tr.signupErrorWeak); return }
    setSignupLoading(true)
    setSignupError('')
    const { data, error: authError } = await supabase.auth.signUp({ email: suEmail, password: suPw })
    if (!authError && data.user) {
      await (supabase as any).from('profiles').upsert({ id: data.user.id, name: suName.trim(), email: suEmail.trim() })
    }
    setSignupLoading(false)
    if (authError) {
      setSignupError(authError.message?.toLowerCase().includes('already') ? tr.signupErrorEmail : tr.signupErrorGeneric)
    } else {
      router.push(`/${locale}/app/dashboard`)
    }
  }

  const handleCode = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setCodeLoading(true)
    setCodeError('')
    const { data } = await (supabase as any)
      .from('projects').select('code').eq('code', trimmed).single() as { data: { code: string } | null }
    setCodeLoading(false)
    if (!data) { setCodeError(tr.codeError); return }
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pitch_access_${trimmed}`, String(Date.now()))
    }
    router.push(`/${locale}/app/pitch/${trimmed}`)
  }

  const pwStrength = !suPw ? 0 : suPw.length < 6 ? 1 : suPw.length < 8 ? 2 : suPw.length < 12 ? 3 : 4
  const pwColors = ['#E2E8F0', '#DC2626', '#F59E0B', '#3B82F6', '#16A34A']

  const codeCard = (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: '16px', padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: '#EFF6FF', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Hash size={17} color="#1D4ED8" />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
          {tr.codeTitle}
        </span>
      </div>
      <p style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '16px', paddingLeft: '44px' }}>
        {tr.codeSub}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
          onKeyDown={e => e.key === 'Enter' && handleCode()}
          onFocus={() => setCodeFocused(true)}
          onBlur={() => setCodeFocused(false)}
          placeholder={tr.codePh}
          style={{
            flex: 1, height: '44px',
            border: `1.5px solid ${codeError ? '#DC2626' : codeFocused ? '#1D4ED8' : '#E2E8F0'}`,
            borderRadius: '8px', padding: '0 14px',
            fontSize: '15px', fontFamily: '"Geist Mono", "Courier New", monospace',
            letterSpacing: '0.08em', color: '#0F172A',
            outline: 'none', background: '#fff',
            boxShadow: codeFocused ? '0 0 0 3px rgba(29,78,216,.12)' : 'none',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
        />
        <Button
          variant="primary" loading={codeLoading}
          disabled={code.trim().length < 6}
          onClick={handleCode}
          style={{ height: '44px', flexShrink: 0 }}
        >
          {tr.codeSubmit}
        </Button>
      </div>
      {codeError && (
        <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
          {codeError}
        </p>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
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

      {/* Left panel — desktop only */}
      {!isMobile && (
        <div style={{
          width: '44%', background: '#1D4ED8', flexShrink: 0,
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', padding: '64px',
        }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '80px', right: '40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
          <AppLogo size={24} dark />
          <div style={{ marginTop: '48px', flex: 1 }}>
            <h1 style={{ fontSize: '42px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
              Endlich bezahlt.
            </h1>
            <p style={{ fontSize: '17px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.8)', maxWidth: '360px', marginBottom: '40px', lineHeight: 1.5 }}>
              Pitchsite sichert dein Honorar bevor du eine Zeile Code schreibst.
            </p>
            {features.map(({ Icon, title, sub }) => (
              <div key={title.de} style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Right panel — scrollable */}
      <div style={{
        flex: 1, background: '#F8FAFC',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: isMobile ? '32px 20px 48px' : '48px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          {isMobile && <div style={{ marginBottom: '28px' }}><AppLogo size={22} /></div>}

          {/* Mobile: code card comes first */}
          {isMobile && <div style={{ marginBottom: '16px' }}>{codeCard}</div>}

          {/* Auth card */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: '16px', padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            marginBottom: '16px',
          }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
              {(['login', 'signup'] as const).map(tv => (
                <button
                  key={tv}
                  onClick={() => setTab(tv)}
                  style={{
                    flex: 1, height: '36px', border: 'none', borderRadius: '7px',
                    background: tab === tv ? '#fff' : 'transparent',
                    color: tab === tv ? '#0F172A' : '#64748B',
                    fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer', transition: 'all 150ms',
                    boxShadow: tab === tv ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                  }}
                >
                  {tv === 'login' ? tr.tabLogin : tr.tabSignup}
                </button>
              ))}
            </div>

            {/* Forms — both always mounted, height animated via CSS grid */}
            <div style={{
              display: 'grid',
              gridTemplateRows: tab === 'login' ? '1fr 0fr' : '0fr 1fr',
              transition: 'grid-template-rows 260ms ease',
            }}>
              {/* Login form */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ pointerEvents: tab === 'login' ? 'auto' : 'none' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>
                    {tr.loginHeadline}
                  </h2>
                  {loginError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                      <AlertCircle size={16} color="#DC2626" />
                      <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#991B1B' }}>{loginError}</span>
                    </div>
                  )}
                  <Input label={tr.email} type="email" placeholder={tr.emailPh} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                  <Input label={tr.password} type="password" placeholder={tr.passwordPh} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
                      <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#1D4ED8' }} />
                      {tr.remember}
                    </label>
                    <span style={{ fontSize: '14px', color: '#1D4ED8', fontFamily: 'Inter, sans-serif', cursor: 'pointer', textDecoration: 'underline' }}>
                      {tr.forgot}
                    </span>
                  </div>
                  <Button variant="primary" fullWidth loading={loginLoading} onClick={handleLogin} style={{ height: '48px', fontSize: '16px' }} disabled={!email || !password}>
                    {tr.loginSubmit}
                  </Button>
                </div>
              </div>

              {/* Signup form */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ pointerEvents: tab === 'signup' ? 'auto' : 'none' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>
                    {tr.signupHeadline}
                  </h2>
                  {signupError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                      <AlertCircle size={16} color="#DC2626" />
                      <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#991B1B' }}>{signupError}</span>
                    </div>
                  )}
                  <Input label={tr.name} placeholder={tr.namePh} value={suName} onChange={e => setSuName(e.target.value)} autoComplete="name" />
                  <Input label={tr.email} type="email" placeholder={tr.emailPh} value={suEmail} onChange={e => setSuEmail(e.target.value)} autoComplete="email" />
                  <Input label={tr.newPassword} type="password" placeholder={tr.newPasswordPh} value={suPw} onChange={e => setSuPw(e.target.value)} autoComplete="new-password" />
                  {suPw && (
                    <div style={{ margin: '-12px 0 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= pwStrength ? pwColors[pwStrength] : '#E2E8F0', transition: 'background 200ms' }} />
                        ))}
                      </div>
                      {tr.pwLabels[pwStrength] && (
                        <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: pwColors[pwStrength] }}>{tr.pwLabels[pwStrength]}</span>
                      )}
                    </div>
                  )}
                  <Input label={tr.password2} type="password" placeholder={tr.password2Ph} value={suPw2} onChange={e => setSuPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} autoComplete="new-password" />
                  <Button variant="primary" fullWidth loading={signupLoading} onClick={handleSignup} style={{ height: '48px', fontSize: '16px' }} disabled={!suName || !suEmail || !suPw || !suPw2}>
                    {tr.signupSubmit}
                  </Button>
                </div>
              </div>
            </div>

            <OrDivider label={locale === 'en' ? 'or' : 'oder'} />
            <GoogleButton label={tr.google} onDemoClick={() => showToast(tr.googleSoon)} />
          </div>

          {/* Desktop: code card below auth */}
          {!isMobile && codeCard}

          <p style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '20px', textAlign: 'center' }}>
            {tr.footer}
          </p>
        </div>
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
