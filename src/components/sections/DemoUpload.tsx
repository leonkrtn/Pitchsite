'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { SparkleText } from '@/components/ui/SparkleText'
import { motion, AnimatePresence } from 'framer-motion'
import JSZip from 'jszip'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

const DEMO_CODE = 'A4K9-X2Q3M'
const DEMO = {
  freelancer: 'Max Mustermann',
  title: 'Unternehmenswebsite',
  deliverables: [
    'Startseite mit Hero, Leistungsübersicht & Referenzen',
    'Unterseiten: Über uns, Leistungen, Kontakt',
    'Responsives Design — Mobile, Tablet & Desktop',
    'Kontaktformular mit E-Mail-Weiterleitung',
    'SEO-Grundoptimierung & Meta-Tags',
    'Ladezeit-optimiert (< 2 Sek.)',
  ],
  delivery: '14 Werktage nach Auftragserteilung',
  price: '2.400 €',
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'dragging' }
  | { kind: 'processing' }
  | { kind: 'rendering'; filename: string; src: string }
  | { kind: 'preview'; filename: string; src: string }
  | { kind: 'error'; message: string }

interface Comment {
  id: string
  absX: number
  absY: number
  text: string
  resolved: boolean
  createdAt: number
}

interface PendingPin {
  viewX: number
  viewY: number
  absX: number
  absY: number
}

function isFigmaUrl(url: string): boolean {
  return /^https:\/\/(www\.)?figma\.com\/(file|design|proto)\//.test(url)
}

function toFigmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
}

const blobRegistry: string[] = []
function trackBlob(content: BlobPart, mime: string): string {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  blobRegistry.push(url)
  return url
}
function revokeAll() { blobRegistry.splice(0).forEach(URL.revokeObjectURL) }

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    css: 'text/css', js: 'application/javascript', mjs: 'application/javascript',
    html: 'text/html', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
    json: 'application/json',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function resolveZip(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.keys(zip.files)
  const indexPath =
    entries.find(f => f.toLowerCase() === 'index.html') ||
    entries.find(f => !zip.files[f].dir && f.toLowerCase().endsWith('/index.html')) ||
    entries.find(f => !zip.files[f].dir && f.toLowerCase().endsWith('.html'))
  if (!indexPath) throw new Error('Keine index.html im ZIP gefunden.')
  const baseDir = indexPath.includes('/') ? indexPath.replace(/[^/]+$/, '') : ''
  const htmlRaw = await zip.files[indexPath].async('string')
  const blobMap = new Map<string, string>()
  await Promise.all(
    entries.filter(f => !zip.files[f].dir).map(async f => {
      const buf = await zip.files[f].async('arraybuffer')
      const url = trackBlob(buf, guessMime(f))
      blobMap.set(f, url)
      if (baseDir && f.startsWith(baseDir)) blobMap.set(f.slice(baseDir.length), url)
    })
  )
  const resolve = (path: string) => blobMap.get(path) ?? blobMap.get(baseDir + path) ?? null
  return htmlRaw
    .replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (match, attr, q, path) => {
      if (/^(https?:|\/\/|data:|blob:|#|mailto:)/.test(path)) return match
      const u = resolve(path); return u ? `${attr}=${q}${u}${q}` : match
    })
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, q, path) => {
      if (/^(https?:|\/\/|data:|blob:)/.test(path)) return match
      const u = resolve(path); return u ? `url(${q}${u}${q})` : match
    })
}

async function processFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    return trackBlob(await resolveZip(file), 'text/html')
  }
  return trackBlob(await file.text(), 'text/html')
}

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#F3F4F6', borderRadius: '4px', ...style }}>
      <div style={{
        position: 'absolute', inset: 0, transform: 'translateX(-100%)',
        background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.6) 50%,transparent 100%)',
        animation: 'shimmer 1.4s infinite',
      }} />
    </div>
  )
}

