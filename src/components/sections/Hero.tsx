'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CountdownTimer } from '@/components/ui/CountdownTimer'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

export function Hero() {
  const t = useTranslations('hero')
  const lines = t('headline').split('\n')

  return (
    <section className="min-h-screen flex flex-col justify-center pt-14 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto w-full py-24 sm:py-32">
        <FadeUp delay={0.05}>
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-royal bg-blue-light px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              DE · AT · CH
            </span>
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-ink leading-[1.05] tracking-tight mb-6">
            {lines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="text-lg sm:text-xl text-muted leading-relaxed max-w-xl mb-12">
            {t('subline')}
          </p>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
              {t('launch')}
            </p>
            <CountdownTimer />
          </div>
        </FadeUp>

        <FadeUp delay={0.35}>
          <a
            href="#warteliste"
            className="inline-block bg-blue-royal text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-150 ease-out active:scale-[0.97] hover:bg-blue-800"
            style={{ transition: 'transform 160ms ease-out, background-color 150ms ease-out' }}
          >
            {t('cta')}
          </a>
        </FadeUp>
      </div>
    </section>
  )
}
