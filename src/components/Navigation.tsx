'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { SparkleText } from '@/components/ui/SparkleText'

export function Navigation() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [btnHov, setBtnHov] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '0 24px',
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(4px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(4px)' : 'none',
      borderBottom: scrolled ? '1px solid #F1F5F9' : 'none',
      transition: 'background 150ms ease-out, border-color 150ms ease-out',
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>
          <span style={{ color: '#0F172A' }}>Pitch</span><SparkleText>site</SparkleText>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <LanguageToggle />
          <a
            href="#warteliste"
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{
              fontSize: '14px', fontWeight: 600,
              background: btnHov ? '#1E40AF' : '#1D4ED8',
              color: '#fff', padding: '8px 16px',
              borderRadius: '8px', textDecoration: 'none',
              transition: 'transform 160ms ease-out, background-color 150ms ease-out',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {t('waitlist')}
          </a>
        </div>
      </div>
    </header>
  )
}
