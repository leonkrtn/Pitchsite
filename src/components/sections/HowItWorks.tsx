import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="bg-white rounded-2xl p-8 h-full border border-gray-100">
                <span className="font-mono text-xs font-bold text-blue-royal/50 block mb-4 tabular-nums">
                  {step.number}
                </span>
                <h3 className="font-display font-bold text-lg text-ink mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{step.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
