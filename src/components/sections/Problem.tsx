'use client'

import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function IllustrationWaiting() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: '220px' }}
    >
      <rect x="40" y="60" width="120" height="76" rx="4" stroke="#1D4ED8" strokeWidth="1.5" />
      <rect x="50" y="68" width="100" height="56" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M20 136h160" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="84" y="136" width="32" height="4" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
      <rect x="60" y="76" width="48" height="4" rx="2" fill="#1D4ED8" opacity="0.2" />
      <rect x="60" y="84" width="32" height="4" rx="2" fill="#1D4ED8" opacity="0.15" />
      <circle cx="148" cy="86" r="12" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M148 79v7l4 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="34" r="10" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M80 55c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="70" cy="28" r="2" fill="#1D4ED8" opacity="0.4" />
      <circle cx="78" cy="28" r="2" fill="#1D4ED8" opacity="0.6" />
      <circle cx="86" cy="28" r="2" fill="#1D4ED8" opacity="0.9" />
    </svg>
  )
}

export function Problem() {
  const t = useTranslations('problem')
  const paragraphs = t('body').split('\n\n')
  const { isMobile } = useBreakpoint()

  return (
    <section style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '48px', maxWidth: '576px' }}>
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '64px', alignItems: 'center' }}>
          <ScrollReveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {p}
                </p>
              ))}
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {t('caption')}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <IllustrationWaiting />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
