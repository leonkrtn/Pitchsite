'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, MessageCircle, X, Check } from 'lucide-react'
import { Button } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { fetchAndRenderDesign } from '@/lib/renderDesign'
import { ChatWidget } from '@/components/app/ChatWidget'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type Pin = Database['public']['Tables']['project_pins']['Row']

const T = {
  de: {
    back: 'Zurück zum Projekt',
    viewDesign: 'Designer-Vorschau',
    uploadVersion: 'Neue Version hochladen',
    uploading: 'Wird hochgeladen…',
    uploadSuccess: 'Version erfolgreich hochgeladen!',
    uploadError: 'Upload fehlgeschlagen.',
    markDelivered: 'Als Abgabe markieren',
    delivered: 'Abgabe markiert ✓',
    deliveredConfirm: 'Möchtest du dieses Projekt als abgeliefert markieren? Dein Kunde kann danach die Abnahme bestätigen.',
    confirmBtn: 'Ja, jetzt markieren',
    cancel: 'Abbrechen',
    comments: 'Kommentare',
    open: 'offen',
    done: 'erledigt',
    resolve: 'Als erledigt markieren',
    resolved: 'Erledigt ✓',
    noComments: 'Noch keine Kommentare vorhanden.',
    noFile: 'Noch keine Datei hochgeladen.',
    notFound: 'Projekt nicht gefunden oder kein Zugriff.',
  },
  en: {
    back: 'Back to project',
    viewDesign: 'Designer preview',
    uploadVersion: 'Upload new version',
    uploading: 'Uploading…',
    uploadSuccess: 'Version uploaded successfully!',
    uploadError: 'Upload failed.',
    markDelivered: 'Mark as delivered',
    delivered: 'Delivery marked ✓',
    deliveredConfirm: 'Do you want to mark this project as delivered? Your client will then be able to confirm acceptance.',
    confirmBtn: 'Yes, mark it now',
    cancel: 'Cancel',
    comments: 'Comments',
    open: 'open',
    done: 'done',
    resolve: 'Mark as resolved',
    resolved: 'Resolved ✓',
    noComments: 'No comments yet.',
    noFile: 'No file uploaded yet.',
    notFound: 'Project not found or no access.',
  },
}

