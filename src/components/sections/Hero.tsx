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

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[420px]"
      aria-hidden="true"
    >
      {/* Subtle background dots */}
      {[0,1,2,3,4,5].map(row =>
        [0,1,2,3,4,5,6,7].map(col => (
          <circle key={`${row}-${col}`} cx={col * 56 + 8} cy={row * 48 + 12} r="1.5" fill="#E2E8F0" />
        ))
      )}

      {/* ── Left browser: Designer ── */}
      <rect x="1" y="44" width="178" height="138" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="1" y="44" width="178" height="24" rx="8" fill="#F8FAFC" />
      <rect x="1" y="56" width="178" height="12" fill="#F8FAFC" />
      <rect x="1" y="44" width="178" height="24" rx="0" stroke="#E2E8F0" strokeWidth="0" />
      <path d="M1 56h178" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="14" cy="56" r="3.5" fill="#FDA4AF" />
      <circle cx="24" cy="56" r="3.5" fill="#FDE68A" />
      <circle cx="34" cy="56" r="3.5" fill="#86EFAC" />
      {/* Wireframe */}
      <rect x="13" y="80" width="154" height="13" rx="2.5" fill="#DBEAFE" />
      <rect x="13" y="101" width="58" height="52" rx="2.5" fill="#F1F5F9" />
      <rect x="79" y="101" width="88" height="9" rx="2" fill="#F1F5F9" />
      <rect x="79" y="116" width="68" height="8" rx="2" fill="#F1F5F9" />
      <rect x="79" y="130" width="48" height="8" rx="2" fill="#F1F5F9" />
      <rect x="13" y="161" width="110" height="8" rx="2" fill="#F1F5F9" />
      <rect x="13" y="175" width="78" height="8" rx="2" fill="#F1F5F9" />

      {/* ── Center: dashed arrow + code badge ── */}
      <line x1="183" y1="113" x2="237" y2="113" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M233 108l6 5-6 5" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="191" y="96" width="52" height="18" rx="5" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
      <rect x="197" y="102" width="7" height="6" rx="1.5" fill="#93C5FD" />
      <rect x="207" y="102" width="7" height="6" rx="1.5" fill="#93C5FD" />
      <rect x="217" y="102" width="7" height="6" rx="1.5" fill="#93C5FD" />
      <rect x="227" y="102" width="7" height="6" rx="1.5" fill="#93C5FD" />

      {/* ── Right browser: Client ── */}
      <rect x="241" y="18" width="178" height="180" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="241" y="18" width="178" height="24" rx="8" fill="#F8FAFC" />
      <rect x="241" y="30" width="178" height="12" fill="#F8FAFC" />
      <path d="M241 30h178" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="254" cy="30" r="3.5" fill="#FDA4AF" />
      <circle cx="264" cy="30" r="3.5" fill="#FDE68A" />
      <circle cx="274" cy="30" r="3.5" fill="#86EFAC" />
      {/* Same wireframe */}
      <rect x="253" y="54" width="154" height="13" rx="2.5" fill="#DBEAFE" />
      <rect x="253" y="75" width="58" height="52" rx="2.5" fill="#F1F5F9" />
      <rect x="319" y="75" width="88" height="9" rx="2" fill="#F1F5F9" />
      <rect x="319" y="90" width="68" height="8" rx="2" fill="#F1F5F9" />
      <rect x="319" y="104" width="48" height="8" rx="2" fill="#F1F5F9" />
      <rect x="253" y="135" width="110" height="8" rx="2" fill="#F1F5F9" />
      <rect x="253" y="149" width="78" height="8" rx="2" fill="#F1F5F9" />

      {/* Comment pin 1 — resolved (blue checkmark) */}
      <circle cx="330" cy="61" r="9" fill="#1D4ED8" />
      <path d="M326.5 61l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Comment bubble 1 */}
      <rect x="272" y="34" width="72" height="20" rx="5" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="278" y="40" width="36" height="3.5" rx="1.5" fill="#CBD5E1" />
      <rect x="278" y="46" width="24" height="3.5" rx="1.5" fill="#CBD5E1" />
      <path d="M340 54l-3-3h-4l4 3" fill="white" stroke="#E2E8F0" strokeWidth="1" />

      {/* Comment pin 2 — open (blue dot) */}
      <circle cx="263" cy="101" r="9" fill="#1D4ED8" opacity="0.75" />
      <circle cx="263" cy="101" r="3" fill="white" />
      {/* Comment bubble 2 */}
      <rect x="253" y="164" width="64" height="20" rx="5" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="259" y="170" width="30" height="3.5" rx="1.5" fill="#CBD5E1" />
      <rect x="259" y="176" width="20" height="3.5" rx="1.5" fill="#CBD5E1" />
      <path d="M271 164l-3 4h4" fill="white" stroke="#E2E8F0" strokeWidth="1" />

      {/* "Auftrag annehmen" CTA bar */}
      <rect x="241" y="202" width="178" height="32" rx="0" fill="#1D4ED8" />
      <rect x="241" y="218" width="178" height="16" rx="0" fill="#1D4ED8" />
      <path d="M241 202h178v16H241z" fill="#1D4ED8" />
      <rect x="241" y="202" width="178" height="32" rx="8" fill="#1D4ED8" />
      <rect x="241" y="202" width="178" height="16" rx="0" fill="#1D4ED8" />
      <rect x="265" y="214" width="88" height="6" rx="2" fill="white" opacity="0.35" />
      <circle cx="390" cy="218" r="7" fill="white" opacity="0.15" />
      <path d="M387.5 218l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Trust badge */}
      <rect x="281" y="248" width="138" height="30" rx="8" fill="white" stroke="#BBF7D0" strokeWidth="1.5" />
      <circle cx="298" cy="263" r="8" fill="#D1FAE5" />
      <path d="M295 263l2 2 4-4" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="312" y="257" width="60" height="4.5" rx="2" fill="#D1FAE5" />
      <rect x="312" y="265" width="42" height="4.5" rx="2" fill="#D1FAE5" />
    </svg>
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
