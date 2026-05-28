'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Hash, ArrowRight, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'

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
  },
}

export default function JoinPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function lookupCode(value: string) {
    const trimmed = value.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const { data: project } = await (supabase as any)
      .from('projects')
      .select('code')
      .eq('code', trimmed)
      .single() as { data: { code: string } | null }

    setLoading(false)

    if (!project) {
      setError(t.notFound)
      return
    }

    router.push(`/${locale}/app/pitch/${trimmed}`)
  }

  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      const normalized = codeFromUrl.toUpperCase()
      setCode(normalized)
      lookupCode(normalized)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <AppLogo />
        </div>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
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
            onKeyDown={e => e.key === 'Enter' && lookupCode(code)}
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
            icon={<ArrowRight size={16} />} onClick={() => lookupCode(code)}
            style={{ marginTop: '8px' }}
          >
            {loading ? t.loading : t.cta}
          </Button>
          <p style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '20px', textAlign: 'center', lineHeight: 1.5 }}>
            {t.hint}
          </p>
        </div>
      </div>
    </div>
  )
}
