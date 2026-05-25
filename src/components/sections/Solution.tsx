import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const escrowNodes = [
  {
    label: 'Kunde zahlt',
    green: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
        <rect x="3" y="7" width="13" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M16 10l5-3v10l-5-3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Auszahlung',
    green: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="1.5" />
        <path d="M8 12l3 3 5-6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function EscrowFlow() {
  return (
    <div className="flex items-start max-w-[260px] shrink-0">
      {escrowNodes.map((node, i) => (
        <Fragment key={i}>
          <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 auto' }}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              node.green
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-blue-50 border border-blue-100'
            }`}>
              {node.icon}
            </div>
            <span className="text-[11px] text-muted text-center leading-tight max-w-[58px]">
              {node.label}
            </span>
          </div>
          {i < escrowNodes.length - 1 && (
            <div className="flex items-start pt-5 flex-1 px-1">
              <div className="relative w-full">
                <div className="h-px bg-blue-100 w-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-px w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-200" />
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

const icons = [
  <svg key="a" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 shrink-0" aria-hidden="true">
    <path d="M8 14a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H18l-6 6v-6H12a4 4 0 0 1-4-4V14Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="18" cy="22" r="2" fill="#1D4ED8" />
    <circle cx="24" cy="22" r="2" fill="#1D4ED8" />
    <circle cx="30" cy="22" r="2" fill="#1D4ED8" />
  </svg>,
  <svg key="b" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 shrink-0" aria-hidden="true">
    <rect x="10" y="6" width="28" height="36" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M16 16h16M16 22h12M16 28h8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 35c2-2 3-1 4 0s2 2 4 0" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="c" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 shrink-0" aria-hidden="true">
    <path d="M24 6l14 5v12c0 9-14 19-14 19S10 32 10 23V11L24 6Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="18" y="22" width="12" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M20 22v-3a4 4 0 0 1 8 0v3" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="d" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 shrink-0" aria-hidden="true">
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
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-16 max-w-2xl">
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div className="space-y-10">
          {items.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="border border-gray-100 rounded-2xl p-8 sm:p-10">
                <div className="flex items-start gap-5 mb-4">
                  {icons[i]}
                  <h3 className="font-display font-bold text-lg sm:text-xl text-ink leading-snug">
                    {item.title}
                  </h3>
                </div>
                <p className="text-muted leading-relaxed text-base pl-[52px]">
                  {item.body}
                </p>
                {i === 2 && (
                  <div className="pl-[52px] mt-5">
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
