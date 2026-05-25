import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const stepIcons = [
  // 01 Upload
  <svg key="s1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-5" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <path d="M20 27V16M16 20l4-4 4 4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10" y="27" width="20" height="5" rx="2" stroke="#1D4ED8" strokeWidth="1.5" />
    <circle cx="29" cy="29.5" r="1.5" fill="#1D4ED8" opacity="0.5" />
  </svg>,
  // 02 View & comment
  <svg key="s2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-5" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <rect x="8" y="13" width="18" height="14" rx="2.5" stroke="#1D4ED8" strokeWidth="1.5" />
    <rect x="8" y="13" width="18" height="5" rx="2.5" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M22 18a8 8 0 0 1 8-8v0a8 8 0 0 1 0 16h-1l-2.5 3.5V26H22a8 8 0 0 1 0-8Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="25" y="13" width="7" height="2.5" rx="1" fill="#1D4ED8" opacity="0.4" />
    <rect x="25" y="17" width="5" height="2.5" rx="1" fill="#1D4ED8" opacity="0.4" />
  </svg>,
  // 03 Sign & pay
  <svg key="s3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-5" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <rect x="9" y="8" width="17" height="22" rx="2.5" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M13 17h9M13 21h7" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M23 24l8-8 3 3-8 8H23v-3Z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  // 04 Deliver & paid
  <svg key="s4" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-5" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#EFF6FF" />
    <circle cx="20" cy="20" r="12" stroke="#1D4ED8" strokeWidth="1.5" />
    <path d="M14 20l4 4 8-8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
]

export function HowItWorks() {
  const t = useTranslations('howitworks')
  const steps = t.raw('steps') as Array<{ number: string; title: string; body: string }>

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8 bg-surface">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            {t('label')}
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-16 max-w-xl">
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="bg-white rounded-2xl p-8 h-full border border-gray-100">
                {stepIcons[i]}
                <span className="font-mono text-xs font-bold text-blue-royal/50 block mb-4 tabular-nums">
                  {step.number}
                </span>
                <h3 className="font-display font-bold text-lg text-ink mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{step.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
