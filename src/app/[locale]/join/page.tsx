'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hash, ArrowRight, AlertCircle, Lock } from 'lucide-react'
import { Button, Input } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'

type FoundProject = { code: string; pitch_password: string | null; pitch_password_changed: boolean }

const T = {
  de: {
    title: 'Projektcode eingeben',
    sub: 'Gib den 10-stelligen Code ein, den du von deinem Auftragnehmer erhalten hast.',
    label: 'Projektcode',
    placeholder: 'z. B. A1B2C3D4E5',
    cta: 'Weiter',
    loading: 'Wird geprüft…',
    notFound: 'Kein Projekt mit diesem Code gefunden. Bitte überprüfe die Eingabe.',
    hint: 'Den Code bekommst du direkt von deinem Freelancer / Designer.',
    // password step
    pwTitle: 'Passwort eingeben',
    pwSub: 'Dieses Projekt ist passwortgeschützt.',
    pwLabel: 'Passwort',
    pwPh: 'Dein Projektpasswort',
    pwCta: 'Projekt öffnen',
    pwLoading: 'Wird geprüft…',
    pwWrong: 'Falsches Passwort. Bitte versuche es erneut.',
    pwBack: 'Anderen Code eingeben',
  },
  en: {
    title: 'Enter project code',
    sub: 'Enter the 10-character code you received from your contractor.',
    label: 'Project code',
    placeholder: 'e.g. A1B2C3D4E5',
    cta: 'Continue',
    loading: 'Checking…',
    notFound: 'No project found with this code. Please check your input.',
    hint: 'You receive this code directly from your freelancer / designer.',
    pwTitle: 'Enter password',
    pwSub: 'This project is password-protected.',
    pwLabel: 'Password',
    pwPh: 'Your project password',
    pwCta: 'Open project',
    pwLoading: 'Checking…',
    pwWrong: 'Wrong password. Please try again.',
    pwBack: 'Enter a different code',
  },
}

export default function JoinPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [step, setStep] = useState<'code' | 'password'>('code')
  const [code, setCode] = useState('')
  const [pitchPw, setPitchPw] = useState('')
  const [foundProject, setFoundProject] = useState<FoundProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCodeSubmit() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const { data: project } = await (supabase as any)
      .from('projects')
      .select('code, pitch_password, pitch_password_changed')
      .eq('code', trimmed)
      .single() as { data: FoundProject | null }

    setLoading(false)

    if (!project) {
      setError(t.notFound)
      return
    }

    setFoundProject(project)

    if (project.pitch_password) {
      setStep('password')
    } else {
      localStorage.setItem(`pitch_access_${trimmed}`, Date.now().toString())
      router.push(`/${locale}/app/pitch/${trimmed}`)
    }
  }

  async function handlePasswordSubmit() {
    if (!foundProject) return
    setLoading(true)
    setError('')

    if (pitchPw !== foundProject.pitch_password) {
      setError(t.pwWrong)
      setLoading(false)
      return
    }

    localStorage.setItem(`pitch_access_${foundProject.code}`, Date.now().toString())
    setLoading(false)

    if (!foundProject.pitch_password_changed) {
      router.push(`/${locale}/app/pitch/${foundProject.code}?setup=1`)
    } else {
      router.push(`/${locale}/app/pitch/${foundProject.code}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <AppLogo />
        </div>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

          {step === 'code' ? (
            <>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Hash size={22} color="#1D4ED8" />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
                {t.title}
              </h1>
              <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '32px', lineHeight: 1.6 }}>
                {t.sub}
              </p>
              <Input
                label={t.label}
                placeholder={t.placeholder}
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                autoFocus
                style={{ marginBottom: error ? '4px' : '0' }}
                inputStyle={{ fontFamily: '"Geist Mono", monospace', fontSize: '16px', letterSpacing: '0.08em' }}
              />
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                  <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#DC2626' }}>{error}</span>
                </div>
              )}
              <Button
                variant="primary" fullWidth loading={loading}
                icon={<ArrowRight size={16} />} onClick={handleCodeSubmit}
                style={{ marginTop: '8px' }}
              >
                {loading ? t.loading : t.cta}
              </Button>
              <p style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '20px', textAlign: 'center', lineHeight: 1.5 }}>
                {t.hint}
              </p>
            </>
          ) : (
            <>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Lock size={22} color="#1D4ED8" />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
                {t.pwTitle}
              </h1>
              <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '8px', lineHeight: 1.6 }}>
                {t.pwSub}
              </p>
              <div style={{ fontSize: '13px', fontFamily: '"Geist Mono", monospace', color: '#1D4ED8', background: '#EFF6FF', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', marginBottom: '24px', letterSpacing: '0.08em' }}>
                {foundProject?.code}
              </div>
              <Input
                label={t.pwLabel}
                type="password"
                placeholder={t.pwPh}
                value={pitchPw}
                onChange={e => { setPitchPw(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
                style={{ marginBottom: error ? '4px' : '0' }}
              />
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                  <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#DC2626' }}>{error}</span>
                </div>
              )}
              <Button
                variant="primary" fullWidth loading={loading}
                icon={<ArrowRight size={16} />} onClick={handlePasswordSubmit}
                style={{ marginTop: '8px' }}
              >
                {loading ? t.pwLoading : t.pwCta}
              </Button>
              <button
                onClick={() => { setStep('code'); setError(''); setPitchPw('') }}
                style={{ marginTop: '16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', textDecoration: 'underline' }}
              >
                {t.pwBack}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
