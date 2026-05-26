'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Eye, Copy, Send, Archive, AlertCircle, Check } from 'lucide-react'
import { Button, Badge, Card, Divider } from '@/components/app/ds'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { useBreakpoint } from '@/hooks/useBreakpoint'

type Project = Database['public']['Tables']['projects']['Row']
type Pin = Database['public']['Tables']['project_pins']['Row']

const T = {
  de: {
    breadcrumb: 'Dashboard',
    breadcrumbs: 'Projekte',
    paymentStatus: 'Zahlungsstatus',
    paymentSub: 'Geld liegt sicher bis zur finalen Abnahme.',
    timeline: [
      { title: 'Zahlung eingegangen', sub: (amount: string) => `${amount} + 5% Pitchsite-Gebühr` },
      { title: 'Betrag in Escrow gesichert', sub: () => 'Sicher verwahrt bei Stripe / Pitchsite' },
      { title: 'Designer liefert', sub: (date: string) => `Fällig bis: ${date}` },
      { title: 'Abnahme durch Auftraggeber', sub: () => null },
      { title: 'Auszahlung an Designer', sub: () => null },
    ],
    autoApprove: 'Kein Feedback innerhalb von 14 Tagen nach Lieferung = automatische Abnahme (vertraglich festgelegt).',
    feedback: 'Kundenfeedback',
    showInDesign: 'Im Design anzeigen',
    projectInfo: 'Projektinfos',
    infoLabels: {
      amount: 'Honorar', delivery: 'Lieferdatum', client: 'Auftraggeber',
      email: 'E-Mail', code: 'Projektcode', created: 'Erstellt am', status: 'Status',
    },
    actions: 'Aktionen',
    viewDesign: 'Design anzeigen',
    copyLink: 'Pitch-Link kopieren',
    remind: 'Erinnerung senden',
    archive: 'Projekt archivieren',
    createdAt: (d: string) => `Erstellt am ${d}`,
    noComments: 'Noch keine Kommentare',
    noCommentsSub: 'Wenn dein Kunde das Design betrachtet, erscheinen Pins hier.',
    loading: 'Laden…',
    notFound: 'Projekt nicht gefunden',
    linkCopied: 'Link kopiert!',
  },
  en: {
    breadcrumb: 'Dashboard',
    breadcrumbs: 'Projects',
    paymentStatus: 'Payment status',
    paymentSub: 'Funds secured until final approval.',
    timeline: [
      { title: 'Payment received', sub: (amount: string) => `${amount} + 5% Pitchsite fee` },
      { title: 'Amount secured in escrow', sub: () => 'Safely held by Stripe / Pitchsite' },
      { title: 'Designer delivers', sub: (date: string) => `Due by: ${date}` },
      { title: 'Client approval', sub: () => null },
      { title: 'Payout to designer', sub: () => null },
    ],
    autoApprove: 'No feedback within 14 days of delivery = automatic approval (contractually agreed).',
    feedback: 'Client feedback',
    showInDesign: 'Show in design',
    projectInfo: 'Project info',
    infoLabels: {
      amount: 'Fee', delivery: 'Delivery date', client: 'Client',
      email: 'Email', code: 'Project code', created: 'Created on', status: 'Status',
    },
    actions: 'Actions',
    viewDesign: 'View design',
    copyLink: 'Copy pitch link',
    remind: 'Send reminder',
    archive: 'Archive project',
    createdAt: (d: string) => `Created on ${d}`,
    noComments: 'No comments yet',
    noCommentsSub: 'When your client views the design, pins will appear here.',
    loading: 'Loading…',
    notFound: 'Project not found',
    linkCopied: 'Link copied!',
  },
}

type StepStatus = 'done' | 'active' | 'open'

function getTimelineStatuses(status: string): StepStatus[] {
  if (status === 'offen')         return ['open', 'open', 'active', 'open', 'open']
  if (status === 'ausstehend')    return ['done', 'done', 'active', 'open', 'open']
  if (status === 'escrow')        return ['done', 'done', 'active', 'open', 'open']
  if (status === 'abgeschlossen') return ['done', 'done', 'done', 'done', 'done']
  return ['open', 'open', 'open', 'open', 'open']
}

function TimelineDot({ status }: { status: StepStatus }) {
  if (status === 'done') return (
    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#16A34A', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Check size={12} color="#fff" strokeWidth={2.5} />
    </div>
  )
  if (status === 'active') return (
    <div style={{ width: '24px', height: '24px', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(29,78,216,.3)', animation: 'ping 1.5s cubic-bezier(0,0,.2,1) infinite' }} />
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1D4ED8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
      </div>
    </div>
  )
  return (
    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '2px solid #E2E8F0', flexShrink: 0 }} />
  )
}

