import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

function IllustrationWaiting() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full max-w-[220px]"
    >
      {/* Laptop */}
      <rect x="40" y="60" width="120" height="76" rx="4" stroke="#1D4ED8" strokeWidth="1.5" />
      <rect x="50" y="68" width="100" height="56" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M20 136h160" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="84" y="136" width="32" height="4" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
      {/* Screen content — empty lines suggesting unanswered message */}
      <rect x="60" y="76" width="48" height="4" rx="2" fill="#1D4ED8" opacity="0.2" />
      <rect x="60" y="84" width="32" height="4" rx="2" fill="#1D4ED8" opacity="0.15" />
      {/* Clock / waiting indicator */}
      <circle cx="148" cy="86" r="12" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M148 79v7l4 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Person */}
      <circle cx="100" cy="34" r="10" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M80 55c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Three dots — waiting */}
      <circle cx="70" cy="28" r="2" fill="#1D4ED8" opacity="0.4" />
      <circle cx="78" cy="28" r="2" fill="#1D4ED8" opacity="0.6" />
      <circle cx="86" cy="28" r="2" fill="#1D4ED8" opacity="0.9" />
    </svg>
  )
}

export function Problem() {
  const t = useTranslations('problem')
  const paragraphs = t('body').split('\n\n')

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8 bg-surface">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-12 max-w-xl">
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <ScrollReveal delay={0.1}>
            <div className="space-y-5">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-base sm:text-lg text-muted leading-relaxed">
                  {p}
                </p>
              ))}
              <p className="text-sm font-semibold text-ink mt-6 pt-6 border-t border-gray-200">
                {t('caption')}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="flex justify-center md:justify-end">
            <IllustrationWaiting />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
