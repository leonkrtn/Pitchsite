import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Link } from '@/i18n/navigation'

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
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#1D4ED8" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="#1D4ED8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#CBD5E1" strokeWidth="1.2" />
      <path d="M5.5 8h5" stroke="#CBD5E1" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PlanCard({ plan, highlighted }: { plan: Plan; highlighted?: boolean }) {
  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
        highlighted
          ? 'bg-blue-royal text-white ring-2 ring-blue-royal'
          : 'bg-white border border-gray-200'
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-1">
          <p className={`font-display font-bold text-xl ${highlighted ? 'text-white' : 'text-ink'}`}>
            {plan.name}
          </p>
          {plan.badge && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                highlighted ? 'bg-white/20 text-white' : 'bg-blue-light text-blue-royal'
              }`}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <p className={`text-sm ${highlighted ? 'text-white/70' : 'text-muted'}`}>
          {plan.description}
        </p>
      </div>

      <div>
        {plan.price ? (
          <div className="flex items-baseline gap-1">
            <span className={`font-display font-bold text-4xl ${highlighted ? 'text-white' : 'text-ink'}`}>
              {plan.price}
            </span>
            {plan.period && (
              <span className={`text-sm ${highlighted ? 'text-white/60' : 'text-muted'}`}>
                {plan.period}
              </span>
            )}
          </div>
        ) : (
          <div className={`h-[52px] flex items-center text-sm font-medium ${highlighted ? 'text-white/60' : 'text-muted'}`}>
            —
          </div>
        )}
      </div>

      <ul className="space-y-3 flex-1">
        {plan.features.map((feature, i) => {
          const isDash = feature.startsWith('—')
          return (
            <li key={i} className="flex items-start gap-2.5">
              {isDash ? <DashIcon /> : <CheckIcon />}
              <span
                className={`text-sm leading-snug ${
                  isDash
                    ? highlighted ? 'text-white/40' : 'text-muted/50'
                    : highlighted ? 'text-white/90' : 'text-muted'
                }`}
              >
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

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-3 max-w-xl">
            {t('headline')}
          </h2>
          <p className="text-muted mb-12 max-w-xl leading-relaxed">{t('subline')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {plans.map((plan, i) => (
              <PlanCard key={plan.name} plan={plan} highlighted={i === 1} />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-muted">{t('provisionNote')}</p>
              <p className="text-xs text-muted/70 mt-1">{t('stripeNote')}</p>
            </div>
            <p className="text-sm font-semibold text-ink shrink-0">{t('earlybird')}</p>
          </div>

          <div className="mt-6">
            <Link
              href="/transparenz"
              locale={locale as 'de' | 'en'}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-royal hover:underline"
            >
              {t('transparency')}
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
