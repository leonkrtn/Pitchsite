'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, ZoomIn, ZoomOut, X, MousePointer } from 'lucide-react'
import { Button } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type Pin = Database['public']['Tables']['project_pins']['Row']

const T = {
  de: {
    by: 'von',
    comments: 'Kommentare',
    accept: '✓ Projekt annehmen',
    commentMode: 'Kommentarmodus:',
    on: 'EIN', off: 'AUS',
    commentHint: 'Klicke irgendwo auf das Design um einen Kommentar zu setzen',
    commentPh: 'Dein Kommentar…',
    cancel: 'Abbrechen',
    send: 'Senden',
    allComments: (n: number) => `Alle Kommentare (${n})`,
    notFound: 'Projekt nicht gefunden.',
    reply: 'Antworten',
  },
  en: {
    by: 'by',
    comments: 'Comments',
    accept: '✓ Accept project',
    commentMode: 'Comment mode:',
    on: 'ON', off: 'OFF',
    commentHint: 'Click anywhere on the design to add a comment',
    commentPh: 'Your comment…',
    cancel: 'Cancel',
    send: 'Send',
    allComments: (n: number) => `All comments (${n})`,
    notFound: 'Project not found.',
    reply: 'Reply',
  },
}

export default function PitchViewerPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [project, setProject] = useState<Project | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [commentMode, setCommentMode] = useState(false)
  const [activePin, setActivePin] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: proj } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('code', code)
        .single() as { data: Project | null }

      if (!proj) { setLoading(false); return }
      setProject(proj)

      const { data: pinData } = await (supabase as any)
        .from('project_pins')
        .select('*')
        .eq('project_id', proj.id)
        .order('created_at', { ascending: true }) as { data: Pin[] | null }

      setPins(pinData ?? [])
      setLoading(false)

      // Try to get author name from session
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
        if (profile?.name) setAuthorName(profile.name)
      }
    }
    load()
  }, [code])

  const handleFrameClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return
    if (activePin) { setActivePin(null); return }
    const rect = frameRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setNewPin({ x, y })
    setActivePin(null)
  }, [commentMode, activePin])

  const handleAddComment = async (text: string) => {
    if (!project || !newPin) return
    const author = authorName || project.client_name || 'Anonym'

    const { data } = await (supabase as any)
      .from('project_pins')
      .insert({ project_id: project.id, x_pct: newPin.x, y_pct: newPin.y, comment: text, author })
      .select()
      .single() as { data: Pin | null }

    if (data) {
      setPins(prev => [...prev, data])
      setNewPin(null)
      setActivePin(data.id)
    }
  }

  const handleAccept = () => {
    if (!project) return
    setAcceptLoading(true)
    setTimeout(() => {
      setAcceptLoading(false)
      router.push(`/${locale}/app/contract/${project.code}`)
    }, 800)
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        …
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.notFound}</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
      {/* Header */}
      <div style={{ height: '64px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 50 }}>
        <AppLogo />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{project.name}</div>
          <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
            {t.by} {project.client_name || '—'} · <span style={{ fontFamily: '"Geist Mono", monospace' }}>{project.code}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => setSidebarOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '6px 14px', cursor: 'pointer' }}
          >
            <MessageCircle size={16} color="#1D4ED8" />
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1D4ED8' }}>
              {pins.length} {t.comments}
            </span>
          </div>
          <Button variant="primary" loading={acceptLoading} onClick={handleAccept} style={{ height: '40px' }}>
            {t.accept}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ height: '48px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, zIndex: 49 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.commentMode}</span>
          <ToggleSwitch on={commentMode} onChange={setCommentMode} />
          <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
            {commentMode ? t.on : t.off}
          </span>
        </div>
        {commentMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '9999px', padding: '6px 14px' }}>
            <MousePointer size={14} color="#D97706" />
            <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#92400E' }}>{t.commentHint}</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ width: '28px', height: '28px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomOut size={14} color="#64748B" />
          </button>
          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={{ width: '28px', height: '28px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomIn size={14} color="#64748B" />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div style={{ flex: 1, overflow: 'auto', background: '#1A1A2E', backgroundImage: 'repeating-conic-gradient(#22223B 0% 25%, #1A1A2E 0% 50%)', backgroundSize: '20px 20px', position: 'relative' }}>
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={frameRef}
            onClick={handleFrameClick}
            style={{
              width: `${1280 * zoom / 100}px`,
              background: '#fff',
              boxShadow: '0 20px 80px rgba(0,0,0,.4)',
              position: 'relative',
              cursor: commentMode ? 'crosshair' : 'default',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {/* Iframe showing uploaded design */}
            {project.file_url ? (
              <iframe
                src={project.file_url}
                sandbox="allow-same-origin allow-scripts"
                style={{ width: '1280px', height: '900px', border: 'none', display: 'block', pointerEvents: commentMode ? 'none' : 'auto' }}
                title={project.name}
              />
            ) : (
              <div style={{ width: '1280px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                No design file uploaded
              </div>
            )}

            {/* Pins overlay */}
            {pins.map((pin, i) => (
              <CommentPin
                key={pin.id}
                pin={pin}
                number={i + 1}
                active={activePin === pin.id}
                onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
                t={t}
              />
            ))}

            {/* New pin placeholder + popover */}
            {newPin && commentMode && (
              <>
                <div style={{ position: 'absolute', left: `${newPin.x}%`, top: `${newPin.y}%`, width: '28px', height: '28px', borderRadius: '50% 50% 50% 0', background: 'rgba(29,78,216,.6)', border: '2px solid #fff', zIndex: 10 }} />
                <NewCommentPopover
                  pos={newPin}
                  onClose={() => setNewPin(null)}
                  onSubmit={handleAddComment}
                  placeholder={t.commentPh}
                  cancelLabel={t.cancel}
                  sendLabel={t.send}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comment Sidebar */}
      {sidebarOpen && (
        <CommentSidebar
          pins={pins}
          title={t.allComments(pins.length)}
          onClose={() => setSidebarOpen(false)}
          onPinClick={id => { setActivePin(id); setSidebarOpen(false) }}
        />
      )}
    </div>
  )
}

// ── TOGGLE ────────────────────────────────────────────────

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: '48px', height: '24px', borderRadius: '9999px', background: on ? '#1D4ED8' : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 200ms', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '27px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left 200ms' }} />
    </div>
  )
}

// ── COMMENT PIN ───────────────────────────────────────────

function CommentPin({ pin, number, active, onClick, t }: { pin: Pin; number: number; active: boolean; onClick: () => void; t: typeof T.de }) {
  const [hov, setHov] = useState(false)
  const initials = pin.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ position: 'absolute', left: `${pin.x_pct}%`, top: `${pin.y_pct}%`, zIndex: 10 }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '28px', height: '28px',
          borderRadius: '50% 50% 50% 0',
          background: '#1D4ED8', border: '2px solid #fff',
          boxShadow: active ? '0 0 0 4px rgba(29,78,216,.3)' : '0 2px 8px rgba(0,0,0,.25)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov ? 'scale(1.1)' : active ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 200ms', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff', marginTop: '-2px' }}>{number}</span>
      </div>
      {(hov || active) && (
        <div style={{
          position: 'absolute', left: '36px', top: '-8px',
          width: '280px', background: '#fff',
          border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 20,
          animation: 'dropIn 150ms ease-out',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff', flexShrink: 0 }}>{initials}</div>
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{pin.author}</span>
            <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginLeft: 'auto' }}>
              {new Date(pin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
          <div style={{ fontSize: '13px', color: '#1D4ED8', fontFamily: 'Inter, sans-serif', marginTop: '10px', cursor: 'pointer' }}>{t.reply}</div>
        </div>
      )}
    </div>
  )
}

// ── NEW COMMENT POPOVER ───────────────────────────────────

function NewCommentPopover({ pos, onClose, onSubmit, placeholder, cancelLabel, sendLabel }: {
  pos: { x: number; y: number }
  onClose: () => void
  onSubmit: (text: string) => void
  placeholder: string
  cancelLabel: string
  sendLabel: string
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'absolute', left: `calc(${pos.x}% + 32px)`, top: `calc(${pos.y}% - 8px)`,
      width: '300px', background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: '12px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 30,
      animation: 'dropIn 150ms ease-out',
    }}>
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', minHeight: '80px', border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
          borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          color: '#0F172A', resize: 'none', outline: 'none', transition: 'border-color 150ms',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <Button variant="ghost" size="sm" onClick={onClose}>{cancelLabel}</Button>
        <Button variant="primary" size="sm" onClick={() => text.trim() && onSubmit(text)}>{sendLabel}</Button>
      </div>
    </div>
  )
}

// ── COMMENT SIDEBAR ───────────────────────────────────────

function CommentSidebar({ pins, title, onClose, onPinClick }: {
  pins: Pin[]; title: string; onClose: () => void; onPinClick: (id: string) => void
}) {
  return (
    <div style={{
      position: 'fixed', right: 0, top: '112px', bottom: 0,
      width: '320px', background: '#fff', borderLeft: '1px solid #E2E8F0',
      zIndex: 40, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
          {title}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <X size={18} color="#64748B" />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pins.map((pin, i) => (
          <div
            key={pin.id}
            onClick={() => onPinClick(pin.id)}
            style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px', background: '#F8FAFC', cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1D4ED8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.4 }}>{pin.comment}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{pin.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
