import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function BestaetigtPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'confirmed' })

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-blue-light flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
            <path d="M5 12l5 5L19 7" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display font-extrabold text-3xl text-ink mb-3">{t('headline')}</h1>
        <p className="text-muted leading-relaxed mb-8">{t('body')}</p>
        <Link
          href="/"
          locale={locale as 'de' | 'en'}
          className="inline-block text-sm font-semibold text-blue-royal hover:underline"
        >
          {t('cta')}
        </Link>
      </div>
    </main>
  )
}
