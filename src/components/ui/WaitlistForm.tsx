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
        setErrorMessage(
          data.code === 'EXISTS' ? t('errorExists') : t('errorGeneric')
        )
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMessage(t('errorGeneric'))
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="py-8"
          >
            <p className="font-display font-bold text-2xl text-ink mb-2">{t('success')}</p>
            <p className="text-muted leading-relaxed">{t('successSub')}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              required
              minLength={2}
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-ink placeholder:text-muted/60 text-sm focus:outline-none focus:border-blue-royal focus:ring-2 focus:ring-blue-royal/10 transition-all duration-150"
            />
            <input
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-ink placeholder:text-muted/60 text-sm focus:outline-none focus:border-blue-royal focus:ring-2 focus:ring-blue-royal/10 transition-all duration-150"
            />
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-royal focus:ring-blue-royal/20 cursor-pointer shrink-0"
              />
              <span className="text-xs text-muted leading-relaxed group-hover:text-ink/70 transition-colors">
                {t('consent')}
              </span>
            </label>

            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !consent}
              className="w-full bg-blue-royal text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              style={{ transition: 'transform 160ms ease-out, opacity 150ms ease-out, background-color 150ms ease-out' }}
            >
              {status === 'loading' ? '...' : t('cta')}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
