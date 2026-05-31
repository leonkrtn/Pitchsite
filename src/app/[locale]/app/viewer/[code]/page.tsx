'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, ZoomIn, ZoomOut, Check, Plus, Trash2,
  PanelRightClose, PanelRightOpen, ListChecks, History, MessageSquare,
  StickyNote, GitCompare, PackageCheck, RotateCcw, Clock,
} from 'lucide-react'
import { Button } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { fetchAndRenderDesign } from '@/lib/renderDesign'
import { ChatWidget } from '@/components/app/ChatWidget'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { WorkflowStepperVertical, WorkflowStageChip } from '@/components/app/WorkflowStepper'
import { nextActionFor } from '@/lib/workflow'
import {
  AnnotationToolbar, AnnotationCanvas, AnnotationList, PALETTE,
  Annotation, NewAnnotation, Tool, AnnotationVisibility,
} from '@/components/app/annotations'
const PALETTE_IMPORT = PALETTE
import { ElementInspector, ElementAnnotationOverlay } from '@/components/app/inspector'
import type { Database } from '@/types/database'

type ViewerMode = 'canvas' | 'inspector'

type Project = Database['public']['Tables']['projects']['Row']
type Pin = Database['public']['Tables']['project_pins']['Row']
type Task = Database['public']['Tables']['project_tasks']['Row']
type Version = Database['public']['Tables']['project_versions']['Row']
type Revision = Database['public']['Tables']['project_revisions']['Row']

type PanelTab = 'status' | 'notes' | 'tasks' | 'feedback' | 'versions'

