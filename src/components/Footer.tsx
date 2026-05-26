'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const router = useRouter()
  const [platformHov, setPlatformHov] = useState(false)

  return (
    <footer style={{ borderTop: '1px solid #F1F5F9', padding: '40px 24px' }}>
      <div style={{
        maxWidth: '1024px', margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        fontSize: '14px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <p>{t('rights')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'default', opacity: 0.5 }}>{t('impressum')}</span>
          <span style={{ cursor: 'default', opacity: 0.5 }}>{t('datenschutz')}</span>
          <button
            onClick={() => router.push(`/${locale}/app/login`)}
            onMouseEnter={() => setPlatformHov(true)}
            onMouseLeave={() => setPlatformHov(false)}
            style={{
              fontSize: '13px', fontWeight: 500,
              color: platformHov ? '#1D4ED8' : '#94A3B8',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 150ms ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {t('tryPlatform')}
          </button>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  )
}
