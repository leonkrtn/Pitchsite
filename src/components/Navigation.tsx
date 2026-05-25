'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { SparkleText } from '@/components/ui/SparkleText'

export function Navigation() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 transition-all duration-150 ease-out ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
        <span className="font-display font-bold text-base tracking-tight">
          <span className="text-ink">Pitch</span><SparkleText>site</SparkleText>
        </span>

        <div className="flex items-center gap-6">
          <LanguageToggle />
          <a
            href="#warteliste"
            className="text-sm font-semibold bg-blue-royal text-white px-4 py-2 rounded-lg transition-all duration-150 ease-out active:scale-[0.97] hover:bg-blue-800"
            style={{ transition: 'transform 160ms ease-out, background-color 150ms ease-out' }}
          >
            {t('waitlist')}
          </a>
        </div>
      </div>
    </header>
  )
}
