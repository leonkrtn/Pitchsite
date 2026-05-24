import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
