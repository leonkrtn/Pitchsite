'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileSignature, Eraser, Type, Check } from 'lucide-react'
import { Button, Card, Divider } from '@/components/app/ds'
import { ProgressHeader } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

const T = {
  de: {
    title: 'Projektvertrag prüfen',
    sub: 'Lies den Vertrag sorgfältig durch bevor du unterschreibst.',
    scrollHint: '↓ Weiterlesen',
    sigTitle: 'Digitale Unterschrift',
    sigSub: 'Unterschreibe mit deiner Maus oder deinem Finger.',
    sigPh: 'Hier unterschreiben',
    clearBtn: 'Löschen',
    textSigBtn: 'Mit Text unterschreiben',
    drawBtn: 'Zeichnen',
    textSigPh: 'Deinen Namen eingeben...',
    agreeText: 'Ich habe den Vertrag vollständig gelesen und stimme den Bedingungen zu. Ich bin mir bewusst, dass dies ein rechtlich bindender Vertrag ist, der in Deutschland, Österreich und der Schweiz vollstreckbar ist.',
    total: 'Gesamtbetrag:',
    pitchFee: '5% Pitchsite',
    submit: 'Unterschreiben & zur Zahlung',
    needSign: 'Bitte zuerst unterschreiben',
    needCheck: 'Bitte Checkbox bestätigen',
    loading: 'Speichere…',
  },
  en: {
    title: 'Review project contract',
    sub: 'Read the contract carefully before signing.',
    scrollHint: '↓ Read more',
    sigTitle: 'Digital signature',
    sigSub: 'Sign with your mouse or finger.',
    sigPh: 'Sign here',
    clearBtn: 'Clear',
    textSigBtn: 'Type your signature',
    drawBtn: 'Draw',
    textSigPh: 'Enter your name...',
    agreeText: 'I have read the contract in full and agree to the terms. I understand that this is a legally binding contract, enforceable in Germany, Austria and Switzerland.',
    total: 'Total amount:',
    pitchFee: '5% Pitchsite',
    submit: 'Sign & proceed to payment',
    needSign: 'Please sign first',
    needCheck: 'Please confirm the checkbox',
    loading: 'Saving…',
  },
}