const T = {
  de: {
    back: 'Projekt',
    workspace: 'Arbeitsbereich',
    noFile: 'Noch keine Datei hochgeladen.',
    uploadVersion: 'Neue Version',
    uploading: 'Lädt…',
    panelTabs: { status: 'Status', notes: 'Notizen', tasks: 'Aufgaben', feedback: 'Feedback', versions: 'Versionen' },
    notFound: 'Projekt nicht gefunden oder kein Zugriff.',
    workflowTitle: 'Workflow',
    deliverCta: 'Finale Abgabe',
    deliverRedo: 'Erneut abliefern',
    deliveredState: 'Geliefert – Abnahme läuft',
    deliveredSub: 'Dein Kunde prüft die Abgabe. Du wirst benachrichtigt, sobald er abnimmt.',
    completedState: 'Projekt abgeschlossen',
    completedSub: 'Der Kunde hat abgenommen. Der Betrag wird ausgezahlt.',
    openRevisions: 'Offene Änderungswünsche',
    tasksProgress: 'Aufgaben',
    notesFilterAll: 'Alle', notesFilterPrivate: 'Privat', notesFilterShared: 'Geteilt',
    notesEmpty: 'Wähle ein Werkzeug oben und markiere direkt im Design — Kommentar-Pin, Highlight-Box, Freihand oder Beschreibung. Pro Notiz entscheidest du, ob sie privat bleibt oder mit dem Kunden geteilt wird.',
    sharedHint: 'Geteilte Notizen erscheinen im Pitch deines Kunden.',
    modeCanvas: 'Ansicht', modeInspector: 'Inspektor',
    inspectorHint: 'HTML-Elemente im Inspektor anklicken und beschreiben',
    inspectorOnly: 'Inspektor nur für HTML/ZIP',
    tasksTitle: 'Aufgaben & Meilensteine',
    taskPh: 'Aufgabe hinzufügen…',
    tasksEmpty: 'Lege Aufgaben an, um deinen Fortschritt zu strukturieren.',
    feedbackTitle: 'Kundenfeedback',
    feedbackEmpty: 'Wenn dein Kunde im Pitch Stellen kommentiert, erscheinen sie hier.',
    resolve: 'Erledigt', resolved: 'Erledigt ✓',
    revisionsTitle: 'Änderungsrunden',
    revisionRound: (n: number) => `Runde ${n}`,
    markRevisionDone: 'Als erledigt markieren',
    versionsTitle: 'Versionsverlauf',
    versionsEmpty: 'Jede hochgeladene Version wird hier festgehalten.',
    current: 'Aktuell',
    deliverModalTitle: 'Finale Abgabe',
    deliverModalSub: 'Übergib das Projekt an deinen Kunden. Er kann die Abgabe danach annehmen oder Änderungen anfordern.',
    deliverNoteLabel: 'Übergabe-Notiz an den Kunden',
    deliverNotePh: 'z. B. „Finale Version inkl. aller besprochenen Änderungen. Quelldateien im ZIP enthalten."',
    deliverIncludes: 'Enthalten in der Abgabe',
    deliverConfirm: 'Jetzt abliefern',
    cancel: 'Abbrechen',
    delivered: 'Abgeliefert ✓',
    versionUploaded: 'Version hochgeladen',
    uploadError: 'Upload fehlgeschlagen.',
    showFeedback: 'Kundenfeedback',
    of: 'von',
  },
  en: {
    back: 'Project',
    workspace: 'Workspace',
    noFile: 'No file uploaded yet.',
    uploadVersion: 'New version',
    uploading: 'Loading…',
    panelTabs: { status: 'Status', notes: 'Notes', tasks: 'Tasks', feedback: 'Feedback', versions: 'Versions' },
    notFound: 'Project not found or no access.',
    workflowTitle: 'Workflow',
    deliverCta: 'Deliver',
    deliverRedo: 'Re-deliver',
    deliveredState: 'Delivered – approval pending',
    deliveredSub: 'Your client is reviewing the delivery. You will be notified once they approve.',
    completedState: 'Project completed',
    completedSub: 'The client approved. The amount is being paid out.',
    openRevisions: 'Open change requests',
    tasksProgress: 'Tasks',
    notesFilterAll: 'All', notesFilterPrivate: 'Private', notesFilterShared: 'Shared',
    notesEmpty: "Pick a tool above and mark directly on the design -- comment pin, highlight box, freehand or description. Per note you decide whether it stays private or is shared with the client.",
    sharedHint: "Shared notes appear in your client’s pitch.",
    modeCanvas: "Canvas", modeInspector: "Inspector",
    inspectorHint: "Click HTML elements to inspect and annotate",
    inspectorOnly: "Inspector for HTML/ZIP only",
    tasksTitle: 'Tasks & milestones',
    taskPh: 'Add a task…',
    tasksEmpty: 'Create tasks to structure your progress.',
    feedbackTitle: 'Client feedback',
    feedbackEmpty: 'When your client comments in the pitch, it shows up here.',
    resolve: 'Resolve', resolved: 'Resolved ✓',
    revisionsTitle: 'Change rounds',
    revisionRound: (n: number) => `Round ${n}`,
    markRevisionDone: 'Mark as resolved',
    versionsTitle: 'Version history',
    versionsEmpty: 'Every uploaded version is recorded here.',
    current: 'Current',
    deliverModalTitle: 'Final delivery',
    deliverModalSub: 'Hand the project over to your client. They can then approve it or request changes.',
    deliverNoteLabel: 'Hand-off note to the client',
    deliverNotePh: 'e.g. “Final version incl. all discussed changes. Source files included in the ZIP.”',
    deliverIncludes: 'Included in the delivery',
    deliverConfirm: 'Deliver now',
    cancel: 'Cancel',
    delivered: 'Delivered ✓',
    versionUploaded: 'Version uploaded',
    uploadError: 'Upload failed.',
    showFeedback: 'Client feedback',
    of: 'of',
  },
}

