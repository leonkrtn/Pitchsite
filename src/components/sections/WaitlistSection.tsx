import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { WaitlistForm } from '@/components/ui/WaitlistForm'

export function WaitlistSection() {
  const t = useTranslations('waitlist')

  return (
    <section id="warteliste" className="py-24 sm:py-32 px-6 sm:px-8 bg-surface scroll-mt-14">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-3 max-w-xl">
            {t('headline')}
          </h2>
          <p className="text-muted mb-10 max-w-sm leading-relaxed">{t('subline')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <WaitlistForm />
        </ScrollReveal>
      </div>
    </section>
  )
}
