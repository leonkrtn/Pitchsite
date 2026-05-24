'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggle = () => {
    router.replace(pathname, { locale: locale === 'de' ? 'en' : 'de' })
  }

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-muted hover:text-ink transition-colors duration-150 tabular-nums"
      aria-label="Switch language"
    >
      {locale === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
