'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, ShieldCheck, FileText, CreditCard, ChevronRight, ChevronDown, Monitor } from 'lucide-react'
import { Button, Card, Divider, Input } from '@/components/app/ds'
import { ProgressHeader } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

// ⚠️ DEMO ONLY — Payment is not processed via real Stripe
// Real payment integration is out of scope for the current MVP

const T = {
  de: {
    title: 'Zahlung',
    sub: 'Deine Zahlung wird sicher via Stripe verarbeitet.',
    cardTitle: 'Kreditkarte',
    stripeNote: 'Gesichert durch Stripe',
    cardHolder: 'Karteninhaber',
    cardHolderPh: 'Thomas Weber',
    cardNum: 'Kartennummer',
    cardNumPh: '1234 5678 9012 3456',
    expiry: 'Ablaufdatum',
    expiryPh: 'MM / JJ',
    cvc: 'CVC',
    cvcPh: '123',
    encNote: 'Deine Kartendaten sind 256-Bit-verschlüsselt und werden nicht gespeichert.',
    sepa: 'SEPA-Lastschrift (DE, AT, CH)',
    iban: 'IBAN',
    ibanPh: 'DE89 3704 0044 0532 0130 00',
    ibanHolder: 'Kontoinhaber',
    ibanHolderPh: 'Thomas Weber',
    payBtn: (amount: string) => `Jetzt ${amount} zahlen`,
    legalNote: 'Durch Klicken stimmst du den AGB von Pitchsite zu. Keine versteckten Gebühren.',
    orderTitle: 'Bestellübersicht',
    lineItems: (fee: number, pitchFee: number) => [
      { label: 'Honorar', value: `€ ${fee.toLocaleString('de-DE')},–` },
      { label: 'Pitchsite-Gebühr (5%)', value: `€ ${pitchFee.toFixed(2).replace('.', ',')}` },
    ],
    total: 'Gesamt',
    vatNote: 'inkl. 19% MwSt.',
    escrowTitle: 'Escrow-geschützt',
    escrowSub: 'Dein Geld liegt sicher bis zur finalen Abnahme.',
    contractNote: 'Vertrag unterzeichnet',
    webdesign: 'Webdesign',
    demoBanner: '⚠️ DEMO — Zahlung wird nicht wirklich verarbeitet',
    skipBtn: 'Demo überspringen →',
  },
  en: {
    title: 'Payment',
    sub: 'Your payment is securely processed via Stripe.',
    cardTitle: 'Credit card',
    stripeNote: 'Secured by Stripe',
    cardHolder: 'Cardholder name',
    cardHolderPh: 'Thomas Weber',
    cardNum: 'Card number',
    cardNumPh: '1234 5678 9012 3456',
    expiry: 'Expiry date',
    expiryPh: 'MM / YY',
    cvc: 'CVC',
    cvcPh: '123',
    encNote: 'Your card details are 256-bit encrypted and not stored.',
    sepa: 'SEPA Direct Debit (DE, AT, CH)',
    iban: 'IBAN',
    ibanPh: 'DE89 3704 0044 0532 0130 00',
    ibanHolder: 'Account holder',
    ibanHolderPh: 'Thomas Weber',
    payBtn: (amount: string) => `Pay ${amount} now`,
    legalNote: 'By clicking you agree to Pitchsite\'s terms. No hidden fees.',
    orderTitle: 'Order summary',
    lineItems: (fee: number, pitchFee: number) => [
      { label: 'Fee', value: `€ ${fee.toLocaleString('de-DE')},–` },
      { label: 'Pitchsite fee (5%)', value: `€ ${pitchFee.toFixed(2).replace('.', ',')}` },
    ],
    total: 'Total',
    vatNote: 'incl. 19% VAT',
    escrowTitle: 'Escrow-protected',
    escrowSub: 'Your funds are secured until final approval.',
    contractNote: 'Contract signed',
    webdesign: 'Web design',
    demoBanner: '⚠️ DEMO — Payment is not actually processed',
    skipBtn: 'Skip demo →',
  },
}