function ReadOnlyPin({ pin, number, locale, onResolve, topPx }: { pin: Pin; number: number; locale: string; onResolve: () => void; topPx?: number }) {
  const [hov, setHov] = useState(false)
  const t = T[locale as 'de' | 'en'] ?? T.de
  return (
    <div style={{ position: 'absolute', left: `${pin.x_pct}%`, top: topPx !== undefined ? `${topPx}px` : `${pin.y_pct}%`, zIndex: 10 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '28px', height: '28px',
          borderRadius: '50% 50% 50% 0',
          background: pin.resolved ? '#94A3B8' : '#1D4ED8',
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)',
          cursor: 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 200ms',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff', marginTop: '-2px' }}>{number}</span>
      </div>
      {hov && (
        <div style={{
          position: 'absolute', left: '36px', top: '-8px',
          width: '260px', background: '#fff',
          border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 20,
          animation: 'dropIn 150ms ease-out',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '6px' }}>{pin.author}</div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
          {pin.resolved ? (
            <div style={{ fontSize: '11px', color: '#16A34A', fontFamily: 'Inter, sans-serif', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={10} /> {t.resolved}
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onResolve() }}
              style={{ marginTop: '10px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
            >
              {t.resolve}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DesignerViewerPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [isDelivered, setIsDelivered] = useState(false)
  const [blobSrc, setBlobSrc] = useState<string | null>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const [iframeScrollTop, setIframeScrollTop] = useState(0)
  const [designerName, setDesignerName] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }
      setUserId(user.id)
      const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
      if (profile?.name) setDesignerName(profile.name)

      const { data: proj } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('code', code)
        .eq('designer_id', user.id)
        .single() as { data: Project | null }

      if (!proj) { setLoading(false); return }
      setProject(proj)
      setIsDelivered(!!(proj as any).delivered_at)

      const { data: pinData } = await (supabase as any)
        .from('project_pins')
        .select('*')
        .eq('project_id', proj.id)
        .order('created_at', { ascending: true }) as { data: Pin[] | null }

      setPins(pinData ?? [])
      setLoading(false)
    }
    load()
  }, [code])

  useEffect(() => {
    if (!project?.file_url || !project?.file_name) return
    let revoke: (() => void) | null = null
    setBlobSrc(null)
    setContentHeight(0)
    setIframeScrollTop(0)
    fetchAndRenderDesign(project.file_url, project.file_name).then(({ src, revoke: rv }) => {
      setBlobSrc(src)
      revoke = rv
    }).catch(() => setBlobSrc(project.file_url))
    return () => { revoke?.() }
  }, [project?.file_url])

  useEffect(() => {
    let rafId = 0
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'pitchsite-height' && typeof e.data.h === 'number' && e.data.h > 50) {
        setContentHeight(e.data.h)
      }
      if (e.data?.type === 'pitchsite-scroll' && typeof e.data.y === 'number') {
        cancelAnimationFrame(rafId)
        const y = e.data.y
        rafId = requestAnimationFrame(() => setIframeScrollTop(y))
      }
    }
    window.addEventListener('message', handler)
    return () => { window.removeEventListener('message', handler); cancelAnimationFrame(rafId) }
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !project) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${project.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('design-uploads')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) { showToast(t.uploadError); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('design-uploads').getPublicUrl(path)

    await (supabase as any)
      .from('projects')
      .update({ file_url: publicUrl, file_name: file.name })
      .eq('id', project.id)

    setProject(prev => prev ? { ...prev, file_url: publicUrl, file_name: file.name } : prev)
    setUploading(false)
    showToast(t.uploadSuccess)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function markDelivered() {
    if (!project) return
    setDelivering(true)
    await (supabase as any)
      .from('projects')
      .update({ delivered_at: new Date().toISOString(), status: 'abgeliefert' })
      .eq('id', project.id)
    setProject(prev => prev ? { ...prev, status: 'abgeliefert' as any } : prev)
    setIsDelivered(true)
    setShowDeliverModal(false)
    setDelivering(false)
    showToast(t.delivered)
  }

  async function resolvePin(pinId: string) {
    await (supabase as any).from('project_pins').update({ resolved: true }).eq('id', pinId)
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, resolved: true } : p))
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>…</div>
    )
  }

  if (!project) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.notFound}</div>
      </div>
    )
  }

  const openCount = pins.filter(p => !p.resolved).length
  const resolvedCount = pins.filter(p => p.resolved).length

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,.3)', animation: 'fadeInUp 200ms ease-out', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Delivery confirm modal */}
      {showDeliverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.3)', animation: 'dropIn 200ms ease-out' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle size={24} color="#16A34A" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '10px' }}>
              {t.markDelivered}
            </div>
            <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', lineHeight: 1.65, marginBottom: '28px' }}>
              {t.deliveredConfirm}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="primary" loading={delivering} onClick={markDelivered}>{t.confirmBtn}</Button>
              <Button variant="ghost" onClick={() => setShowDeliverModal(false)}>{t.cancel}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ height: '64px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push(`/${locale}/app/project/${project.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px', fontFamily: 'Inter, sans-serif', padding: '6px 0' }}
          >
            <ArrowLeft size={16} /> {t.back}
          </button>
          <div style={{ width: '1px', height: '20px', background: '#E2E8F0' }} />
          <AppLogo />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{project.name}</div>
          <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
            {t.viewDesign} · <span style={{ fontFamily: '"Geist Mono", monospace' }}>{project.code}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => setSidebarOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: openCount > 0 ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${openCount > 0 ? '#FED7AA' : '#E2E8F0'}`, borderRadius: '9999px', padding: '6px 14px', cursor: 'pointer' }}
          >
            <MessageCircle size={16} color={openCount > 0 ? '#EA580C' : '#64748B'} />
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: openCount > 0 ? '#EA580C' : '#64748B' }}>
              {openCount} {t.open}
            </span>
          </div>

          <input ref={fileInputRef} type="file" accept=".html,.zip,.png,.jpg,.jpeg,.webp,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? t.uploading : t.uploadVersion}
          </Button>

          {isDelivered ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '7px 14px' }}>
              <Check size={14} color="#16A34A" />
              <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#16A34A' }}>{t.delivered}</span>
            </div>
          ) : (
            <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={() => setShowDeliverModal(true)}>
              {t.markDelivered}
            </Button>
          )}
        </div>
      </div>

      {/* Design viewport */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#1A1A2E', backgroundImage: 'repeating-conic-gradient(#22223B 0% 25%, #1A1A2E 0% 50%)', backgroundSize: '20px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto' }}>
          <div style={{
            width: '1280px',
            background: '#fff',
            boxShadow: '0 20px 80px rgba(0,0,0,.4)',
            position: 'relative',
            flexShrink: 0,
            alignSelf: 'stretch',
            overflow: 'hidden',
          }}>
            {project.file_url ? (
              blobSrc ? (
                <iframe
                  src={blobSrc}
                  sandbox="allow-same-origin allow-scripts"
                  style={{ width: '1280px', height: '100%', border: 'none', display: 'block' }}
                  title={project.name}
                />
              ) : (
                <div style={{ width: '1280px', height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                  Lädt…
                </div>
              )
            ) : (
              <div style={{ width: '1280px', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                <Upload size={40} color="#CBD5E1" />
                <span style={{ fontSize: '15px' }}>{t.noFile}</span>
                <Button variant="primary" icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
                  {t.uploadVersion}
                </Button>
              </div>
            )}

            {pins.map((pin, i) => {
              const topPx = contentHeight > 0
                ? (pin.y_pct / 100) * contentHeight - iframeScrollTop
                : undefined
              return (
                <ReadOnlyPin key={pin.id} pin={pin} number={i + 1} locale={locale} onResolve={() => resolvePin(pin.id)} topPx={topPx} />
              )
            })}
          </div>
        </div>
      </div>

      {/* Chat */}
      {project && (
        <ChatWidget
          projectId={project.id}
          senderName={designerName || 'Designer'}
          isDesigner={true}
          senderId={userId}
          mode="floating"
          locale={locale}
        />
      )}

      {/* Comment sidebar */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', right: 0, top: '108px', bottom: 0, width: '320px', background: '#fff', borderLeft: '1px solid #E2E8F0', zIndex: 40, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
              {t.comments} ({pins.length})
            </span>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <X size={18} color="#64748B" />
            </button>
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', gap: '6px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#EA580C' }}>
              {openCount} {t.open}
            </span>
            <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#16A34A' }}>
              {resolvedCount} {t.done}
            </span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>
                {t.noComments}
              </div>
            ) : pins.map((pin, i) => (
              <div key={pin.id} style={{ padding: '14px', borderRadius: '8px', background: pin.resolved ? '#F8FAFC' : '#fff', border: `1px solid ${pin.resolved ? '#F1F5F9' : '#E2E8F0'}`, opacity: pin.resolved ? 0.65 : 1, transition: 'opacity 200ms' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: pin.resolved ? '#94A3B8' : '#1D4ED8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>{i + 1}</div>
                    <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{pin.author}</span>
                  </div>
                  {pin.resolved ? (
                    <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#16A34A' }}>{t.resolved}</span>
                  ) : (
                    <button
                      onClick={() => resolvePin(pin.id)}
                      style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}
                    >
                      {t.resolve}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: pin.resolved ? '#94A3B8' : '#374151', lineHeight: 1.55 }}>{pin.comment}</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                  {new Date(pin.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