function BrowserSkeleton() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '56px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '24px', flexShrink: 0 }}>
        <Shimmer style={{ width: '96px', height: '16px' }} />
        <div style={{ flex: 1 }} />
        <Shimmer style={{ width: '56px', height: '14px' }} />
        <Shimmer style={{ width: '56px', height: '14px' }} />
        <Shimmer style={{ width: '96px', height: '32px', borderRadius: '8px' }} />
      </div>
      <div style={{ padding: '56px 40px 40px', maxWidth: '672px' }}>
        <Shimmer style={{ width: '64px', height: '10px', marginBottom: '20px' }} />
        <Shimmer style={{ width: '320px', height: '28px', marginBottom: '12px' }} />
        <Shimmer style={{ width: '224px', height: '28px', marginBottom: '28px' }} />
        <Shimmer style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
        <Shimmer style={{ width: '83%', height: '14px', marginBottom: '8px' }} />
        <Shimmer style={{ width: '75%', height: '14px', marginBottom: '36px' }} />
        <Shimmer style={{ width: '144px', height: '40px', borderRadius: '12px' }} />
      </div>
      <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxWidth: '768px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
            <Shimmer style={{ width: '36px', height: '36px', borderRadius: '12px', marginBottom: '12px' }} />
            <Shimmer style={{ width: '75%', height: '12px', marginBottom: '8px' }} />
            <Shimmer style={{ width: '100%', height: '10px', marginBottom: '6px' }} />
            <Shimmer style={{ width: '83%', height: '10px', marginBottom: '6px' }} />
            <Shimmer style={{ width: '67%', height: '10px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentPin({ number, resolved, active, onClick, divRef }: {
  number: number; resolved: boolean; active: boolean; onClick: () => void
  divRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={divRef} style={{ position: 'absolute', zIndex: 20, transform: 'translateY(-100%)' }}>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        onClick={e => { e.stopPropagation(); onClick() }}
        title={`Kommentar ${number}`}
        style={{
          width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          borderRadius: '50% 50% 50% 0', border: 'none', cursor: 'pointer',
          transition: 'all 150ms ease',
          background: resolved ? '#D1D5DB' : active ? '#1D4ED8' : '#1D4ED8',
          color: resolved ? '#6B7280' : '#fff',
          transform: active ? 'scale(1.1)' : undefined,
          outline: active ? '2px solid white' : 'none',
          outlineOffset: active ? '1px' : undefined,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {number}
      </motion.button>
    </div>
  )
}

function NewCommentCard({ x, y, index, onSubmit, onCancel }: {
  x: number; y: number; index: number; onSubmit: (text: string) => void; onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const submit = () => { if (text.trim()) onSubmit(text.trim()) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') onCancel()
  }

  const toRight = x < 58
  const cardStyle: React.CSSProperties = toRight
    ? { left: `calc(${x}% + 20px)`, top: `${Math.min(y, 68)}%` }
    : { right: `calc(${100 - x}% + 4px)`, top: `${Math.min(y, 68)}%` }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      style={{
        position: 'absolute', zIndex: 30, width: '240px',
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 16px 48px rgba(0,0,0,.15)', border: '1px solid #E5E7EB', padding: '14px',
        ...cardStyle,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #A78BFA, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>K</div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>Dein Kunde</span>
        <span style={{ fontSize: '10px', color: '#64748B', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, system-ui, sans-serif' }}>#{index}</span>
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Kommentar… (⏎ senden)"
        rows={3}
        style={{
          width: '100%', fontSize: '14px', color: '#0F172A', resize: 'none',
          border: `1px solid ${focused ? '#1D4ED8' : '#E5E7EB'}`,
          borderRadius: '12px', padding: '8px 12px', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            flex: 1, background: '#1D4ED8', color: '#fff', fontSize: '12px', fontWeight: 600,
            padding: '6px', borderRadius: '8px', border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
            opacity: text.trim() ? 1 : 0.4, transition: 'background-color 150ms ease',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Senden
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '0 8px', fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Esc
        </button>
      </div>
    </motion.div>
  )
}

function timeAgo(ts: number) {
  const d = Date.now() - ts
  if (d < 5000) return 'Gerade eben'
  if (d < 60000) return `Vor ${Math.floor(d / 1000)}s`
  if (d < 3600000) return `Vor ${Math.floor(d / 60000)} Min`
  return `Vor ${Math.floor(d / 3600000)} Std`
}

function CommentSidebar({ comments, activeId, commentMode, onSelect, onResolve, onDelete, onToggleMode, onAccept, collapsed, onToggleCollapse }: {
  comments: Comment[]
  activeId: string | null
  commentMode: boolean
  onSelect: (id: string) => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onToggleMode: () => void
  onAccept: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [showResolved, setShowResolved] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [sentCommentCount, setSentCommentCount] = useState(0)
  const activeRef = useRef<HTMLDivElement>(null)

  const open = comments.filter(c => !c.resolved)
  const resolved = comments.filter(c => c.resolved)
  const indexOf = (id: string) => comments.findIndex(c => c.id === id) + 1

  useEffect(() => {
    if (activeId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeId])

  return (
    <motion.div
      initial={{ width: 264 }}
      animate={{ width: collapsed ? 0 : 264 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      style={{ flexShrink: 0, borderLeft: '1px solid #E5E7EB', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onToggleCollapse}
          title="Seitenleiste schließen"
          style={{
            width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(100,116,139,0.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '-4px',
          }}
        >
          <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <svg style={{ width: '14px', height: '14px', color: '#64748B' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>Kommentare</span>
        {open.length > 0 && (
          <span style={{
            marginLeft: 'auto', background: '#1D4ED8', color: '#fff', fontSize: '10px', fontWeight: 700,
            borderRadius: '9999px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {open.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {comments.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <svg style={{ width: '16px', height: '16px', color: '#9CA3AF' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>Noch keine Kommentare</p>
              <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.5, fontFamily: 'Inter, system-ui, sans-serif' }}>Kommentarmodus aktivieren und auf die Vorschau klicken</p>
            </motion.div>
          )}

          {open.map(c => {
            const isActive = activeId === c.id
            return (
              <motion.div key={c.id} ref={isActive ? activeRef : undefined}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => onSelect(c.id)}
                style={{
                  margin: '4px 8px', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  boxShadow: isActive ? '0 0 0 1px #BFDBFE' : 'none',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50% 50% 50% 0', flexShrink: 0, marginTop: '2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700,
                    background: isActive ? '#1D4ED8' : 'rgba(29,78,216,0.1)',
                    color: isActive ? '#fff' : '#1D4ED8',
                    transition: 'background 150ms ease',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    {indexOf(c.id)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>Kunde</span>
                      <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#0F172A', lineHeight: 1.5, overflowWrap: 'break-word', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); onResolve(c.id) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Erledigt
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                        style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {resolved.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <button
              onClick={() => setShowResolved(s => !s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 20px', fontSize: '10px', fontWeight: 600, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 150ms ease',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <svg style={{ width: '10px', height: '10px', transition: 'transform 150ms ease', transform: showResolved ? 'rotate(90deg)' : 'rotate(0deg)' }}
                fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {resolved.length} erledigt
            </button>
            <AnimatePresence>
              {showResolved && resolved.map(c => (
                <motion.div key={c.id}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onClick={() => onSelect(c.id)}
                  style={{ margin: '2px 8px', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', opacity: 0.5 }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50% 50% 50% 0', background: '#E5E7EB', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {indexOf(c.id)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Kunde</span>
                        <svg style={{ width: '10px', height: '10px', color: '#22C55E', marginLeft: 'auto' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', textDecoration: 'line-through', overflowWrap: 'break-word', lineHeight: 1.5, fontFamily: 'Inter, system-ui, sans-serif' }}>{c.text}</p>
                      <button
                        onClick={e => { e.stopPropagation(); onResolve(c.id) }}
                        style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Wieder öffnen
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer: mode toggle */}
      <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          {open.length > sentCommentCount && (
            feedbackSent ? (
              <motion.div key="sent"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#16A34A', fontWeight: 500, marginBottom: '10px', padding: '4px 0' }}
              >
                <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Feedback gesendet
              </motion.div>
            ) : (
              <motion.button key="send"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={() => { setFeedbackSent(true); setSentCommentCount(open.length); setTimeout(() => setFeedbackSent(false), 2500) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '11px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer',
                  marginBottom: '10px', padding: '4px', borderRadius: '8px',
                  transition: 'background 150ms ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
                </svg>
                Kommentare absenden
              </motion.button>
            )
          )}
        </AnimatePresence>
        <button
          onClick={onToggleMode}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: commentMode ? '#1D4ED8' : '#F3F4F6',
            color: commentMode ? '#fff' : '#0F172A',
            transition: 'all 150ms ease',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          {commentMode ? 'Kommentarmodus aktiv' : 'Kommentieren'}
        </button>
        <AnimatePresence>
          {commentMode && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Klick auf die Vorschau um einen Pin zu setzen
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pitchsite client panel */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #E5E7EB', flexShrink: 0, background: 'rgba(249,250,251,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <svg style={{ width: '14px', height: '14px', color: '#1D4ED8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span style={{ fontSize: '11px', color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif' }}>
            von <strong style={{ color: '#0F172A', fontWeight: 600 }}>{DEMO.freelancer}</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>
            <span style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, system-ui, sans-serif' }}>Code</span>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>{DEMO_CODE}</span>
          </div>
        </div>
        <button
          onClick={onAccept}
          style={{
            width: '100%', background: '#22C55E', color: '#fff', fontSize: '12px', fontWeight: 600,
            padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background 150ms ease',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#16A34A')}
          onMouseLeave={e => (e.currentTarget.style.background = '#22C55E')}
        >
          <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Angebot annehmen
        </button>
        <p style={{ fontSize: '9px', color: 'rgba(100,116,139,0.5)', textAlign: 'center', marginTop: '6px', lineHeight: 1.4, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Demo · So sieht es dein Kunde
        </p>
      </div>
      </>
    </motion.div>
  )
}

type PayStep = 'offer' | 'pay' | 'done'

function PaymentFlow({ step, onStep, onClose }: {
  step: PayStep; onStep: (s: PayStep) => void; onClose: () => void
}) {
  const [sigName, setSigName] = useState('')
  const [sigFocused, setSigFocused] = useState(false)
  const [figmaFocused, setFigmaFocused] = useState(false)
  const stepIdx = ['offer', 'pay', 'done'].indexOf(step)
  const labels = ['Angebot', 'Zahlung', 'Bestätigt']

  return (
    <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.25, ease: EASE_OUT }}
      style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', bottom: '12px', left: '16px', zIndex: 10, pointerEvents: 'none' }}>
        <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(100,116,139,0.4)', letterSpacing: '0.04em', fontFamily: 'Inter, system-ui, sans-serif' }}>Demo</span>
      </div>

      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '14px' }}>
          <span style={{ color: '#0F172A' }}>Pitch</span><SparkleText>site</SparkleText>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {labels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '24px', height: '1px', background: '#E5E7EB', margin: '0 4px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, flexShrink: 0, transition: 'background 150ms ease',
                  background: i < stepIdx ? '#22C55E' : i === stepIdx ? '#1D4ED8' : '#F3F4F6',
                  color: i < stepIdx || i === stepIdx ? '#fff' : '#9CA3AF',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 500, display: 'none',
                  color: i <= stepIdx ? '#0F172A' : '#64748B',
                  transition: 'color 150ms ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
        {step !== 'done' && (
          <button onClick={onClose} style={{ marginLeft: '8px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">

          {step === 'offer' && (
            <motion.div key="offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: EASE_OUT }}
              style={{ padding: '20px', maxWidth: '448px', margin: '0 auto' }}
            >
              <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px', fontFamily: 'Inter, system-ui, sans-serif' }}>Angebot von</p>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F172A', marginBottom: '16px' }}>{DEMO.freelancer}</p>
              <div style={{ border: '1px solid #F1F5F9', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                  <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>Leistungsumfang</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>{DEMO.title}</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {DEMO.deliverables.map((d, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <svg style={{ width: '12px', height: '12px', color: '#1D4ED8', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                  <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px', fontFamily: 'Inter, system-ui, sans-serif' }}>Lieferdatum</p>
                  <p style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>{DEMO.delivery}</p>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, system-ui, sans-serif' }}>Gesamtpreis</p>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>{DEMO.price}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                <svg style={{ width: '16px', height: '16px', color: '#1D4ED8', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p style={{ fontSize: '12px', color: 'rgba(30,58,138,0.7)', lineHeight: 1.5, fontFamily: 'Inter, system-ui, sans-serif' }}>Dein Geld liegt gesichert bei Pitchsite — und wird erst nach deiner Abnahme freigegeben.</p>
              </div>
              <button
                onClick={() => onStep('pay')}
                style={{
                  width: '100%', background: '#1D4ED8', color: '#fff', fontWeight: 600,
                  padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', transition: 'background 150ms ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1E40AF')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1D4ED8')}
              >
                Auftrag annehmen & zahlen →
              </button>
            </motion.div>
          )}

          {step === 'pay' && (
            <motion.div key="pay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: EASE_OUT }}
              style={{ padding: '20px', maxWidth: '448px', margin: '0 auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>Zahlung</p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Betrag</p>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>{DEMO.price}</p>
                </div>
              </div>
              <div style={{ background: '#F9FAFB', border: '1px solid #F1F5F9', borderRadius: '12px', padding: '12px', marginBottom: '12px', fontSize: '12px', color: '#64748B', lineHeight: 1.5, fontFamily: 'Inter, system-ui, sans-serif' }}>
                <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px', fontSize: '11px' }}>Kaufvertrag</p>
                Ich beauftrage {DEMO.freelancer} mit der Erstellung von „{DEMO.title}" ({DEMO.deliverables.length} Leistungspunkte gemäß Angebot) zum Festpreis von {DEMO.price}, Lieferung innerhalb von {DEMO.delivery}. Die Zahlung wird über Pitchsite abgewickelt und erst nach meiner Abnahme freigegeben.
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>Dein Name (digitale Unterschrift)</label>
                <input
                  type="text" value={sigName} onChange={e => setSigName(e.target.value)}
                  onFocus={() => setSigFocused(true)} onBlur={() => setSigFocused(false)}
                  placeholder="Vorname Nachname"
                  style={{
                    width: '100%', fontSize: '14px', border: `1px solid ${sigFocused ? '#1D4ED8' : '#E5E7EB'}`,
                    borderRadius: '12px', padding: '10px 12px', outline: 'none',
                    boxShadow: sigFocused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
                    transition: 'border-color 150ms, box-shadow 150ms',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '6px', fontFamily: 'Inter, system-ui, sans-serif' }}>Zahlungsmethode</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ border: '1px solid rgba(29,78,216,0.4)', background: 'rgba(239,246,255,0.3)', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D4ED8' }} />
                    </div>
                    <span style={{ fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>Kreditkarte</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontWeight: 700, background: '#2563EB', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontFamily: 'Inter, system-ui, sans-serif' }}>VISA</span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F87171' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FACC15', marginLeft: '-6px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ border: '1px solid #F1F5F9', background: '#F9FAFB', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #D1D5DB', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>SEPA-Lastschrift</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#D1D5DB', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#D1D5DB', letterSpacing: '0.1em' }}>•••• •••• •••• 4242</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#D1D5DB' }}>12 / 27</span>
                    </div>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#D1D5DB' }}>•••</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onStep('done')}
                style={{
                  width: '100%', background: '#1D4ED8', color: '#fff', fontWeight: 600,
                  padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 150ms ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1E40AF')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1D4ED8')}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {DEMO.price} sicher zahlen
              </button>
              <p style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', marginTop: '6px', fontFamily: 'Inter, system-ui, sans-serif' }}>Gesichert durch Stripe · SSL-verschlüsselt</p>
              <button
                onClick={() => onStep('offer')}
                style={{ width: '100%', fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', padding: '4px', transition: 'color 150ms ease', fontFamily: 'Inter, system-ui, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F172A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >
                ← Zurück
              </button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}
              style={{ padding: '20px', maxWidth: '448px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', marginTop: '8px' }}
              >
                <svg style={{ width: '28px', height: '28px', color: '#fff' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0F172A', marginBottom: '6px' }}>Auftrag erteilt!</p>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', lineHeight: 1.5, maxWidth: '288px', fontFamily: 'Inter, system-ui, sans-serif' }}>{DEMO.freelancer} wurde benachrichtigt und beginnt mit der Arbeit.</p>
              <div style={{ width: '100%', border: '1px solid #F1F5F9', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F9FAFB' }}>
                  <p style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Betrag in Escrow</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>{DEMO.price}</p>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F9FAFB' }}>
                  <p style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Freigabe</p>
                  <p style={{ fontSize: '12px', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>Nach deiner Abnahme</p>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Referenz</p>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0F172A' }}>#PT-{DEMO_CODE}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '12px', padding: '12px', width: '100%', marginBottom: '20px', textAlign: 'left' }}>
                <svg style={{ width: '16px', height: '16px', color: '#16A34A', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p style={{ fontSize: '12px', color: '#166534', lineHeight: 1.5, fontFamily: 'Inter, system-ui, sans-serif' }}>Dein Geld liegt sicher bei Pitchsite und wird erst nach deiner Abnahme an {DEMO.freelancer} überwiesen.</p>
              </div>
              <button
                onClick={onClose}
                style={{ fontSize: '14px', color: '#1D4ED8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Zurück zur Vorschau
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function DemoUpload() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [sourceType, setSourceType] = useState<'file' | 'figma'>('file')
  const [figmaInput, setFigmaInput] = useState('')
  const [figmaFocused, setFigmaFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [showPayment, setShowPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState<PayStep>('offer')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [commentMode, setCommentMode] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const iframeScrollRef = useRef({ x: 0, y: 0 })
  const commentsRef = useRef<Comment[]>([])
  const pinRefs = useRef(new Map<string, HTMLDivElement>())

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.html') && !name.endsWith('.zip')) {
      setPhase({ kind: 'error', message: 'Nur .html und .zip Dateien werden unterstützt.' }); return
    }
    setPhase({ kind: 'processing' })
    try {
      const src = await processFile(file)
      setPhase({ kind: 'rendering', filename: file.name, src })
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : 'Unbekannter Fehler.' })
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [handleFile])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''
  }, [handleFile])

  const handleFigmaSubmit = useCallback(() => {
    const url = figmaInput.trim()
    if (!isFigmaUrl(url)) {
      setPhase({ kind: 'error', message: 'Bitte einen gültigen Figma-Share-Link einfügen (figma.com/design/… oder figma.com/proto/…).' })
      return
    }
    setPhase({ kind: 'rendering', filename: 'Figma-Design', src: toFigmaEmbedUrl(url) })
  }, [figmaInput])

  const switchSource = useCallback((type: 'file' | 'figma') => {
    revokeAll()
    setPhase({ kind: 'idle' })
    setComments([]); setPendingPin(null); setActiveId(null); setCommentMode(false)
    iframeScrollRef.current = { x: 0, y: 0 }
    setSourceType(type)
    setFigmaInput('')
  }, [])

  const positionPins = useCallback(() => {
    const iw = iframeRef.current?.offsetWidth ?? 760
    const ih = iframeRef.current?.offsetHeight ?? 580
    const { x: scrollX, y: scrollY } = iframeScrollRef.current
    for (const c of commentsRef.current) {
      const el = pinRefs.current.get(c.id)
      if (!el) continue
      const vx = (c.absX - scrollX) / iw * 100
      const vy = (c.absY - scrollY) / ih * 100
      el.style.left = `${vx}%`
      el.style.top = `${vy}%`
      el.style.visibility = vx > -2 && vx < 102 && vy > 0 && vy < 101 ? 'visible' : 'hidden'
    }
  }, [])

  useEffect(() => {
    commentsRef.current = comments
    positionPins()
  }, [comments, positionPins])

  useEffect(() => {
    if (phase.kind !== 'preview') return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    let rafId: number | null = null
    const onScroll = () => {
      iframeScrollRef.current = { x: win.scrollX, y: win.scrollY }
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => { positionPins(); rafId = null })
    }
    win.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      win.removeEventListener('scroll', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [phase.kind, positionPins])

  const reset = useCallback(() => {
    revokeAll()
    setPhase({ kind: 'idle' })
    setComments([]); setPendingPin(null); setActiveId(null); setCommentMode(false)
    iframeScrollRef.current = { x: 0, y: 0 }
  }, [])

  const onIframeLoad = useCallback(() => {
    iframeScrollRef.current = { x: 0, y: 0 }
    positionPins()
    setPhase(s => s.kind === 'rendering' ? { kind: 'preview', filename: s.filename, src: s.src } : s)
  }, [positionPins])

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return
    if ((e.target as HTMLElement) !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    const viewX = ((e.clientX - r.left) / r.width) * 100
    const viewY = ((e.clientY - r.top) / r.height) * 100
    const win = iframeRef.current?.contentWindow
    const scrollX = win?.scrollX ?? 0
    const scrollY = win?.scrollY ?? 0
    const absX = (viewX / 100) * r.width + scrollX
    const absY = (viewY / 100) * r.height + scrollY
    setPendingPin({ viewX, viewY, absX, absY })
    setActiveId(null)
  }, [commentMode])

  const addComment = useCallback((text: string) => {
    if (!pendingPin) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setComments(cs => [...cs, { id, absX: pendingPin.absX, absY: pendingPin.absY, text, resolved: false, createdAt: Date.now() }])
    setActiveId(id); setPendingPin(null)
  }, [pendingPin])

  const resolveComment = useCallback((id: string) => {
    setComments(cs => cs.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c))
  }, [])

  const deleteComment = useCallback((id: string) => {
    setComments(cs => cs.filter(c => c.id !== id))
    setActiveId(a => a === id ? null : a)
  }, [])

  const isDragging = phase.kind === 'dragging'

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE_OUT }}>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D4ED8', marginBottom: '16px', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Probier es aus
          </span>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#0F172A', lineHeight: 1.25, marginBottom: '16px', maxWidth: '576px' }}>
            Lad deinen Entwurf hoch. Sieh was dein Kunde sieht.
          </h2>
          <p style={{ color: '#64748B', fontSize: '16px', lineHeight: 1.625, maxWidth: '576px', marginBottom: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Das ist eine Live-Vorschau davon, wie dein Kunde deinen Entwurf auf Pitchsite sieht — inklusive Kommentarfunktion und Zahlungsflow. Lad eine eigene Datei hoch um es auszuprobieren: HTML, ZIP, Webflow-Export oder Figma-Link.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(100,116,139,0.7)', lineHeight: 1.625, maxWidth: '576px', marginBottom: '32px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <svg style={{ width: '14px', height: '14px', color: 'rgba(100,116,139,0.5)', flexShrink: 0, marginTop: '2px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Alles bleibt lokal in deinem Browser — die Datei wird nicht hochgeladen und ist für niemanden außer dir erreichbar. Kein Link, den Dritte öffnen könnten.</span>
          </p>

          {/* Source type tabs */}
          <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#F3F4F6', borderRadius: '12px', width: 'fit-content', marginBottom: '32px' }}>
            {(['file', 'figma'] as const).map(type => (
              <button key={type} onClick={() => switchSource(type)}
                style={{
                  padding: '6px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none',
                  background: sourceType === type ? '#fff' : 'transparent',
                  color: sourceType === type ? '#0F172A' : '#64748B',
                  boxShadow: sourceType === type ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  cursor: 'pointer', transition: 'all 150ms ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {type === 'file' ? 'Datei / ZIP' : 'Figma-Link'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Browser frame */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

          {/* Chrome bar */}
          <div style={{ background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F87171' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FACC15' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: '6px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E5E7EB' }}>
              {(phase.kind === 'rendering' || phase.kind === 'processing') && (
                <div style={{ width: '12px', height: '12px', border: '1.5px solid #1D4ED8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(phase.kind === 'rendering' || phase.kind === 'preview') ? phase.filename : 'pitchsite.de/preview/…'}
              </span>
            </div>
            {(phase.kind === 'rendering' || phase.kind === 'preview') && (
              <button
                onClick={reset}
                style={{ fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F172A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Schließen
              </button>
            )}
          </div>

          {/* Content area */}
          <AnimatePresence mode="wait">

            {/* Figma input */}
            {sourceType === 'figma' && (phase.kind === 'idle' || phase.kind === 'error') && (
              <motion.div key="figma-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}
                style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minHeight: '540px', justifyContent: 'center', background: '#F8FAFC' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '28px', height: '28px', color: '#9CA3AF' }} viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".3"/>
                    <rect x="3" y="13" width="8" height="8" rx="4" fill="currentColor" opacity=".6"/>
                    <rect x="13" y="3" width="8" height="8" rx="4" fill="currentColor" opacity=".6"/>
                    <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".9"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Figma Share-Link einfügen</p>
                <div style={{ width: '100%', maxWidth: '448px', display: 'flex', gap: '8px' }}>
                  <input
                    type="url" value={figmaInput}
                    onChange={e => setFigmaInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleFigmaSubmit() }}
                    onFocus={() => setFigmaFocused(true)}
                    onBlur={() => setFigmaFocused(false)}
                    placeholder="https://www.figma.com/design/…"
                    style={{
                      flex: 1, fontSize: '14px', border: `1px solid ${figmaFocused ? '#1D4ED8' : '#E5E7EB'}`,
                      borderRadius: '12px', padding: '10px 16px', outline: 'none',
                      boxShadow: figmaFocused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
                      transition: 'border-color 150ms, box-shadow 150ms',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                  <button
                    onClick={handleFigmaSubmit}
                    style={{
                      background: '#1D4ED8', color: '#fff', fontSize: '14px', fontWeight: 600,
                      padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      flexShrink: 0, transition: 'background 150ms ease',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1E40AF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1D4ED8')}
                  >
                    Öffnen
                  </button>
                </div>
                {phase.kind === 'error' && (
                  <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{phase.message}</p>
                )}
                <p style={{ fontSize: '12px', color: 'rgba(100,116,139,0.7)', fontFamily: 'Inter, system-ui, sans-serif' }}>Design- und Prototype-Links werden unterstützt</p>
              </motion.div>
            )}

            {/* Drop zone */}
            {sourceType === 'file' && (phase.kind === 'idle' || phase.kind === 'dragging') && (
              <motion.div key="drop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}
                style={{
                  minHeight: '540px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: '48px',
                  background: isDragging ? '#EFF6FF' : '#F8FAFC',
                  transition: 'background 200ms ease',
                }}
                onDragOver={e => { e.preventDefault(); setPhase({ kind: 'dragging' }) }}
                onDragLeave={() => setPhase({ kind: 'idle' })}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".html,.zip"
                  style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
                  onChange={onInputChange}
                />
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDragging ? 'rgba(29,78,216,0.1)' : '#F3F4F6',
                  transition: 'background 200ms ease',
                }}>
                  <svg style={{ width: '28px', height: '28px', color: isDragging ? '#1D4ED8' : '#9CA3AF' }}
                    fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px', marginBottom: '8px', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                  {isDragging ? 'Datei loslassen' : 'HTML oder ZIP ablegen'}
                </p>
                <p style={{ color: '#64748B', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  oder <span style={{ color: '#1D4ED8', fontWeight: 500 }}>Datei auswählen</span>
                </p>
                <p style={{ color: 'rgba(100,116,139,0.5)', fontSize: '12px', marginTop: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  .html · .zip · Webflow-Export · Bleibt im Browser
                </p>
              </motion.div>
            )}

            {/* Processing */}
            {phase.kind === 'processing' && (
              <motion.div key="proc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ height: '540px' }}><BrowserSkeleton /></div>
              </motion.div>
            )}

            {/* Browser + Comments */}
            {(phase.kind === 'rendering' || phase.kind === 'preview') && (
              <motion.div key="browser" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>

                <div style={{ position: 'relative', display: 'flex', height: '580px' }}>
                  {/* Preview + overlay */}
                  <div style={{
                    position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden',
                    boxShadow: commentMode ? 'inset 0 0 0 2px rgba(29,78,216,0.2)' : 'none',
                    transition: 'box-shadow 200ms ease',
                  }}>
                    {/* Skeleton overlay while iframe loads */}
                    <AnimatePresence>
                      {phase.kind === 'rendering' && (
                        <motion.div key="sk" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ position: 'absolute', inset: 0, zIndex: 10 }}
                        >
                          <BrowserSkeleton />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <iframe
                      ref={iframeRef}
                      src={phase.src}
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                      sandbox={sourceType === 'figma'
                        ? 'allow-scripts allow-same-origin allow-forms allow-popups'
                        : 'allow-scripts allow-same-origin allow-forms'}
                      title="Entwurfs-Vorschau"
                      onLoad={onIframeLoad}
                    />

                    {/* Annotation overlay */}
                    <div
                      style={{
                        position: 'absolute', inset: 0, zIndex: 20,
                        cursor: commentMode ? 'crosshair' : 'default',
                        pointerEvents: commentMode ? 'auto' : 'none',
                      }}
                      onClick={handleOverlayClick}
                    >
                      <AnimatePresence>
                        {commentMode && !pendingPin && comments.length === 0 && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{
                              position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
                              background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: '11px', fontWeight: 500,
                              padding: '6px 12px', borderRadius: '9999px', pointerEvents: 'none',
                              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            }}>
                            Klick auf beliebige Stelle
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {comments.map((c, i) => (
                          <CommentPin key={c.id} number={i + 1}
                            resolved={c.resolved} active={activeId === c.id}
                            onClick={() => setActiveId(a => a === c.id ? null : c.id)}
                            divRef={(el) => {
                              if (el) {
                                pinRefs.current.set(c.id, el)
                                const iw = iframeRef.current?.offsetWidth ?? 760
                                const ih = iframeRef.current?.offsetHeight ?? 580
                                const { x: scrollX, y: scrollY } = iframeScrollRef.current
                                const vx = (c.absX - scrollX) / iw * 100
                                const vy = (c.absY - scrollY) / ih * 100
                                el.style.left = `${vx}%`
                                el.style.top = `${vy}%`
                                el.style.visibility = vx > -2 && vx < 102 && vy > 0 && vy < 101 ? 'visible' : 'hidden'
                              } else {
                                pinRefs.current.delete(c.id)
                              }
                            }}
                          />
                        ))}
                      </AnimatePresence>

                      <AnimatePresence>
                        {pendingPin && (
                          <>
                            <motion.div key="pending-ring" initial={{ scale: 0 }} animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', zIndex: 20, width: '24px', height: '24px',
                                left: `${pendingPin.viewX}%`, top: `${pendingPin.viewY}%`,
                                transform: 'translateY(-100%)',
                              }}>
                              <div style={{
                                width: '100%', height: '100%', borderRadius: '50% 50% 50% 0',
                                border: '2px solid #1D4ED8', background: 'rgba(29,78,216,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', fontWeight: 700, color: '#1D4ED8',
                                fontFamily: 'Inter, system-ui, sans-serif',
                              }}>
                                {comments.length + 1}
                              </div>
                              <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50% 50% 50% 0',
                                border: '2px solid #1D4ED8', animation: 'ping 1s ease-in-out infinite', opacity: 0.5,
                              }} />
                            </motion.div>
                            <NewCommentCard key="pending-card" x={pendingPin.viewX} y={pendingPin.viewY}
                              index={comments.length + 1} onSubmit={addComment}
                              onCancel={() => setPendingPin(null)} />
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {sidebarCollapsed && (
                        <motion.button key="sidebar-toggle"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.18, ease: EASE_OUT }}
                          onClick={() => setSidebarCollapsed(false)}
                          title="Seitenleiste öffnen"
                          style={{
                            position: 'absolute', bottom: '16px', right: '16px', zIndex: 30,
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'box-shadow 150ms ease, transform 150ms ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.16)'; e.currentTarget.style.transform = 'scale(1.05)' }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <svg style={{ width: '16px', height: '16px', color: '#0F172A' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <CommentSidebar
                    comments={comments} activeId={activeId} commentMode={commentMode}
                    onSelect={id => setActiveId(a => a === id ? null : id)}
                    onResolve={resolveComment} onDelete={deleteComment}
                    onToggleMode={() => { setCommentMode(m => !m); setPendingPin(null) }}
                    onAccept={() => { setPaymentStep('offer'); setShowPayment(true) }}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(c => !c)}
                  />

                  <AnimatePresence>
                    {showPayment && (
                      <PaymentFlow step={paymentStep} onStep={setPaymentStep}
                        onClose={() => { setShowPayment(false); setPaymentStep('offer') }} />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {phase.kind === 'error' && sourceType === 'file' && (
              <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}
                style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minHeight: '540px', justifyContent: 'center', background: '#FEF2F2' }}
              >
                <p style={{ color: '#B91C1C', fontWeight: 500, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>{phase.message}</p>
                <button
                  onClick={reset}
                  style={{ fontSize: '14px', color: '#1D4ED8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Nochmal versuchen
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
