'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function FAQ() {
  const t = useTranslations('faq')
  const items = t.raw('items') as Array<{ q: string; a: string }>
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        <ScrollReveal>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {t('label')}
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '48px' }}>
            {t('headline')}
          </h2>
        </ScrollReveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.04}>
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                <button
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '16px', padding: '20px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px', lineHeight: 1.375, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    style={{ flexShrink: 0, color: '#64748B' }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" style={{ width: '16px', height: '16px' }}>
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: EASE_OUT }}
                    >
                      <p style={{ padding: '12px 24px 20px', fontSize: '14px', color: '#64748B', lineHeight: 1.625, borderTop: '1px solid #F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
