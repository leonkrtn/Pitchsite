'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Eye, Copy, Send, Archive, AlertCircle, Check, KeyRound, MessageSquare, PackageCheck, Layers, RotateCcw } from 'lucide-react'
import { Button, Badge, Card, Divider } from '@/components/app/ds'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { createBrowserClient } from '@/lib/supabase'
import { ChatWidget } from '@/components/app/ChatWidget'
import { WorkflowStepper, WorkflowStageChip } from '@/components/app/WorkflowStepper'
import { currentStage, stageCopy } from '@/lib/workflow'
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
      { title: 'Projekt erstellt', sub: (date: string) => `Erstellt am: ${date}` },
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
    archiveConfirm: 'Projekt wirklich archivieren? Es wird aus der Übersicht entfernt.',
    unarchive: 'Archivierung aufheben',
    unarchiveConfirm: 'Archivierung aufheben? Das Projekt erscheint wieder in der Übersicht.',
    createdAt: (d: string) => `Erstellt am ${d}`,
    noComments: 'Noch keine Kommentare',
    noCommentsSub: 'Wenn dein Kunde das Design betrachtet, erscheinen Pins hier.',
    loading: 'Laden…',
    notFound: 'Projekt nicht gefunden',
    linkCopied: 'Link kopiert!',
    pitchPwTitle: 'Pitch-Passwort',
    pitchPwLabel: 'Passwort',
    pitchPwPh: 'z. B. Sommer2024',
    pitchPwSave: 'Speichern',
    pitchPwReset: 'Passwort zurücksetzen',
    pitchPwResetConfirm: 'Kunde wird aufgefordert, ein neues Passwort zu setzen. Fortfahren?',
    pitchPwSaved: 'Passwort gespeichert',
    pitchPwResetDone: 'Zurückgesetzt — Kunde muss neues Passwort setzen',
    pitchPwNone: 'Kein Passwort gesetzt',
    pitchPwChanged: 'Kunde hat eigenes Passwort gesetzt',
    pitchPwNotChanged: 'Erstzugang noch aktiv',
    chat: 'Nachrichten',
    chatSub: 'Direkter Chat mit deinem Kunden',
    workflowCard: 'Projekt-Workflow',
    deliveryCard: 'Lieferung & Arbeitsbereich',
    openWorkspace: 'Arbeitsbereich öffnen',
    workspaceHint: 'Annotieren, Aufgaben, Versionen & finale Abgabe',
    deliveredOn: 'Geliefert am',
    deliveryNoteLabel: 'Übergabe-Notiz',
    revisionRounds: 'Änderungsrunden',
    notDeliveredYet: 'Noch nicht abgeliefert',
  },
  en: {
    breadcrumb: 'Dashboard',
    breadcrumbs: 'Projects',
    paymentStatus: 'Payment status',
    paymentSub: 'Funds secured until final approval.',
    timeline: [
      { title: 'Project created', sub: (date: string) => `Created on: ${date}` },
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
    archiveConfirm: 'Archive this project? It will be removed from the overview.',
    unarchive: 'Unarchive project',
    unarchiveConfirm: 'Unarchive this project? It will reappear in the overview.',
    createdAt: (d: string) => `Created on ${d}`,
    noComments: 'No comments yet',
    noCommentsSub: 'When your client views the design, pins will appear here.',
    loading: 'Loading…',
    notFound: 'Project not found',
    linkCopied: 'Link copied!',
    pitchPwTitle: 'Pitch password',
    pitchPwLabel: 'Password',
    pitchPwPh: 'e.g. Summer2024',
    pitchPwSave: 'Save',
    pitchPwReset: 'Reset password',
    pitchPwResetConfirm: 'Client will be asked to set a new password. Continue?',
    pitchPwSaved: 'Password saved',
    pitchPwResetDone: 'Reset — client must set a new password',
    pitchPwNone: 'No password set',
    pitchPwChanged: 'Client has set their own password',
    pitchPwNotChanged: 'Initial access still active',
    chat: 'Messages',
    chatSub: 'Direct chat with your client',
    workflowCard: 'Project workflow',
    deliveryCard: 'Delivery & workspace',
    openWorkspace: 'Open workspace',
    workspaceHint: 'Annotate, tasks, versions & final delivery',
    deliveredOn: 'Delivered on',
    deliveryNoteLabel: 'Hand-off note',
    revisionRounds: 'Change rounds',
    notDeliveredYet: 'Not delivered yet',
  },
}

type StepStatus = 'done' | 'active' | 'open'

