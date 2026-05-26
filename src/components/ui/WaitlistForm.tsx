'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function WaitlistForm() {
  const t = useTranslations('waitlist')
  const locale = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [btnHov, setBtnHov] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) return
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.code === 'EXISTS' ? t('errorExists') : t('errorGeneric'))
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMessage(t('errorGeneric'))
      setStatus('error')
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: `1px solid ${focusedField === field ? '#1D4ED8' : '#E5E7EB'}`,
    outline: 'none', fontSize: '14px',
    color: '#0F172A', background: '#fff',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    fontFamily: 'Inter, system-ui, sans-serif',
  })

  return (
    <div style={{ width: '100%', maxWidth: '448px' }}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ padding: '32px 0' }}
          >
            <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0F172A', marginBottom: '8px' }}>
              {t('success')}
            </p>
            <p style={{ color: '#64748B', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {t('successSub')}
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <input
              type="text" required minLength={2}
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('name')}
            />
            <input
              type="email" required
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
            />
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox" required
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer', accentColor: '#1D4ED8' }}
              />
              <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {t('consent')}
              </span>
            </label>

            {status === 'error' && (
              <p style={{ fontSize: '14px', color: '#DC2626', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !consent}
              onMouseEnter={() => setBtnHov(true)}
              onMouseLeave={() => setBtnHov(false)}
              style={{
                width: '100%', background: btnHov && !status.startsWith('loading') ? '#1E40AF' : '#1D4ED8',
                color: '#fff', fontWeight: 600, padding: '14px 24px',
                borderRadius: '12px', fontSize: '14px', border: 'none',
                cursor: status === 'loading' || !consent ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' || !consent ? 0.5 : 1,
                transition: 'transform 160ms ease-out, opacity 150ms ease-out, background-color 150ms ease-out',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {status === 'loading' ? '...' : t('cta')}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
