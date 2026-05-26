'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Link } from '@/i18n/navigation'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface Plan {
  name: string
  price: string | null
  period: string | null
  description: string
  badge?: string
  features: string[]
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', flexShrink: 0 }} aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#1D4ED8" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="#1D4ED8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', flexShrink: 0 }} aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#CBD5E1" strokeWidth="1.2" />
      <path d="M5.5 8h5" stroke="#CBD5E1" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PlanCard({ plan, highlighted }: { plan: Plan; highlighted?: boolean }) {
  return (
    <div style={{
      position: 'relative', borderRadius: '16px', padding: '32px',
      display: 'flex', flexDirection: 'column', gap: '24px',
      background: highlighted ? '#1D4ED8' : '#fff',
      border: highlighted ? '2px solid #1D4ED8' : '1px solid #E5E7EB',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
          <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '20px', color: highlighted ? '#fff' : '#0F172A' }}>
            {plan.name}
          </p>
          {plan.badge && (
            <span style={{
              fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px',
              background: highlighted ? 'rgba(255,255,255,0.2)' : '#EFF6FF',
              color: highlighted ? '#fff' : '#1D4ED8',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {plan.badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: '14px', color: highlighted ? 'rgba(255,255,255,0.7)' : '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {plan.description}
        </p>
      </div>

      <div>
        {plan.price ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '36px', color: highlighted ? '#fff' : '#0F172A' }}>
              {plan.price}
            </span>
            {plan.period && (
              <span style={{ fontSize: '14px', color: highlighted ? 'rgba(255,255,255,0.6)' : '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {plan.period}
              </span>
            )}
          </div>
        ) : (
          <div style={{ height: '52px', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: highlighted ? 'rgba(255,255,255,0.6)' : '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
            —
          </div>
        )}
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {plan.features.map((feature, i) => {
          const isDash = feature.startsWith('—')
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {isDash ? <DashIcon /> : <CheckIcon />}
              <span style={{
                fontSize: '14px', lineHeight: 1.375, fontFamily: 'Inter, system-ui, sans-serif',
                color: isDash
                  ? (highlighted ? 'rgba(255,255,255,0.4)' : 'rgba(100,116,139,0.5)')
                  : (highlighted ? 'rgba(255,255,255,0.9)' : '#64748B'),
              }}>
                {isDash ? feature.slice(2) : feature}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Pricing() {
  const t = useTranslations('pricing')
  const locale = useLocale()
  const plans = t.raw('plans') as Plan[]
  const { isMobile, isTablet } = useBreakpoint()
  const [linkHov, setLinkHov] = useState(false)

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '12px', maxWidth: '576px' }}>
            {t('headline')}
          </h2>
          <p style={{ color: '#64748B', marginBottom: '48px', maxWidth: '576px', lineHeight: 1.625, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('subline')}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {plans.map((plan, i) => (
              <PlanCard key={plan.name} plan={plan} highlighted={i === 1} />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>{t('provisionNote')}</p>
              <p style={{ fontSize: '12px', color: 'rgba(100,116,139,0.7)', marginTop: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>{t('stripeNote')}</p>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{t('earlybird')}</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link
              href="/transparenz"
              locale={locale as 'de' | 'en'}
              onMouseEnter={() => setLinkHov(true)}
              onMouseLeave={() => setLinkHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '14px', fontWeight: 500, color: '#1D4ED8',
                textDecoration: linkHov ? 'underline' : 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {t('transparency')}
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '16px', height: '16px' }} aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