function buildContractText(project: Project, locale: string): string {
  const designerName = 'Designer'
  const clientName = project.client_name ?? 'Auftraggeber'
  const date = new Date(project.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  const amount = project.amount ? `EUR ${project.amount.toLocaleString('de-DE')},–` : '—'
  const delivery = project.delivery_date ? new Date(project.delivery_date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  if (locale === 'en') {
    return `PROJECT CONTRACT

Between ${designerName} (Contractor) and ${clientName} (Client)

Created on ${date} via Pitchsite

§1 Scope of Work

The Contractor will create the deliverables described in the pitch presentation. All designs shown in the pitch serve as the binding basis for implementation.

§2 Remuneration

The agreed fee is ${amount} plus applicable VAT. Payment is processed before project start via Pitchsite Escrow Service. The fee is released to the Contractor only after successful acceptance by the Client.

§3 Delivery Date

Delivery no later than ${delivery}. The Contractor will inform the Client promptly if delays are foreseeable.

§4 Acceptance

The Client has 14 calendar days after delivery to review and accept. If no justified defects are reported within this period, the work is deemed accepted and payment is released.

§5 Defect Notification

Defects must be described specifically and comprehensibly. Stylistic change requests beyond the agreed scope are not considered defects and may be commissioned separately.

§6 Copyright

Upon full payment, all usage rights transfer to the Client. The Contractor retains the right to show the project in their portfolio.

§7 Governing Law

German law applies. Jurisdiction is Munich. This contract is enforceable in Germany, Austria and Switzerland.`
  }

  return `PROJEKTVERTRAG

Zwischen ${designerName} (Auftragnehmerin) und ${clientName} (Auftraggeber)

Erstellt am ${date} via Pitchsite

§1 Leistungsgegenstand

Die Auftragnehmerin erstellt im Rahmen dieses Vertrages die im Pitch präsentierten Leistungen. Sämtliche im Pitch gezeigten Designs gelten als verbindliche Grundlage für die Umsetzung.

§2 Vergütung

Das vereinbarte Honorar beträgt ${amount} netto zzgl. der gesetzlichen Umsatzsteuer. Die Zahlung erfolgt vor Projektbeginn via Pitchsite Escrow-Service. Das Honorar wird erst nach erfolgreicher Abnahme durch den Auftraggeber an die Auftragnehmerin ausgezahlt.

§3 Liefertermin

Die Lieferung erfolgt bis spätestens ${delivery}. Die Auftragnehmerin wird den Auftraggeber rechtzeitig informieren, sofern Verzögerungen absehbar sind.

§4 Abnahme

Der Auftraggeber hat nach Lieferung 14 Kalendertage Zeit zur Prüfung und Abnahme. Werden innerhalb dieser Frist keine begründeten Mängel gemeldet, gilt das Werk als abgenommen und die Zahlung wird freigegeben.

§5 Mängelrüge

Mängel sind konkret und nachvollziehbar zu benennen. Stilistische Änderungswünsche, die über den vereinbarten Leistungsumfang hinausgehen, gelten nicht als Mängel.

§6 Urheberrecht

Mit vollständiger Zahlung gehen alle Nutzungsrechte am erstellten Design auf den Auftraggeber über. Die Auftragnehmerin behält das Recht, das Projekt in ihrem Portfolio zu zeigen.

§7 Anwendbares Recht

Es gilt deutsches Recht. Gerichtsstand ist München. Dieser Vertrag ist in Deutschland, Österreich und der Schweiz vollstreckbar.`
}

export default function ContractPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [project, setProject] = useState<Project | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [signed, setSigned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contractRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.from('projects').select('*').eq('code', code).single().then(({ data }) => {
      if (data) setProject(data)
    })
  }, [code])

  const handleScroll = () => {
    const el = contractRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolledToBottom(true)
  }

  const handleSubmit = async () => {
    if (!agreed || !signed || !project) return
    setLoading(true)

    // Save signature PNG to Supabase Storage
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      const blob = await (await fetch(dataUrl)).blob()
      const path = `${project.id}/${Date.now()}.png`
      await supabase.storage.from('signatures').upload(path, blob, { contentType: 'image/png' })

      const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(path)
      const clientName = project.client_name ?? 'Client'
      await (supabase as any).from('project_signatures').insert({ project_id: project.id, signature_url: publicUrl, client_name: clientName })
    }

    setLoading(false)
    router.push(`/${locale}/app/checkout/${code}`)
  }

  const contractText = project ? buildContractText(project, locale) : ''
  const fee = project?.amount ? project.amount * 1.05 : null

  const canSubmit = agreed && signed

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <ProgressHeader step={2} locale={locale} />
      <div style={{ paddingTop: '104px', padding: '104px 24px 40px', maxWidth: '780px', margin: '0 auto', animation: 'fadeInUp 200ms ease-out' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '32px' }}>
          {t.sub}
        </p>

        {/* Contract Card */}
        <Card style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div
            ref={contractRef}
            onScroll={handleScroll}
            style={{ padding: '40px', maxHeight: '500px', overflowY: 'scroll' }}
          >
            {contractText.split('\n\n').map((para, i) => {
              const isHeading = para.startsWith('§') || para === 'PROJEKTVERTRAG' || para === 'PROJECT CONTRACT'
              return (
                <div key={i} style={{ marginBottom: '20px' }}>
                  {isHeading ? (
                    <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>{para}</h3>
                  ) : para.startsWith('Zwischen') || para.startsWith('Erstellt') || para.startsWith('Between') || para.startsWith('Created') ? (
                    <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', lineHeight: 1.6 }}>{para}</p>
                  ) : (
                    <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.7 }}>{para}</p>
                  )}
                </div>
              )
            })}
          </div>
          {!scrolledToBottom && (
            <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(transparent, #fff)', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.scrollHint}</span>
            </div>
          )}
        </Card>

        {/* Signature */}
        <Card style={{ padding: '32px 40px', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '6px' }}>{t.sigTitle}</div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '20px' }}>{t.sigSub}</div>
          <SignatureCanvas
            canvasRef={canvasRef}
            placeholder={t.sigPh}
            clearLabel={t.clearBtn}
            textSigLabel={t.textSigBtn}
            drawLabel={t.drawBtn}
            textSigPh={t.textSigPh}
            onSign={() => setSigned(true)}
            onClear={() => setSigned(false)}
          />
        </Card>

        {/* Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '28px' }}>
          <div
            onClick={() => setAgreed(v => !v)}
            style={{
              width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
              border: `2px solid ${agreed ? '#1D4ED8' : '#CBD5E1'}`,
              background: agreed ? '#1D4ED8' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms',
            }}
          >
            {agreed && <Check size={12} color="#fff" strokeWidth={2.5} />}
          </div>
          <label onClick={() => setAgreed(v => !v)} style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
            {t.agreeText}
          </label>
        </div>

        {/* Summary */}
        {fee && (
          <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.total}</span>
            <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
              € {fee.toLocaleString('de-DE', { minimumFractionDigits: 2 })} (inkl. {t.pitchFee})
            </span>
          </div>
        )}

        <Button
          variant="primary" fullWidth loading={loading} disabled={!canSubmit}
          onClick={handleSubmit}
          style={{ height: '52px', fontSize: '16px' }}
          icon={<FileSignature size={18} />}
        >
          {t.submit}
        </Button>
        {!canSubmit && (
          <p style={{ textAlign: 'center', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '12px' }}>
            {!signed ? t.needSign : t.needCheck}
          </p>
        )}
      </div>
    </div>
  )
}

