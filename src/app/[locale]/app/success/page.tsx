'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Lock, Mail, Check } from 'lucide-react'
import { Button } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

const T = {
  de: {
    headline: 'Zahlung erfolgreich!',
    sub: 'Dein Honorar liegt sicher im Escrow.',
    escrowLabel: (amount: string) => `${amount} sicher in Escrow`,
    escrowSub: 'Wird nach deiner Abnahme freigegeben.',
    cells: ['PROJEKT', 'DESIGNER', 'LIEFERDATUM', 'ABNAHMEFRIST'],
    approvalDeadline: '14 Tage nach Lieferung',
    emailBtn: 'Bestätigung per E-Mail senden',
    emailSent: 'Bestätigung gesendet!',
    homeBtn: 'Zur Pitchsite-Homepage',
    support: 'Bei Fragen: support@pitchsite.de',
    loading: 'Lädt…',
  },
  en: {
    headline: 'Payment successful!',
    sub: 'Your fee is safely held in escrow.',
    escrowLabel: (amount: string) => `${amount} secured in escrow`,
    escrowSub: 'Released after your approval.',
    cells: ['PROJECT', 'DESIGNER', 'DELIVERY DATE', 'APPROVAL DEADLINE'],
    approvalDeadline: '14 days after delivery',
    emailBtn: 'Send confirmation by email',
    emailSent: 'Confirmation sent!',
    homeBtn: 'Go to Pitchsite homepage',
    support: 'Questions? support@pitchsite.de',
    loading: 'Loading…',
  },
}

// ── CONFETTI ──────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#1D4ED8', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }))

    let frame: number
    let elapsed = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      elapsed++
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotV
        p.vy += 0.05
        if (elapsed > 120) p.opacity = Math.max(0, p.opacity - 0.012)
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (particles.some(p => p.opacity > 0)) frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }} />
}

export default function SuccessPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const [project, setProject] = useState<Project | null>(null)
  const [iconVisible, setIconVisible] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.from('projects').select('*').eq('code', code).single().then(({ data }) => {
        if (data) setProject(data)
      })
    }
    const timer = setTimeout(() => setIconVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleEmail = () => {
    // DEMO — email sending would be real via Resend in production
    setEmailLoading(true)
    setTimeout(() => { setEmailLoading(false); setEmailSent(true) }, 1500)
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const fee = project?.amount ?? 0
  const total = fee * 1.05
  const totalStr = total > 0 ? `€ ${total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Confetti />
      <div style={{ height: '64px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 32px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppLogo />
      </div>

      <div style={{ paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ padding: '40px 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '20px',
            padding: '56px 64px', maxWidth: '560px', width: '100%',
            textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,.08)',
            animation: 'fadeInUp 300ms ease-out',
          }}>
            {/* Success icon */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#F0FDF4', border: '2px solid #86EFAC',
              margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: iconVisible ? 'scale(1)' : 'scale(0)',
              transition: 'transform 500ms cubic-bezier(.34,1.56,.64,1)',
            }}>
              <CheckCircle2 size={40} color="#16A34A" />
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '12px' }}>
              {t.headline}
            </h1>
            <p style={{ fontSize: '17px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '32px' }}>
              {t.sub}
            </p>

            {/* Escrow status box */}
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '12px', padding: '20px 24px', marginBottom: '32px',
              display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left',
            }}>
              <Lock size={28} color="#1D4ED8" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#1E40AF' }}>
                  {t.escrowLabel(totalStr)}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#3B82F6', marginTop: '4px' }}>
                  {t.escrowSub}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: t.cells[0], value: project?.name ?? '—' },
                { label: t.cells[1], value: project?.client_name ?? '—' },
                { label: t.cells[2], value: formatDate(project?.delivery_date ?? null) },
                { label: t.cells[3], value: t.approvalDeadline },
              ].map(cell => (
                <div key={cell.label} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 16px', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {cell.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <Button
              variant="primary" fullWidth loading={emailLoading}
              onClick={handleEmail}
              style={{ height: '48px', marginBottom: '12px' }}
              icon={emailSent ? <Check size={16} /> : <Mail size={16} />}
            >
              {emailSent ? t.emailSent : t.emailBtn}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => router.push(`/${locale}`)} style={{ height: '44px' }}>
              {t.homeBtn}
            </Button>

            <p style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '24px' }}>
              {t.support}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