export default function DesignerViewerPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const isDE = locale !== 'en'
  const router = useRouter()
  const supabase = createBrowserClient()
  const { isMobile } = useBreakpoint()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [designerName, setDesignerName] = useState('')
  const [blobSrc, setBlobSrc] = useState<string | null>(null)

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])

  const [tool, setTool] = useState<Tool>('select')
  const [color, setColor] = useState('#1D4ED8')
  const [visibility, setVisibility] = useState<AnnotationVisibility>('private')
  const [selectedAnn, setSelectedAnn] = useState<string | null>(null)
  const [notesFilter, setNotesFilter] = useState<'all' | 'private' | 'shared'>('all')
  const [viewerMode, setViewerMode] = useState<ViewerMode>('canvas')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(100)
  const [panelOpen, setPanelOpen] = useState(!isMobile)
  const [panelTab, setPanelTab] = useState<PanelTab>('status')
  const [showFeedback, setShowFeedback] = useState(true)

  const [uploading, setUploading] = useState(false)
  const [showDeliver, setShowDeliver] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [deliverNote, setDeliverNote] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }
      setUserId(user.id)
      const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
      if (profile?.name) setDesignerName(profile.name)

      const { data: proj } = await (supabase as any)
        .from('projects').select('*').eq('code', code).eq('designer_id', user.id).single() as { data: Project | null }
      if (!proj) { setLoading(false); return }
      setProject(proj)
      setDeliverNote((proj as any).delivery_note ?? '')

      const [annRes, pinRes, taskRes, verRes, revRes] = await Promise.all([
        (supabase as any).from('project_annotations').select('*').eq('project_id', proj.id).order('created_at', { ascending: true }),
        (supabase as any).from('project_pins').select('*').eq('project_id', proj.id).order('created_at', { ascending: true }),
        (supabase as any).from('project_tasks').select('*').eq('project_id', proj.id).order('position', { ascending: true }),
        (supabase as any).from('project_versions').select('*').eq('project_id', proj.id).order('version_number', { ascending: false }),
        (supabase as any).from('project_revisions').select('*').eq('project_id', proj.id).order('round_number', { ascending: false }),
      ])
      setAnnotations(annRes.data ?? [])
      setPins(pinRes.data ?? [])
      setTasks(taskRes.data ?? [])
      setVersions(verRes.data ?? [])
      setRevisions(revRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [code])

  useEffect(() => {
    if (!project?.file_url || !project?.file_name) return
    let revoke: (() => void) | null = null
    setBlobSrc(null)
    fetchAndRenderDesign(project.file_url, project.file_name).then(({ src, revoke: rv }) => { setBlobSrc(src); revoke = rv })
      .catch(() => setBlobSrc(project.file_url))
    return () => { revoke?.() }
  }, [project?.file_url])

  // ── Annotation CRUD ──────────────────────────────────────
  const createAnnotation = useCallback(async (draft: NewAnnotation) => {
    if (!project) return
    const { data } = await (supabase as any).from('project_annotations').insert({
      project_id: project.id, author_id: userId,
      kind: draft.kind, visibility: draft.visibility, color: draft.color,
      x_pct: draft.x_pct, y_pct: draft.y_pct, w_pct: draft.w_pct ?? null, h_pct: draft.h_pct ?? null,
      path: draft.path ?? null, text: draft.text ?? null,
      selector: draft.selector ?? null, meta: draft.meta ?? null,
    }).select().single() as { data: Annotation | null }
    if (data) {
      setAnnotations(prev => [...prev, data])
      setSelectedAnn(data.id)
      if (draft.kind !== 'draw') setTool('select')
    }
  }, [project, userId])

  const updateAnnotation = useCallback(async (id: string, patch: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    await (supabase as any).from('project_annotations').update(patch).eq('id', id)
  }, [])

  const deleteAnnotation = useCallback(async (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
    setSelectedAnn(prev => prev === id ? null : prev)
    await (supabase as any).from('project_annotations').delete().eq('id', id)
  }, [])

  // ── Tasks ────────────────────────────────────────────────
  const addTask = async (title: string) => {
    if (!project || !title.trim()) return
    const { data } = await (supabase as any).from('project_tasks')
      .insert({ project_id: project.id, title: title.trim(), position: tasks.length })
      .select().single() as { data: Task | null }
    if (data) setTasks(prev => [...prev, data])
  }
  const toggleTask = async (task: Task) => {
    setTasks(prev => prev.map(x => x.id === task.id ? { ...x, done: !x.done } : x))
    await (supabase as any).from('project_tasks').update({ done: !task.done }).eq('id', task.id)
  }
  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(x => x.id !== id))
    await (supabase as any).from('project_tasks').delete().eq('id', id)
  }

  // ── Client feedback / revisions ──────────────────────────
  const resolvePin = async (id: string) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, resolved: true } : p))
    await (supabase as any).from('project_pins').update({ resolved: true }).eq('id', id)
  }
  const resolveRevision = async (id: string) => {
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
    await (supabase as any).from('project_revisions').update({ status: 'resolved' }).eq('id', id)
  }

  // ── Version upload ───────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !project) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${project.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('design-uploads').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { showToast(t.uploadError); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('design-uploads').getPublicUrl(path)
    const nextNum = (versions[0]?.version_number ?? 0) + 1
    const { data: ver } = await (supabase as any).from('project_versions')
      .insert({ project_id: project.id, version_number: nextNum, file_url: publicUrl, file_name: file.name })
      .select().single() as { data: Version | null }
    if (ver) setVersions(prev => [ver, ...prev])
    await (supabase as any).from('projects').update({ file_url: publicUrl, file_name: file.name }).eq('id', project.id)
    setProject(prev => prev ? { ...prev, file_url: publicUrl, file_name: file.name } : prev)
    setUploading(false)
    showToast(t.versionUploaded)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Delivery ─────────────────────────────────────────────
  async function confirmDelivery() {
    if (!project) return
    setDelivering(true)
    if (versions.length === 0 && project.file_url && project.file_name) {
      const { data: ver } = await (supabase as any).from('project_versions')
        .insert({ project_id: project.id, version_number: 1, file_url: project.file_url, file_name: project.file_name, note: isDE ? 'Erste Abgabe' : 'First delivery' })
        .select().single() as { data: Version | null }
      if (ver) setVersions([ver])
    }
    const openRevs = revisions.filter(r => r.status === 'open')
    if (openRevs.length) {
      await (supabase as any).from('project_revisions').update({ status: 'resolved' }).eq('project_id', project.id).eq('status', 'open')
      setRevisions(prev => prev.map(r => ({ ...r, status: 'resolved' as const })))
    }
    const now = new Date().toISOString()
    await (supabase as any).from('projects')
      .update({ status: 'abgeliefert', delivered_at: now, delivery_note: deliverNote.trim() || null })
      .eq('id', project.id)
    setProject(prev => prev ? { ...prev, status: 'abgeliefert', delivered_at: now, delivery_note: deliverNote.trim() || null } as any : prev)
    setDelivering(false)
    setShowDeliver(false)
    showToast(t.delivered)
  }

  if (loading) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>…</div>
  }
  if (!project) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}><div style={{ fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.notFound}</div></div>
  }

  const status = project.status as any
  const visibleAnnotations = notesFilter === 'all' ? annotations : annotations.filter(a => a.visibility === notesFilter)
  const sharedCount = annotations.filter(a => a.visibility === 'shared').length
  const openPins = pins.filter(p => !p.resolved)
  const openRevs = revisions.filter(r => r.status === 'open')
  const doneTasks = tasks.filter(x => x.done).length
  const panelW = isMobile ? '100%' : '360px'

  const tabMeta: { id: PanelTab; icon: typeof ListChecks; badge?: number }[] = [
    { id: 'status', icon: GitCompare },
    { id: 'notes', icon: StickyNote, badge: annotations.length || undefined },
    { id: 'tasks', icon: ListChecks, badge: tasks.length || undefined },
    { id: 'feedback', icon: MessageSquare, badge: (openPins.length + openRevs.length) || undefined },
    { id: 'versions', icon: History, badge: versions.length || undefined },
  ]

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0F172A', overflow: 'hidden' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif', zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,.4)', animation: 'fadeInUp 200ms ease-out', whiteSpace: 'nowrap' }}>{toast}</div>
      )}

      {showDeliver && (
        <DeliveryModal t={t} project={project} versions={versions} note={deliverNote} setNote={setDeliverNote}
          delivering={delivering} onConfirm={confirmDelivery} onClose={() => setShowDeliver(false)} redo={status === 'abgeliefert'} />
      )}

      {/* Header */}
      <div style={{ height: '60px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => router.push(`/${locale}/app/project/${project.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
            <ArrowLeft size={16} /> {!isMobile && t.back}
          </button>
          <div style={{ width: '1px', height: '20px', background: '#E2E8F0', flexShrink: 0 }} />
          {!isMobile && <AppLogo />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
            <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.workspace} · <span style={{ fontFamily: '"Geist Mono", monospace' }}>{project.code}</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!isMobile && <WorkflowStageChip status={status} locale={locale} />}
          <button onClick={() => setPanelOpen(v => !v)} title={t.workspace} style={{ width: '38px', height: '38px', borderRadius: '9px', border: '1px solid #E2E8F0', background: panelOpen ? '#EFF6FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: panelOpen ? '#1D4ED8' : '#64748B' }}>
            {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ minHeight: '54px', background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 49, gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mode switcher */}
          {(() => {
            const isHtml = !!project?.file_name && /\.(html|zip)$/i.test(project.file_name)
            return (
              <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '9px', padding: '3px', gap: '2px' }}>
                {(['canvas', 'inspector'] as const).map(m => {
                  const active = viewerMode === m
                  const disabled = m === 'inspector' && !isHtml
                  return (
                    <button key={m} onClick={() => !disabled && setViewerMode(m)}
                      title={m === 'inspector' && !isHtml ? t.inspectorOnly : undefined}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: active ? '#fff' : 'transparent',
                        color: disabled ? '#CBD5E1' : active ? '#0F172A' : '#64748B',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                        fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        transition: 'all 150ms ease', opacity: disabled ? 0.5 : 1,
                      }}>
                      {m === 'canvas' ? t.modeCanvas : t.modeInspector}
                    </button>
                  )
                })}
              </div>
            )
          })()}
          {viewerMode === 'canvas' && <AnnotationToolbar tool={tool} setTool={setTool} color={color} setColor={setColor} visibility={visibility} setVisibility={setVisibility} locale={locale} compact={isMobile} />}
          {viewerMode === 'inspector' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {PALETTE_IMPORT.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: color === c ? '22px' : '18px', height: color === c ? '22px' : '18px', borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid #fff' : '2px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : '0 0 0 1px rgba(0,0,0,.08)', transition: 'all 150ms ease', padding: 0, flexShrink: 0 }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setShowFeedback(v => !v)} title={t.showFeedback}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
              border: `1px solid ${showFeedback && openPins.length ? '#FED7AA' : '#E2E8F0'}`,
              background: showFeedback ? (openPins.length ? '#FFF7ED' : '#F8FAFC') : '#fff',
              color: showFeedback ? (openPins.length ? '#EA580C' : '#64748B') : '#94A3B8' }}>
            <MessageSquare size={14} /> {openPins.length}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => setZoom(z => Math.max(40, z - 10))} style={zoomBtn}><ZoomOut size={14} color="#64748B" /></button>
            <span style={{ fontSize: '12px', fontFamily: '"Geist Mono", monospace', color: '#64748B', minWidth: '38px', textAlign: 'center' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(160, z + 10))} style={zoomBtn}><ZoomIn size={14} color="#64748B" /></button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Viewport */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#1A1A2E', backgroundImage: 'repeating-conic-gradient(#22223B 0% 25%, #1A1A2E 0% 50%)', backgroundSize: '20px 20px', display: 'flex', minWidth: 0 }}>
          <div style={{ flex: 1, padding: isMobile ? '20px' : '36px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto' }}>
            <div ref={containerRef} style={{ width: `${1280 * zoom / 100}px`, background: '#fff', boxShadow: '0 20px 80px rgba(0,0,0,.4)', position: 'relative', flexShrink: 0, alignSelf: 'stretch' }}>
              {project.file_url ? (
                blobSrc ? (
                  <iframe
                    ref={iframeRef}
                    src={blobSrc}
                    sandbox="allow-same-origin allow-scripts"
                    style={{ width: '100%', height: '100%', minHeight: '420px', border: 'none', display: 'block', pointerEvents: (viewerMode === 'inspector' || tool !== 'select') ? 'none' : 'auto' }}
                    title={project.name}
                  />
                ) : (
                  <div style={loadingBox}>…</div>
                )
              ) : (
                <div style={{ ...loadingBox, flexDirection: 'column', gap: '16px' }}>
                  <Upload size={40} color="#CBD5E1" />
                  <span style={{ fontSize: '15px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{t.noFile}</span>
                  <Button variant="primary" icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>{t.uploadVersion}</Button>
                </div>
              )}

              {/* Client feedback pins */}
              {showFeedback && pins.map((pin, i) => (
                <FeedbackPin key={pin.id} pin={pin} number={i + 1} onResolve={() => resolvePin(pin.id)} resolveLabel={t.resolve} resolvedLabel={t.resolved} />
              ))}

              {viewerMode === 'canvas' ? (
                <>
                  <AnnotationCanvas
                    annotations={annotations.filter(a => a.kind !== 'element')} editable tool={tool} color={color} visibility={visibility}
                    selectedId={selectedAnn} onCreate={createAnnotation} onSelect={setSelectedAnn}
                    onUpdate={updateAnnotation} onDelete={deleteAnnotation} locale={locale}
                  />
                  {/* Element annotations always visible in canvas mode too */}
                  <ElementAnnotationOverlay
                    annotations={annotations.filter(a => a.kind === 'element')}
                    iframeRef={iframeRef} editable locale={locale} onDelete={deleteAnnotation}
                  />
                </>
              ) : (
                <ElementInspector
                  iframeRef={iframeRef} containerRef={containerRef}
                  color={color} visibility={visibility} setVisibility={setVisibility}
                  locale={locale} onCreate={createAnnotation} onDelete={deleteAnnotation}
                  existingAnnotations={annotations}
                />
              )}
            </div>
          </div>
        </div>

        {/* Panel */}
        {panelOpen && (
          <div style={{ width: panelW, background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', right: 0, top: isMobile ? '114px' : undefined, bottom: isMobile ? 0 : undefined, zIndex: isMobile ? 60 : 'auto', boxShadow: isMobile ? '-8px 0 32px rgba(0,0,0,.15)' : 'none' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 6px', flexShrink: 0 }}>
              {tabMeta.map(({ id, icon: Icon, badge }) => {
                const active = panelTab === id
                return (
                  <button key={id} onClick={() => setPanelTab(id)} title={t.panelTabs[id]}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 2px 8px', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#1D4ED8' : 'transparent'}`, cursor: 'pointer', color: active ? '#1D4ED8' : '#94A3B8', marginBottom: '-1px', position: 'relative', transition: 'color 150ms ease' }}>
                    <div style={{ position: 'relative' }}>
                      <Icon size={17} strokeWidth={2.1} />
                      {badge ? <span style={{ position: 'absolute', top: '-6px', right: '-9px', minWidth: '14px', height: '14px', padding: '0 3px', borderRadius: '7px', background: id === 'feedback' && (openPins.length + openRevs.length) ? '#EA580C' : '#1D4ED8', color: '#fff', fontSize: '9px', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{badge}</span> : null}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{t.panelTabs[id]}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>
              {panelTab === 'status' && (
                <StatusPanel t={t} locale={locale} status={status} doneTasks={doneTasks} totalTasks={tasks.length} openRevs={openRevs}
                  onDeliver={() => setShowDeliver(true)} onResolveRevision={resolveRevision} onGoTasks={() => setPanelTab('tasks')} />
              )}
              {panelTab === 'notes' && (
                <NotesPanel t={t} locale={locale} annotations={annotations} visible={visibleAnnotations}
                  filter={notesFilter} setFilter={setNotesFilter} sharedCount={sharedCount}
                  selectedId={selectedAnn} onSelect={(id: string) => { setSelectedAnn(id); setTool('select') }} onDelete={deleteAnnotation} />
              )}
              {panelTab === 'tasks' && <TasksPanel t={t} tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />}
              {panelTab === 'feedback' && <FeedbackPanel t={t} pins={pins} revisions={revisions} onResolvePin={resolvePin} onResolveRevision={resolveRevision} />}
              {panelTab === 'versions' && <VersionsPanel t={t} locale={locale} versions={versions} project={project} uploading={uploading} onUpload={() => fileInputRef.current?.click()} />}
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".html,.zip,.png,.jpg,.jpeg,.webp,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />

      <ChatWidget projectId={project.id} senderName={designerName || 'Designer'} isDesigner senderId={userId} mode="floating" locale={locale} />
    </div>
  )
}

const zoomBtn: React.CSSProperties = { width: '30px', height: '30px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const loadingBox: React.CSSProperties = { width: '100%', height: '100%', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif', fontSize: '14px' }
const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: '32px 14px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', lineHeight: 1.55 }

function SectionTitle({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: noMargin ? 0 : '12px' }}>{children}</div>
}

// ── STATUS PANEL ──────────────────────────────────────────

function StatusPanel({ t, locale, status, doneTasks, totalTasks, openRevs, onDeliver, onResolveRevision, onGoTasks }: any) {
  return (
    <div>
      <SectionTitle>{t.workflowTitle}</SectionTitle>
      <WorkflowStepperVertical status={status} locale={locale} viewer="designer" style={{ marginBottom: '20px' }} />

      {status === 'escrow' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#1E40AF', lineHeight: 1.5, marginBottom: '12px' }}>{nextActionFor(status, 'designer', locale)}</div>
          <Button variant="primary" fullWidth icon={<PackageCheck size={16} />} onClick={onDeliver}>{t.deliverCta}</Button>
        </div>
      )}
      {status === 'abgeliefert' && (
        <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Clock size={16} color="#0F766E" />
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F766E' }}>{t.deliveredState}</span>
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#0F766E', lineHeight: 1.5, marginBottom: '12px', opacity: 0.85 }}>{t.deliveredSub}</div>
          <Button variant="secondary" size="sm" fullWidth icon={<RotateCcw size={14} />} onClick={onDeliver}>{t.deliverRedo}</Button>
        </div>
      )}
      {status === 'abgeschlossen' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Check size={16} color="#16A34A" />
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#166534' }}>{t.completedState}</span>
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#166534', lineHeight: 1.5, opacity: 0.85 }}>{t.completedSub}</div>
        </div>
      )}

      {openRevs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <SectionTitle>{t.openRevisions} ({openRevs.length})</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {openRevs.map((r: Revision) => (
              <div key={r.id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{t.revisionRound(r.round_number)}</div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#92400E', lineHeight: 1.5 }}>{r.note}</div>
                <button onClick={() => onResolveRevision(r.id)} style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>{t.markRevisionDone}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalTasks > 0 && (
        <div onClick={onGoTasks} style={{ background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: '10px', padding: '14px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{t.tasksProgress}</span>
            <span style={{ fontSize: '12px', fontFamily: '"Geist Mono", monospace', color: '#64748B' }}>{doneTasks} {t.of} {totalTasks}</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalTasks ? (doneTasks / totalTasks) * 100 : 0}%`, background: '#16A34A', borderRadius: '3px', transition: 'width 300ms cubic-bezier(0.23,1,0.32,1)' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── NOTES PANEL ───────────────────────────────────────────

function NotesPanel({ t, locale, annotations, visible, filter, setFilter, sharedCount, selectedId, onSelect, onDelete }: any) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '9px', padding: '3px', marginBottom: '14px' }}>
        {([['all', t.notesFilterAll, annotations.length], ['private', t.notesFilterPrivate, annotations.filter((a: Annotation) => a.visibility === 'private').length], ['shared', t.notesFilterShared, sharedCount]] as const).map(([key, label, n]) => {
          const active = filter === key
          return (
            <button key={key} onClick={() => setFilter(key)} style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#0F172A' : '#64748B', boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease' }}>
              {label} {n ? <span style={{ opacity: 0.5 }}>{n}</span> : ''}
            </button>
          )
        })}
      </div>
      {sharedCount > 0 && (
        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#1D4ED8', background: '#EFF6FF', borderRadius: '8px', padding: '8px 11px', marginBottom: '12px', lineHeight: 1.45 }}>{t.sharedHint}</div>
      )}
      <AnnotationList annotations={visible} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} locale={locale} emptyHint={t.notesEmpty} />
    </div>
  )
}

// ── TASKS PANEL ───────────────────────────────────────────

function TasksPanel({ t, tasks, onAdd, onToggle, onDelete }: any) {
  const [input, setInput] = useState('')
  const done = tasks.filter((x: Task) => x.done).length
  return (
    <div>
      <SectionTitle>{t.tasksTitle}</SectionTitle>
      {tasks.length > 0 && (
        <div style={{ height: '6px', borderRadius: '3px', background: '#E2E8F0', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${(done / tasks.length) * 100}%`, background: '#16A34A', borderRadius: '3px', transition: 'width 300ms cubic-bezier(0.23,1,0.32,1)' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onAdd(input); setInput('') } }} placeholder={t.taskPh}
          style={{ flex: 1, height: '38px', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none' }} />
        <button onClick={() => { onAdd(input); setInput('') }} disabled={!input.trim()} style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', background: input.trim() ? '#1D4ED8' : '#E2E8F0', color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={16} /></button>
      </div>
      {tasks.length === 0 ? (
        <div style={emptyStyle}>{t.tasksEmpty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tasks.map((task: Task) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #EEF2F6' }}>
              <button onClick={() => onToggle(task)} style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer', border: task.done ? 'none' : '1.5px solid #CBD5E1', background: task.done ? '#16A34A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}>
                {task.done && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'Inter, sans-serif', color: task.done ? '#94A3B8' : '#374151', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
              <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')} onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FEEDBACK PANEL ────────────────────────────────────────

function FeedbackPanel({ t, pins, revisions, onResolvePin, onResolveRevision }: any) {
  return (
    <div>
      <SectionTitle>{t.feedbackTitle}</SectionTitle>
      {pins.length === 0 ? (
        <div style={emptyStyle}>{t.feedbackEmpty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {pins.map((pin: Pin, i: number) => (
            <div key={pin.id} style={{ padding: '12px', borderRadius: '9px', background: pin.resolved ? '#F8FAFC' : '#fff', border: `1px solid ${pin.resolved ? '#EEF2F6' : '#E2E8F0'}`, opacity: pin.resolved ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: pin.resolved ? '#94A3B8' : '#EA580C', color: '#fff', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{pin.author}</span>
                </div>
                {pin.resolved ? <span style={{ fontSize: '11px', color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>{t.resolved}</span> :
                  <button onClick={() => onResolvePin(pin.id)} style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer' }}>{t.resolve}</button>}
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: pin.resolved ? '#94A3B8' : '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
            </div>
          ))}
        </div>
      )}

      {revisions.length > 0 && (
        <>
          <SectionTitle>{t.revisionsTitle}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {revisions.map((r: Revision) => (
              <div key={r.id} style={{ padding: '12px', borderRadius: '9px', background: r.status === 'open' ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${r.status === 'open' ? '#FDE68A' : '#EEF2F6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: r.status === 'open' ? '#B45309' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.revisionRound(r.round_number)}</span>
                  {r.status === 'open' ? <button onClick={() => onResolveRevision(r.id)} style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer' }}>{t.resolve}</button> : <span style={{ fontSize: '11px', color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>{t.resolved}</span>}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: r.status === 'open' ? '#92400E' : '#94A3B8', lineHeight: 1.5 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── VERSIONS PANEL ────────────────────────────────────────

function VersionsPanel({ t, locale, versions, project, uploading, onUpload }: any) {
  const fmt = (d: string) => new Date(d).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <SectionTitle noMargin>{t.versionsTitle}</SectionTitle>
        <Button variant="secondary" size="sm" icon={<Upload size={13} />} loading={uploading} onClick={onUpload}>{t.uploadVersion}</Button>
      </div>
      {versions.length === 0 ? (
        <div style={emptyStyle}>{t.versionsEmpty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {versions.map((v: Version, i: number) => (
            <div key={v.id} style={{ display: 'flex', gap: '11px', padding: '11px 12px', borderRadius: '9px', background: i === 0 ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${i === 0 ? '#BFDBFE' : '#EEF2F6'}` }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: i === 0 ? '#1D4ED8' : '#E2E8F0', color: i === 0 ? '#fff' : '#64748B', fontSize: '12px', fontWeight: 700, fontFamily: '"Geist Mono", monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>v{v.version_number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.file_name}</span>
                  {i === 0 && <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#1D4ED8', background: '#fff', border: '1px solid #BFDBFE', borderRadius: '5px', padding: '1px 6px', flexShrink: 0 }}>{t.current}</span>}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '2px' }}>{fmt(v.created_at)}{v.note ? ` · ${v.note}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DELIVERY MODAL ────────────────────────────────────────

function DeliveryModal({ t, project, versions, note, setNote, delivering, onConfirm, onClose, redo }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '18px', padding: '30px', maxWidth: '460px', width: '100%', boxShadow: '0 30px 90px rgba(0,0,0,.35)', animation: 'dropIn 200ms ease-out' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
          <PackageCheck size={23} color="#1D4ED8" />
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>{t.deliverModalTitle}</div>
        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', lineHeight: 1.6, marginBottom: '22px' }}>{t.deliverModalSub}</p>

        <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t.deliverIncludes}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 13px', background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: '10px', marginBottom: '18px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#1D4ED8', color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: '"Geist Mono", monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>v{versions[0]?.version_number ?? 1}</div>
          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.file_name || project.name}</span>
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151', marginBottom: '6px' }}>{t.deliverNoteLabel}</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.deliverNotePh} rows={3}
          style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none', resize: 'vertical', minHeight: '76px', marginBottom: '22px', boxSizing: 'border-box', lineHeight: 1.5 }} />

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" fullWidth loading={delivering} icon={<PackageCheck size={16} />} onClick={onConfirm}>{redo ? t.deliverRedo : t.deliverConfirm}</Button>
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
        </div>
      </div>
    </div>
  )
}

// ── CLIENT FEEDBACK PIN (read-only overlay) ───────────────

function FeedbackPin({ pin, number, onResolve, resolveLabel, resolvedLabel }: { pin: Pin; number: number; onResolve: () => void; resolveLabel: string; resolvedLabel: string }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'absolute', left: `${pin.x_pct}%`, top: `${pin.y_pct}%`, zIndex: 11 }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ width: '26px', height: '26px', borderRadius: '50%', background: pin.resolved ? '#94A3B8' : '#EA580C', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform 180ms ease', cursor: 'default' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff' }}>{number}</span>
      </div>
      {hov && (
        <div style={{ position: 'absolute', left: '32px', top: '-6px', width: '240px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', boxShadow: '0 8px 28px rgba(0,0,0,.14)', zIndex: 30, animation: 'dropIn 150ms ease-out' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#EA580C', marginBottom: '5px' }}>{pin.author}</div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
          {pin.resolved ? (
            <div style={{ fontSize: '11px', color: '#16A34A', fontFamily: 'Inter, sans-serif', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} /> {resolvedLabel}</div>
          ) : (
            <button onClick={onResolve} style={{ marginTop: '9px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>{resolveLabel}</button>
          )}
        </div>
      )}
    </div>
  )
}