export default function ProjectPage({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()
  const { isMobile } = useBreakpoint()

  const [project, setProject] = useState<Project | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }

      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('designer_id', user.id)
        .single()

      if (!proj) { setLoading(false); return }
      setProject(proj)

      const { data: pinData } = await supabase
        .from('project_pins')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })

      setPins(pinData ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const copyPitchLink = () => {
    if (!project) return
    navigator.clipboard.writeText(`${window.location.origin}/${locale}/app/pitch/${project.code}`)
    showToast(t.linkCopied)
  }

  if (loading) {
    return (
      <DashboardLayout locale={locale}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
          {t.loading}
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout locale={locale}>
        <div style={{ textAlign: 'center', padding: '64px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
          {t.notFound}
        </div>
      </DashboardLayout>
    )
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatAmount = (a: number | null) => a ? `€ ${a.toLocaleString('de-DE')},–` : '—'

  const timelineStatuses = getTimelineStatuses(project.status)

  const timelineItems = t.timeline.map((item, i) => ({
    ...item,
    status: timelineStatuses[i],
    subText: i === 0 ? item.sub(formatAmount(project.amount))
      : i === 2 ? item.sub(formatDate(project.delivery_date))
      : item.sub(''),
  }))

  return (
    <DashboardLayout locale={locale} activeSection="projects">
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', padding: '12px 20px',
          borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.2)', animation: 'fadeInUp 200ms ease-out',
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '24px' }}>
          <span onClick={() => router.push(`/${locale}/app/dashboard`)} style={{ color: '#1D4ED8', cursor: 'pointer' }}>{t.breadcrumb}</span>
          <span> / {t.breadcrumbs} / {project.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '6px' }}>
              {project.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Badge status={project.status as any} locale={locale} />
              <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
                {t.createdAt(formatDate(project.created_at))}
              </span>
              <span style={{ fontSize: '13px', fontFamily: '"Geist Mono", monospace', color: '#64748B' }}>
                Code: {project.code}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="ghost" icon={<Share2 size={14} />} size="sm" onClick={copyPitchLink}>{t.copyLink}</Button>
            {project.file_url && (
              <Button variant="primary" icon={<Eye size={14} />} size="sm" onClick={() => router.push(`/${locale}/app/viewer/${project.code}`)}>
                {t.viewDesign}
              </Button>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* LEFT */}
          <div>
            {/* Escrow Timeline */}
            <Card style={{ padding: '24px 28px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                  {t.paymentStatus}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>
                  {t.paymentSub}
                </div>
              </div>

              <div>
                {timelineItems.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <TimelineDot status={step.status} />
                      {i < timelineItems.length - 1 && (
                        <div style={{
                          position: 'absolute', left: '11px', top: '26px',
                          width: '2px', height: 'calc(100% + 4px)',
                          background: step.status === 'done' && timelineItems[i + 1].status === 'done' ? '#16A34A'
                            : step.status === 'done' ? 'linear-gradient(#16A34A, #E2E8F0)' : '#E2E8F0',
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < timelineItems.length - 1 ? '28px' : '0', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: step.status === 'open' ? '#94A3B8' : '#0F172A' }}>
                        {step.title}
                      </div>
                      {step.subText && (
                        <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '2px' }}>{step.subText}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', marginTop: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#D97706" style={{ marginTop: '1px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#92400E', lineHeight: 1.5 }}>
                  {t.autoApprove}
                </span>
              </div>
            </Card>

            {/* Comments */}
            <Card style={{ padding: '24px 28px', marginBottom: isMobile ? '24px' : '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                  {t.feedback} ({pins.length})
                </div>
                {project.file_url && (
                  <span
                    onClick={() => router.push(`/${locale}/app/viewer/${project.code}`)}
                    style={{ fontSize: '14px', color: '#1D4ED8', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
                  >
                    {t.showInDesign}
                  </span>
                )}
              </div>

              {pins.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                  <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: '4px', color: '#64748B' }}>{t.noComments}</div>
                  <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{t.noCommentsSub}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pins.map((pin, i) => (
                    <div key={pin.id} style={{ display: 'flex', gap: '12px', padding: '14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1D4ED8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff' }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
                        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '4px' }}>
                          {pin.author} · {new Date(pin.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT */}
          <div>
            <Card style={{ padding: '24px 28px', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>
                {t.projectInfo}
              </div>
              {[
                { label: t.infoLabels.amount, value: formatAmount(project.amount) },
                { label: t.infoLabels.delivery, value: formatDate(project.delivery_date) },
                { label: t.infoLabels.client, value: project.client_name || '—' },
                { label: t.infoLabels.email, value: project.client_email || '—' },
                { label: t.infoLabels.code, value: project.code, mono: true },
                { label: t.infoLabels.created, value: formatDate(project.created_at) },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: (row as any).mono ? '"Geist Mono", monospace' : 'Inter, sans-serif', color: '#0F172A' }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: '24px 28px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '16px' }}>
                {t.actions}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {project.file_url && (
                  <Button variant="primary" icon={<Eye size={16} />} fullWidth onClick={() => router.push(`/${locale}/app/viewer/${project.code}`)}>
                    {t.viewDesign}
                  </Button>
                )}
                <Button variant="secondary" icon={<Copy size={16} />} fullWidth onClick={copyPitchLink}>
                  {t.copyLink}
                </Button>
                <Button variant="secondary" icon={<Send size={16} />} fullWidth>
                  {t.remind}
                </Button>
                <Button variant="ghost-danger" icon={<Archive size={16} />} fullWidth>
                  {t.archive}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
