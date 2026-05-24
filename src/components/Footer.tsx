import { useTranslations } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-gray-100 py-10 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>{t('rights')}</p>
        <div className="flex items-center gap-6">
          {/* Shown but not linked — will be added after legal setup */}
          <span className="cursor-default opacity-50">{t('impressum')}</span>
          <span className="cursor-default opacity-50">{t('datenschutz')}</span>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  )
}
