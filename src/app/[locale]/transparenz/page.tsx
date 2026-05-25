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
  type Example = { label: string; lines: string[]; hint?: string }
  const sections = t.raw('sections') as Array<{
    title: string
    body: string
    note?: string
    examples?: Example[]
    footnote?: string
  }>

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
                {section.examples && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.examples.map((ex, k) => (
                      <div key={k} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-blue-royal uppercase tracking-widest mb-3">{ex.label}</p>
                        <div className="space-y-1">
                          {ex.lines.map((line, l) => (
                            <p key={l} className={`text-sm font-mono leading-relaxed ${line.startsWith('Auszahlung') || line.startsWith('Payout') ? 'text-ink font-semibold' : 'text-muted'}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                        {ex.hint && (
                          <p className="text-[11px] text-muted/70 mt-3 pt-3 border-t border-gray-200 leading-relaxed">
                            {ex.hint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {section.footnote && (
                  <p className="mt-3 text-xs text-muted/60">{section.footnote}</p>
                )}
                {section.note && (
                  <div className="mt-5 flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
                    <svg className="w-4 h-4 text-blue-royal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <p className="text-sm text-blue-900/80 leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
