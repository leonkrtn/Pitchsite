'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (lang: string) => {
    if (lang !== locale) router.replace(pathname, { locale: lang as 'de' | 'en' })
  }

  const col = dark ? 'rgba(255,255,255,0.6)' : '#64748B'
  const active = dark ? '#fff' : '#0F172A'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {(['de', 'en'] as const).map((l, i) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && (
            <span style={{ color: dark ? 'rgba(255,255,255,0.3)' : '#E2E8F0', fontSize: '14px', lineHeight: 1 }}>|</span>
          )}
          <button
            onClick={() => switchTo(l)}
            aria-label={`Switch to ${l.toUpperCase()}`}
            style={{
              background: 'none', border: 'none', cursor: locale === l ? 'default' : 'pointer',
              fontSize: '13px', fontWeight: locale === l ? 600 : 400,
              fontFamily: 'Inter, sans-serif',
              color: locale === l ? active : col,
              padding: '2px 0', transition: 'color 150ms',
            }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
