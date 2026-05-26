'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [hov, setHov] = useState(false)

  const toggle = () => {
    router.replace(pathname, { locale: locale === 'de' ? 'en' : 'de' })
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Switch language"
      style={{
        fontSize: '14px', fontWeight: 500,
        color: hov ? '#0F172A' : '#64748B',
        background: 'none', border: 'none', cursor: 'pointer',
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 150ms ease',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {locale === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