// ── SIGNATURE CANVAS ──────────────────────────────────────

const SignatureCanvas = ({
  canvasRef,
  placeholder, clearLabel, textSigLabel, drawLabel, textSigPh,
  onSign, onClear,
}: {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  placeholder: string; clearLabel: string; textSigLabel: string
  drawLabel: string; textSigPh: string
  onSign?: () => void; onClear?: () => void
}) => {
  const internalRef = useRef<HTMLCanvasElement>(null)
  const resolvedRef = canvasRef ?? internalRef
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(false)
  const [textMode, setTextMode] = useState(false)
  const [textSig, setTextSig] = useState('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = resolvedRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    const ctx = canvas.getContext('2d')!
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const src = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true)
    lastPos.current = getPos(e, resolvedRef.current!)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !resolvedRef.current) return
    e.preventDefault()
    const ctx = resolvedRef.current.getContext('2d')!
    const pos = getPos(e, resolvedRef.current)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    if (!signed) { setSigned(true); onSign?.() }
  }

  const clearCanvas = () => {
    if (!resolvedRef.current) return
    const ctx = resolvedRef.current.getContext('2d')!
    ctx.clearRect(0, 0, resolvedRef.current.width, resolvedRef.current.height)
    setSigned(false)
    onClear?.()
  }

  if (textMode) {
    return (
      <div>
        <input
          autoFocus value={textSig}
          onChange={e => { setTextSig(e.target.value); if (e.target.value) onSign?.(); else onClear?.() }}
          placeholder={textSigPh}
          style={{
            width: '100%', height: '56px', border: 'none', borderBottom: '2px solid #0F172A',
            background: 'transparent', fontSize: '28px',
            fontFamily: '"Dancing Script", cursive', color: '#0F172A',
            outline: 'none', padding: '0 4px',
          }}
        />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
          <Button variant="ghost" size="sm" icon={<Eraser size={14} />} onClick={() => { setTextMode(false); setTextSig(''); onClear?.() }}>{clearLabel}</Button>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>oder</span>
          <Button variant="ghost" size="sm" icon={<Type size={14} />} onClick={() => setTextMode(false)}>{drawLabel}</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {!signed && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '16px', fontFamily: 'Inter, sans-serif', color: '#CBD5E1', fontStyle: 'italic' }}>{placeholder}</span>
          </div>
        )}
        <canvas
          ref={resolvedRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)}
          style={{ width: '100%', height: '140px', display: 'block', background: '#F8FAFC', border: `2px ${signed ? 'solid #1D4ED8' : 'dashed #CBD5E1'}`, borderRadius: '8px', cursor: 'crosshair', transition: 'border 200ms' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
        <Button variant="ghost" size="sm" icon={<Eraser size={14} />} onClick={clearCanvas}>{clearLabel}</Button>
        <span style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>oder</span>
        <Button variant="ghost" size="sm" icon={<Type size={14} />} onClick={() => setTextMode(true)}>{textSigLabel}</Button>
      </div>
    </div>
  )
}