export default function CheckoutPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [project, setProject] = useState<Project | null>(null)
  const [card, setCard] = useState({ holder: '', number: '', expiry: '', cvc: '' })
  const [sepaOpen, setSepaOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('*').eq('code', code).single().then(({ data }) => {
      if (data) setProject(data)
    })
  }, [code])

  const formatCardNum = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExpiry = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
  }

  const handlePay = () => {
    setLoading(true)
    // DEMO: simulate payment, update project status
    setTimeout(async () => {
      if (project) {
        await (supabase as any).from('projects').update({ status: 'escrow' }).eq('id', project.id)
      }
      setLoading(false)
      router.push(`/${locale}/app/success?code=${code}`)
    }, 2000)
  }

  const fee = project?.amount ?? 0
  const pitchFee = fee * 0.05
  const total = fee + pitchFee
  const totalStr = `€ ${total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`.replace('.', ',')

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <ProgressHeader step={3} locale={locale} />

      {/* Demo banner */}
      <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 24px', textAlign: 'center', position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 40 }}>
        <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#92400E', fontWeight: 600 }}>{t.demoBanner}</span>
        <button
          onClick={handlePay}
          style={{ marginLeft: '16px', fontSize: '13px', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {t.skipBtn}
        </button>
      </div>

      <div style={{ paddingTop: '120px', padding: '120px 24px 40px', maxWidth: '900px', margin: '0 auto', animation: 'fadeInUp 200ms ease-out' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: '32px', alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>{t.title}</h1>
            <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '28px' }}>{t.sub}</p>

            <Card style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ background: '#635BFF', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>stripe</div>
                <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.stripeNote}</span>
                <Lock size={12} color="#16A34A" />
              </div>
              <Divider style={{ marginBottom: '24px' }} />

              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {t.cardTitle}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <CardBrand name="VISA" color="#1A1F71" />
                  <CardBrand name="MC" />
                  <CardBrand name="AMEX" color="#016FD0" />
                </div>
              </div>

              <Input label={t.cardHolder} placeholder={t.cardHolderPh} value={card.holder} onChange={e => setCard(c => ({ ...c, holder: e.target.value }))} />
              <Input
                label={t.cardNum} placeholder={t.cardNumPh}
                value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCardNum(e.target.value) }))}
                suffix={<CreditCard size={18} color="#94A3B8" />}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label={t.expiry} placeholder={t.expiryPh}
                  value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                />
                <Input
                  label={t.cvc} placeholder={t.cvcPh}
                  value={card.cvc} onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Lock size={12} color="#94A3B8" />
                <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.encNote}</span>
              </div>

              <Divider style={{ margin: '24px 0' }} />

              <div onClick={() => setSepaOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                {sepaOpen ? <ChevronDown size={14} color="#64748B" /> : <ChevronRight size={14} color="#64748B" />}
                <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.sepa}</span>
              </div>
              {sepaOpen && (
                <div style={{ marginTop: '16px', animation: 'fadeInUp 150ms ease-out' }}>
                  <Input label={t.iban} placeholder={t.ibanPh} />
                  <Input label={t.ibanHolder} placeholder={t.ibanHolderPh} />
                </div>
              )}
            </Card>

            <Button
              variant="primary" fullWidth loading={loading}
              onClick={handlePay}
              style={{ height: '56px', fontSize: '17px', marginTop: '24px' }}
            >
              {!loading && total ? t.payBtn(totalStr) : undefined}
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
              <Shield size={12} color="#94A3B8" />
              <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', textAlign: 'center' }}>{t.legalNote}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ position: 'sticky', top: '120px' }}>
            <Card style={{ padding: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>{t.orderTitle}</div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '36px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={18} color="#93C5FD" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{project?.name ?? '—'}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{project?.client_name ?? '—'} · {t.webdesign}</div>
                </div>
              </div>

              <Divider />

              <div style={{ margin: '16px 0' }}>
                {fee > 0 && t.lineItems(fee, pitchFee).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{row.label}</span>
                    <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>{t.total}</span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                  {total > 0 ? `€ ${total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '—'}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', textAlign: 'right', marginBottom: '16px' }}>{t.vatNote}</div>

              <Divider style={{ marginBottom: '16px' }} />

              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <ShieldCheck size={18} color="#16A34A" style={{ marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#166534' }}>{t.escrowTitle}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#16A34A', marginTop: '2px' }}>{t.escrowSub}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#94A3B8" />
                <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.contractNote}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardBrand({ name, color = '#64748B' }: { name: string; color?: string }) {
  return (
    <div style={{ width: '32px', height: '20px', borderRadius: '3px', border: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {name === 'MC' ? (
        <div style={{ display: 'flex', position: 'relative', width: '20px', height: '14px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EB001B', position: 'absolute', left: 0, top: '1px' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F79E1B', opacity: 0.9, position: 'absolute', left: '6px', top: '1px' }} />
        </div>
      ) : (
        <span style={{ fontSize: '8px', fontWeight: 800, color, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>{name}</span>
      )}
    </div>
  )
}
