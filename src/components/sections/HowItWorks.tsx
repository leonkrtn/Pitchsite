import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const stepIcons = [
  // Upload
  (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <rect x="6" y="14" width="28" height="22" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M14 14V10a6 6 0 0 1 12 0v4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 20v8M17 23l3-3 3 3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // Feedback & Sign
  (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <path d="M6 10a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H15l-5 5v-5H9a3 3 0 0 1-3-3V10Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 30l4-4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="28" cy="15" r="2" fill="#1D4ED8" opacity="0.4" />
      <path d="M22 20a6 6 0 0 1 6-6" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // Payout
  (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <rect x="4" y="10" width="32" height="20" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="5" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M20 17v6M18 19h3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 27l4 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 29l2-2" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
]

export function HowItWorks() {
  const t = useTranslations('howitworks')
  const steps = t.raw('steps') as Array<{ number: string; title: string; body: string }>

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8 bg-surface">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-16 max-w-xl">
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%_-_16px)] w-[calc(100%_+_24px)] h-px bg-gray-200 z-0" />
                )}
                <div className="relative z-10 bg-surface">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-mono text-xs font-bold text-blue-royal/40 pt-1 shrink-0 tabular-nums">
                      {step.number}
                    </span>
                    {stepIcons[i]}
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink mb-2">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
