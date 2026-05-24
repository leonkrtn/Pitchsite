import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Link } from '@/i18n/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transparency' })
  return {
    title: `${t('title')} — Pitchsite`,
    description: t('metaDescription'),
  }
}

export default async function TransparenzPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transparency' })
  const sections = t.raw('sections') as Array<{ title: string; body: string }>

  return (
    <>
      <Navigation />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <Link
            href="/"
            locale={locale as 'de' | 'en'}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-10"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {locale === 'de' ? 'Zurück' : 'Back'}
          </Link>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-tight mb-6">
            {t('title')}
          </h1>
          <p className="text-lg text-muted leading-relaxed mb-16 border-b border-gray-100 pb-16">
            {t('intro')}
          </p>

          <div className="space-y-14">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-display font-bold text-xl text-ink mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.split('\n\n').map((para, j) => (
                    <p key={j} className="text-muted leading-relaxed whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
