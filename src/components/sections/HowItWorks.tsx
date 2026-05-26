'use client'

import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const stepIcons = [
  <svg key="s1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', marginBottom: '20px' }} aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <path d="M20 27V16M16 20l4-4 4 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10" y="27" width="20" height="5" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
    <circle cx="29" cy="29.5" r="1.5" fill="#1D4ED8" opacity="0.5" />
  </svg>,
  <svg key="s2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', marginBottom: '20px' }} aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <rect x="8" y="13" width="18" height="14" rx="2.5" stroke="#1D4ED8" strokeWidth="1.5" />
    <rect x="8" y="13" width="18" height="5" rx="2.5" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M22 18a8 8 0 0 1 8-8v0a8 8 0 0 1 0 16h-1l-2.5 3.5V26H22a8 8 0 0 1 0-8Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="25" y="13" width="7" height="2.5" rx="1" fill="#1D4ED8" opacity="0.4" />
    <rect x="25" y="17" width="5" height="2.5" rx="1" fill="#1D4ED8" opacity="0.4" />
  </svg>,
  <svg key="s3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', marginBottom: '20px' }} aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <rect x="9" y="8" width="17" height="22" rx="2.5" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M13 17h9M13 21h7" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M23 24l8-8 3 3-8 8H23v-3Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  <svg key="s4" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', marginBottom: '20px' }} aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <circle cx="20" cy="20" r="12" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M14 20l4 4 8-8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
]

export function HowItWorks() {
  const t = useTranslations('howitworks')
  const steps = t.raw('steps') as Array<{ number: string; title: string; body: string }>
  const { isMobile } = useBreakpoint()

  return (
    <section style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '64px', maxWidth: '576px' }}>
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', height: '100%', border: '1px solid #F1F5F9' }}>
                {stepIcons[i]}
                <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: '12px', fontWeight: 700, color: 'rgba(29,78,216,0.5)', display: 'block', marginBottom: '16px', fontVariantNumeric: 'tabular-nums' }}>
                  {step.number}
                </span>
                <h3 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F172A', marginBottom: '12px', lineHeight: 1.375 }}>
                  {step.title}
                </h3>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {step.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
