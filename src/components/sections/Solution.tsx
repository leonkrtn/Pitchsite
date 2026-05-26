'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const escrowNodes = [
  {
    label: 'Kunde zahlt',
    green: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '20px', height: '20px' }}>
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M2 10h20" stroke="#1D4ED8" strokeWidth="1.5" />
        <rect x="5" y="13" width="7" height="2.5" rx="1" fill="#1D4ED8" opacity="0.5" />
      </svg>
    ),
  },
  {
    label: 'Pitchsite sichert',
    green: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '20px', height: '20px' }}>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="#1D4ED8" />
      </svg>
    ),
  },
  {
    label: 'Du lieferst',
    green: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '20px', height: '20px' }}>
        <rect x="3" y="7" width="13" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M16 10l5-3v10l-5-3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Auszahlung',
    green: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '20px', height: '20px' }}>
        <circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="1.5" />
        <path d="M8 12l3 3 5-6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function EscrowFlow() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: '260px', flexShrink: 0 }}>
      {escrowNodes.map((node, i) => (
        <Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: node.green ? '#ECFDF5' : '#EFF6FF',
              border: `1px solid ${node.green ? '#A7F3D0' : '#DBEAFE'}`,
            }}>
              {node.icon}
            </div>
            <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', lineHeight: 1.3, maxWidth: '58px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {node.label}
            </span>
          </div>
          {i < escrowNodes.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '20px', flex: 1, padding: '20px 4px 0' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{ height: '1px', background: '#DBEAFE', width: '100%' }} />
                <div style={{
                  position: 'absolute', right: 0, top: '50%', transform: 'translate(-1px, -50%)',
                  width: 0, height: 0,
                  borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
                  borderLeft: '6px solid #BFDBFE',
                }} />
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

const icons = [
  <svg key="a" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', flexShrink: 0 }} aria-hidden="true">
    <path d="M8 14a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H18l-6 6v-6H12a4 4 0 0 1-4-4V14Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="18" cy="22" r="2" fill="#1D4ED8" />
    <circle cx="24" cy="22" r="2" fill="#1D4ED8" />
    <circle cx="30" cy="22" r="2" fill="#1D4ED8" />
  </svg>,
  <svg key="b" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', flexShrink: 0 }} aria-hidden="true">
    <rect x="10" y="6" width="28" height="36" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M16 16h16M16 22h12M16 28h8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 35c2-2 3-1 4 0s2 2 4 0" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="c" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', flexShrink: 0 }} aria-hidden="true">
    <path d="M24 6l14 5v12c0 9-14 19-14 19S10 32 10 23V11L24 6Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="18" y="22" width="12" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M20 22v-3a4 4 0 0 1 8 0v3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="d" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', flexShrink: 0 }} aria-hidden="true">
    <rect x="8" y="12" width="32" height="28" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M8 20h32" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M17 8v8M31 8v8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 31a5 5 0 1 0 5-5" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M26 26v-3l-3 1.5" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
]

export function Solution() {
  const t = useTranslations('solution')
  const items = t.raw('items') as Array<{ title: string; body: string }>

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '64px', maxWidth: '672px' }}>
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {items.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div style={{ border: '1px solid #F1F5F9', borderRadius: '16px', padding: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
                  {icons[i]}
                  <h3 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(16px, 2vw, 20px)', color: '#0F172A', lineHeight: 1.375 }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ color: '#64748B', lineHeight: 1.625, fontSize: '16px', paddingLeft: '52px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {item.body}
                </p>
                {i === 2 && (
                  <div style={{ paddingLeft: '52px', marginTop: '20px' }}>
                    <EscrowFlow />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