function getTimelineStatuses(status: string): StepStatus[] {
  if (status === 'offen')         return ['done', 'active', 'open',   'open',   'open',   'open']
  if (status === 'ausstehend')    return ['done', 'done',   'active', 'open',   'open',   'open']
  if (status === 'escrow')        return ['done', 'done',   'done',   'active', 'open',   'open']
  if (status === 'abgeliefert')   return ['done', 'done',   'done',   'done',   'active', 'open']
  if (status === 'abgeschlossen') return ['done', 'done',   'done',   'done',   'done',   'done']
  return ['done', 'open', 'open', 'open', 'open', 'open']
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
  const [pitchPwInput, setPitchPwInput] = useState('')
  const [pitchPwSaving, setPitchPwSaving] = useState(false)
  const [designerName, setDesignerName] = useState('')
  const [designerId, setDesignerId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }
      setDesignerId(user.id)
      const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
      if (profile?.name) setDesignerName(profile.name)

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

  const savePitchPassword = async () => {
    if (!project || !pitchPwInput.trim()) return
    setPitchPwSaving(true)
    await (supabase as any).from('projects').update({ pitch_password: pitchPwInput.trim(), pitch_password_changed: false }).eq('id', project.id)
    setProject(prev => prev ? { ...prev, pitch_password: pitchPwInput.trim(), pitch_password_changed: false } as any : prev)
    setPitchPwSaving(false)
    setPitchPwInput('')
    showToast(t.pitchPwSaved)
  }

  const resetPitchPassword = async () => {
    if (!project) return
    if (!window.confirm(t.pitchPwResetConfirm)) return
    await (supabase as any).from('projects').update({ pitch_password_changed: false }).eq('id', project.id)
    setProject(prev => prev ? { ...prev, pitch_password_changed: false } as any : prev)
    showToast(t.pitchPwResetDone)
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
    subText: i === 0 ? item.sub(formatDate(project.created_at))
      : i === 1 ? item.sub(formatAmount(project.amount))
      : i === 3 ? item.sub(formatDate(project.delivery_date))
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
              <WorkflowStageChip status={project.status as any} locale={locale} />
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

        {/* Dynamic workflow overview */}
        <Card style={{ padding: isMobile ? '20px' : '24px 28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>{t.workflowCard}</div>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px', maxWidth: '440px', lineHeight: 1.5 }}>
                {stageCopy(currentStage(project.status as any), locale).designerNow}
              </div>
            </div>
            {project.file_url && (
              <Button variant="primary" icon={<Layers size={16} />} onClick={() => router.push(`/${locale}/app/viewer/${project.code}`)}>
                {t.openWorkspace}
              </Button>
            )}
          </div>
          <WorkflowStepper status={project.status as any} locale={locale} />
        </Card>

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

            {/* Messages */}
            <Card style={{ padding: '0', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="#1D4ED8" />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                    {t.chat}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '1px' }}>
                    {t.chatSub}
                  </div>
                </div>
              </div>
              {project && (
                <ChatWidget
                  projectId={project.id}
                  senderName={designerName || 'Designer'}
                  isDesigner={true}
                  senderId={designerId}
                  mode="inline"
                  locale={locale}
                />
              )}
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
            {/* Delivery & workspace */}
            <Card style={{ padding: '24px 28px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <PackageCheck size={16} color="#1D4ED8" />
                <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>{t.deliveryCard}</span>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginBottom: '16px' }}>{t.workspaceHint}</div>

              {(project as any).delivered_at ? (
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Check size={14} /> {t.deliveredOn} {formatDate((project as any).delivered_at)}
                </div>
              ) : (
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginBottom: '10px' }}>{t.notDeliveredYet}</div>
              )}

              {(project as any).delivery_note && (
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#475569', background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', lineHeight: 1.5 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{t.deliveryNoteLabel}</div>
                  {(project as any).delivery_note}
                </div>
              )}

              {((project as any).revision_round ?? 0) > 0 && (
                <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <RotateCcw size={13} /> {t.revisionRounds}: {(project as any).revision_round}
                </div>
              )}

              {project.file_url && (
                <Button variant="primary" fullWidth icon={<Layers size={16} />} onClick={() => router.push(`/${locale}/app/viewer/${project.code}`)}>
                  {t.openWorkspace}
                </Button>
              )}
            </Card>

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
                {(project as any).archived ? (
                  <Button
                    variant="secondary"
                    icon={<Archive size={16} />}
                    fullWidth
                    onClick={async () => {
                      if (!window.confirm(t.unarchiveConfirm)) return
                      await (supabase as any).from('projects').update({ archived: false }).eq('id', project.id)
                      router.push(`/${locale}/app/dashboard`)
                    }}
                  >
                    {t.unarchive}
                  </Button>
                ) : (
                  <Button
                    variant="ghost-danger"
                    icon={<Archive size={16} />}
                    fullWidth
                    onClick={async () => {
                      if (!window.confirm(t.archiveConfirm)) return
                      await (supabase as any).from('projects').update({ archived: true }).eq('id', project.id)
                      router.push(`/${locale}/app/dashboard`)
                    }}
                  >
                    {t.archive}
                  </Button>
                )}
              </div>
            </Card>

            {/* Pitch password card */}
            <Card style={{ padding: '24px 28px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <KeyRound size={15} color="#64748B" />
                <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                  {t.pitchPwTitle}
                </span>
              </div>
              {/* Status line */}
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>
                {!(project as any).pitch_password ? (
                  <span style={{ color: '#94A3B8' }}>{t.pitchPwNone}</span>
                ) : (project as any).pitch_password_changed ? (
                  <span style={{ color: '#16A34A' }}>✓ {t.pitchPwChanged}</span>
                ) : (
                  <span style={{ color: '#D97706' }}>⚠ {t.pitchPwNotChanged}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  value={pitchPwInput}
                  onChange={e => setPitchPwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && savePitchPassword()}
                  placeholder={t.pitchPwPh}
                  type="text"
                  style={{
                    flex: 1, height: '38px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
                    padding: '0 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A',
                    outline: 'none', background: '#fff',
                  }}
                />
                <Button variant="primary" size="sm" loading={pitchPwSaving} disabled={!pitchPwInput.trim()} onClick={savePitchPassword} style={{ height: '38px', flexShrink: 0 }}>
                  {t.pitchPwSave}
                </Button>
              </div>
              {(project as any).pitch_password && (
                <Button variant="ghost" size="sm" fullWidth onClick={resetPitchPassword} style={{ fontSize: '12px', color: '#64748B' }}>
                  {t.pitchPwReset}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
