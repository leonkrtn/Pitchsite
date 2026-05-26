'use client'

import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { WaitlistForm } from '@/components/ui/WaitlistForm'

export function WaitlistSection() {
  const t = useTranslations('waitlist')

  return (
    <section id="warteliste" style={{ padding: '96px 24px', background: '#F8FAFC', scrollMarginTop: '56px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '12px', maxWidth: '576px' }}>
            {t('headline')}
          </h2>
          <p style={{ color: '#64748B', marginBottom: '40px', maxWidth: '384px', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('subline')}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <WaitlistForm />
        </ScrollReveal>
      </div>
    </section>
  )
}
