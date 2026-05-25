'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | { kind: 'idle' }
  | { kind: 'dragging' }
  | { kind: 'processing' }
  | { kind: 'rendering'; filename: string; src: string }
  | { kind: 'preview'; filename: string; src: string }
  | { kind: 'error'; message: string }

interface Comment {
  id: string
  absX: number   // absolute pixel X in iframe document (scrollX-adjusted)
  absY: number   // absolute pixel Y in iframe document (scrollY-adjusted)
  text: string
  resolved: boolean
  createdAt: number
}

interface PendingPin {
  viewX: number  // % of overlay width at click time (for displaying the card)
  viewY: number  // % of overlay height at click time
  absX: number   // absolute pixel X in iframe document
  absY: number   // absolute pixel Y in iframe document
}

// ── Figma ─────────────────────────────────────────────────────────────────────

function isFigmaUrl(url: string): boolean {
  return /^https:\/\/(www\.)?figma\.com\/(file|design|proto)\//.test(url)
}

function toFigmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
}

// ── Blob registry ─────────────────────────────────────────────────────────────

const blobRegistry: string[] = []
function trackBlob(content: BlobPart, mime: string): string {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  blobRegistry.push(url)
  return url
}
function revokeAll() { blobRegistry.splice(0).forEach(URL.revokeObjectURL) }

// ── MIME ──────────────────────────────────────────────────────────────────────

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

// ── ZIP resolution ─────────────────────────────────────────────────────────────

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.6) 50%,transparent 100%)' }} />
    </div>
  )
}

function BrowserSkeleton() {
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="h-14 border-b border-gray-100 flex items-center px-6 gap-6 shrink-0">
        <Shimmer className="w-24 h-4" /><div className="flex-1" />
        <Shimmer className="w-14 h-3.5" /><Shimmer className="w-14 h-3.5" /><Shimmer className="w-24 h-8 rounded-lg" />
      </div>
      <div className="px-10 pt-14 pb-10 max-w-2xl">
        <Shimmer className="w-16 h-2.5 mb-5" />
        <Shimmer className="w-80 h-7 mb-3" /><Shimmer className="w-56 h-7 mb-7" />
        <Shimmer className="w-full h-3.5 mb-2" /><Shimmer className="w-5/6 h-3.5 mb-2" /><Shimmer className="w-3/4 h-3.5 mb-9" />
        <Shimmer className="w-36 h-10 rounded-xl" />
      </div>
      <div className="px-10 grid grid-cols-3 gap-4 max-w-3xl">
        {[0,1,2].map(i => (
          <div key={i} className="border border-gray-100 rounded-2xl p-4">
            <Shimmer className="w-9 h-9 rounded-xl mb-3" />
            <Shimmer className="w-3/4 h-3 mb-2" /><Shimmer className="w-full h-2.5 mb-1.5" />
            <Shimmer className="w-5/6 h-2.5 mb-1.5" /><Shimmer className="w-2/3 h-2.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Comment Pin ───────────────────────────────────────────────────────────────

function CommentPin({ number, resolved, active, onClick, divRef }: {
  number: number; resolved: boolean; active: boolean; onClick: () => void
  divRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={divRef} className="absolute z-20" style={{ transform: 'translateY(-100%)' }}>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        onClick={e => { e.stopPropagation(); onClick() }}
        title={`Kommentar ${number}`}
        className={[
          'w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-lg rounded-full rounded-bl-none transition-all duration-150',
          resolved ? 'bg-gray-300 text-gray-500' : active ? 'bg-blue-700 text-white ring-2 ring-white ring-offset-1 ring-offset-blue-700/20 scale-110' : 'bg-blue-royal text-white hover:scale-110 hover:bg-blue-700',
        ].join(' ')}
      >
        {number}
      </motion.button>
    </div>
  )
}

// ── New Comment Card ──────────────────────────────────────────────────────────

function NewCommentCard({ x, y, index, onSubmit, onCancel }: {
  x: number; y: number; index: number; onSubmit: (text: string) => void; onCancel: () => void
}) {
  const [text, setText] = useState('')
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
      className="absolute z-30 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3.5"
      style={cardStyle}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">K</div>
        <span className="text-xs font-semibold text-ink">Dein Kunde</span>
        <span className="text-[10px] text-muted ml-auto tabular-nums">#{index}</span>
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="Kommentar… (⏎ senden)"
        rows={3}
        className="w-full text-sm text-ink placeholder-gray-400 resize-none border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-royal/25 focus:border-blue-royal/60 transition-colors"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={submit} disabled={!text.trim()}
          className="flex-1 bg-blue-royal text-white text-xs font-semibold py-1.5 rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors">
          Senden
        </button>
        <button onClick={onCancel} className="px-2 text-xs text-muted hover:text-ink transition-colors">Esc</button>
      </div>
    </motion.div>
  )
}

// ── Comment Sidebar ───────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const d = Date.now() - ts
  if (d < 5000) return 'Gerade eben'
  if (d < 60000) return `Vor ${Math.floor(d / 1000)}s`
  if (d < 3600000) return `Vor ${Math.floor(d / 60000)} Min`
  return `Vor ${Math.floor(d / 3600000)} Std`
}

function CommentSidebar({ comments, activeId, commentMode, onSelect, onResolve, onDelete, onToggleMode, onAccept }: {
  comments: Comment[]
  activeId: string | null
  commentMode: boolean
  onSelect: (id: string) => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onToggleMode: () => void
  onAccept: () => void
}) {
  const [showResolved, setShowResolved] = useState(false)
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
    <div className="w-[264px] shrink-0 border-l border-gray-200 bg-white flex flex-col">
      {/* Pitchsite client panel */}
      <div className="px-3 pt-3 pb-2.5 border-b border-gray-200 shrink-0 bg-gray-50/60">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-blue-royal shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-[11px] text-muted flex-1 truncate">von <strong className="text-ink font-semibold">{DEMO.freelancer}</strong></span>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 shrink-0">
            <span className="text-[9px] text-muted uppercase tracking-wide">Code</span>
            <span className="text-[10px] font-mono font-bold text-ink">{DEMO_CODE}</span>
          </div>
        </div>
        <button onClick={onAccept}
          className="w-full bg-green-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Angebot annehmen
        </button>
        <p className="text-[9px] text-muted/50 text-center mt-1.5 leading-snug">Demo · So sieht es dein Kunde</p>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
        <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-xs font-semibold text-ink">Kommentare</span>
        {open.length > 0 && (
          <span className="ml-auto bg-blue-royal text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {open.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {comments.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-10 text-center">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-ink mb-1">Noch keine Kommentare</p>
              <p className="text-[11px] text-muted leading-relaxed">Kommentarmodus aktivieren und auf die Vorschau klicken</p>
            </motion.div>
          )}

          {open.map(c => {
            const isActive = activeId === c.id
            return (
              <motion.div key={c.id} ref={isActive ? activeRef : undefined}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => onSelect(c.id)}
                className={['mx-2 my-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                  isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'].join(' ')}
              >
                <div className="flex gap-2.5">
                  <div className={['w-5 h-5 rounded-full rounded-bl-none shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold transition-colors',
                    isActive ? 'bg-blue-royal text-white' : 'bg-blue-royal/10 text-blue-royal'].join(' ')}>
                    {indexOf(c.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-[11px] font-semibold text-ink">Kunde</span>
                      <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-ink leading-relaxed break-words">{c.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={e => { e.stopPropagation(); onResolve(c.id) }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-green-600 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Erledigt
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                        className="text-[10px] font-semibold text-muted hover:text-red-500 transition-colors ml-auto">
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Resolved section */}
        {resolved.length > 0 && (
          <div className="mt-1">
            <button onClick={() => setShowResolved(s => !s)}
              className="w-full flex items-center gap-1.5 px-5 py-2 text-[10px] font-semibold text-muted hover:text-ink uppercase tracking-wider transition-colors">
              <svg className={['w-2.5 h-2.5 transition-transform duration-150', showResolved ? 'rotate-90' : ''].join(' ')}
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
                  className="mx-2 my-0.5 px-3 py-2 rounded-xl cursor-pointer opacity-50 hover:opacity-75 transition-opacity">
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full rounded-bl-none bg-gray-200 shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold text-gray-400">
                      {indexOf(c.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-muted">Kunde</span>
                        <svg className="w-2.5 h-2.5 text-green-500 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="text-xs text-muted line-through break-words leading-relaxed">{c.text}</p>
                      <button onClick={e => { e.stopPropagation(); onResolve(c.id) }}
                        className="text-[10px] font-semibold text-muted hover:text-blue-royal transition-colors mt-1.5">
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
      <div className="p-3 border-t border-gray-100 shrink-0">
        <button onClick={onToggleMode}
          className={['w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
            commentMode ? 'bg-blue-royal text-white shadow-sm' : 'bg-gray-100 text-ink hover:bg-gray-200'].join(' ')}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          {commentMode ? 'Kommentarmodus aktiv' : 'Kommentieren'}
        </button>
        <AnimatePresence>
          {commentMode && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="text-center text-[10px] text-muted mt-1.5 leading-snug">
              Klick auf die Vorschau um einen Pin zu setzen
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Payment Flow ──────────────────────────────────────────────────────────────

type PayStep = 'offer' | 'pay' | 'done'

function PaymentFlow({ step, onStep, onClose }: {
  step: PayStep; onStep: (s: PayStep) => void; onClose: () => void
}) {
  const [sigName, setSigName] = useState('')
  const stepIdx = ['offer', 'pay', 'done'].indexOf(step)
  const labels = ['Angebot', 'Zahlung', 'Bestätigt']

  return (
    <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.25, ease: EASE_OUT }}
      className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <span className="font-display font-bold text-sm text-blue-royal">Pitchsite</span>
        <div className="flex items-center gap-1 ml-auto">
          {labels.map((label, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              <div className="flex items-center gap-1">
                <div className={['w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors',
                  i < stepIdx ? 'bg-green-500 text-white' : i === stepIdx ? 'bg-blue-royal text-white' : 'bg-gray-100 text-gray-400'].join(' ')}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className={['text-[10px] font-medium hidden sm:block transition-colors', i <= stepIdx ? 'text-ink' : 'text-muted'].join(' ')}>{label}</span>
              </div>
            </div>
          ))}
        </div>
        {step !== 'done' && (
          <button onClick={onClose} className="ml-2 text-muted hover:text-ink transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {step === 'offer' && (
            <motion.div key="offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: EASE_OUT }}
              className="px-5 py-5 max-w-md mx-auto">
              <p className="text-[11px] text-muted mb-0.5">Angebot von</p>
              <p className="font-display font-bold text-lg text-ink mb-4">{DEMO.freelancer}</p>
              <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Leistungsumfang</p>
                  <p className="text-sm font-semibold text-ink mb-2">{DEMO.title}</p>
                  <ul className="space-y-1">
                    {DEMO.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                        <svg className="w-3 h-3 text-blue-royal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Lieferdatum</p>
                  <p className="text-sm text-ink">{DEMO.delivery}</p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <p className="text-[10px] text-muted uppercase tracking-wider">Gesamtpreis</p>
                  <p className="font-display font-bold text-lg text-ink">{DEMO.price}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
                <svg className="w-4 h-4 text-blue-royal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-xs text-blue-900/70 leading-relaxed">Dein Geld liegt gesichert bei Pitchsite — und wird erst nach deiner Abnahme freigegeben.</p>
              </div>
              <button onClick={() => onStep('pay')}
                className="w-full bg-blue-royal text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm">
                Auftrag annehmen & zahlen →
              </button>
            </motion.div>
          )}

          {step === 'pay' && (
            <motion.div key="pay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: EASE_OUT }}
              className="px-5 py-5 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display font-bold text-lg text-ink">Zahlung</p>
                <div className="text-right">
                  <p className="text-[10px] text-muted">Betrag</p>
                  <p className="font-bold text-sm text-ink">{DEMO.price}</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3 text-xs text-muted leading-relaxed">
                <p className="font-semibold text-ink mb-1 text-[11px]">Kaufvertrag</p>
                Ich beauftrage {DEMO.freelancer} mit der Erstellung von „{DEMO.title}" ({DEMO.deliverables.length} Leistungspunkte gemäß Angebot) zum Festpreis von {DEMO.price}, Lieferung innerhalb von {DEMO.delivery}. Die Zahlung wird über Pitchsite abgewickelt und erst nach meiner Abnahme freigegeben.
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-ink mb-1">Dein Name (digitale Unterschrift)</label>
                <input type="text" value={sigName} onChange={e => setSigName(e.target.value)}
                  placeholder="Vorname Nachname"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-royal/25 focus:border-blue-royal/60 transition-colors" />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-ink mb-1.5">Zahlungsmethode</label>
                <div className="space-y-1.5 mb-2.5">
                  <div className="border border-blue-royal/40 bg-blue-50/30 rounded-xl px-3 py-2 flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-royal flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-royal" />
                    </div>
                    <span className="text-sm text-ink">Kreditkarte</span>
                    <div className="ml-auto flex gap-1 items-center">
                      <span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">VISA</span>
                      <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400 -ml-1.5" /></div>
                    </div>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    <span className="text-sm text-muted">SEPA-Lastschrift</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <span className="text-sm font-mono text-gray-300 tracking-widest">•••• •••• •••• 4242</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-gray-200 rounded-xl px-3 py-2.5"><span className="text-sm font-mono text-gray-300">12 / 27</span></div>
                    <div className="border border-gray-200 rounded-xl px-3 py-2.5"><span className="text-sm font-mono text-gray-300">•••</span></div>
                  </div>
                </div>
              </div>
              <button onClick={() => onStep('done')}
                className="w-full bg-blue-royal text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {DEMO.price} sicher zahlen
              </button>
              <p className="text-center text-[10px] text-muted mt-1.5">Gesichert durch Stripe · SSL-verschlüsselt</p>
              <button onClick={() => onStep('offer')} className="w-full text-xs text-muted hover:text-ink mt-2 transition-colors py-1">← Zurück</button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}
              className="px-5 py-5 max-w-md mx-auto flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center mb-4 mt-2">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <p className="font-display font-bold text-xl text-ink mb-1.5">Auftrag erteilt!</p>
              <p className="text-sm text-muted mb-5 leading-relaxed max-w-xs">{DEMO.freelancer} wurde benachrichtigt und beginnt mit der Arbeit.</p>
              <div className="w-full border border-gray-100 rounded-2xl overflow-hidden mb-5 text-left">
                <div className="px-4 py-3 flex justify-between border-b border-gray-50">
                  <p className="text-xs text-muted">Betrag in Escrow</p>
                  <p className="text-sm font-bold text-ink">{DEMO.price}</p>
                </div>
                <div className="px-4 py-3 flex justify-between border-b border-gray-50">
                  <p className="text-xs text-muted">Freigabe</p>
                  <p className="text-xs text-ink">Nach deiner Abnahme</p>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <p className="text-xs text-muted">Referenz</p>
                  <p className="text-xs font-mono text-ink">#PT-{DEMO_CODE}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl p-3 w-full mb-5">
                <svg className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-xs text-green-800 leading-relaxed text-left">Dein Geld liegt sicher bei Pitchsite und wird erst nach deiner Abnahme an {DEMO.freelancer} überwiesen.</p>
              </div>
              <button onClick={onClose} className="text-sm text-blue-royal font-semibold hover:underline">Zurück zur Vorschau</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DemoUpload() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [sourceType, setSourceType] = useState<'file' | 'figma'>('file')
  const [figmaInput, setFigmaInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [showPayment, setShowPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState<PayStep>('offer')

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

  // Keep commentsRef in sync and reposition after React commits new pins
  useEffect(() => {
    commentsRef.current = comments
    positionPins()
  }, [comments, positionPins])

  // Track iframe scroll with RAF — direct DOM writes, zero React re-renders
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
    // Convert to absolute document coordinates (px) so pins follow scroll
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
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE_OUT }}>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">Probier es aus</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-4 max-w-xl">
            Lad deinen Entwurf hoch. Sieh was dein Kunde sieht.
          </h2>
          <p className="text-muted text-base leading-relaxed max-w-xl mb-8">
            HTML, ZIP, Webflow-Export oder Figma-Link — dein Entwurf öffnet sich direkt im Browser.
            Alles bleibt lokal, nichts wird hochgeladen.
          </p>

          {/* Source type tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
            {(['file', 'figma'] as const).map(type => (
              <button key={type} onClick={() => switchSource(type)}
                className={['px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150',
                  sourceType === type ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'].join(' ')}>
                {type === 'file' ? 'Datei / ZIP' : 'Figma-Link'}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Figma input ── */}
          {sourceType === 'figma' && (phase.kind === 'idle' || phase.kind === 'error') && (
            <motion.div key="figma-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-12 sm:p-16 flex flex-col items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".3"/>
                  <rect x="3" y="13" width="8" height="8" rx="4" fill="currentColor" opacity=".6"/>
                  <rect x="13" y="3" width="8" height="8" rx="4" fill="currentColor" opacity=".6"/>
                  <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".9"/>
                </svg>
              </div>
              <p className="font-semibold text-ink text-lg">Figma Share-Link einfügen</p>
              <div className="w-full max-w-md flex gap-2">
                <input
                  type="url"
                  value={figmaInput}
                  onChange={e => setFigmaInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFigmaSubmit() }}
                  placeholder="https://www.figma.com/design/…"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-royal/25 focus:border-blue-royal/60 transition-colors"
                />
                <button onClick={handleFigmaSubmit}
                  className="bg-blue-royal text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shrink-0">
                  Öffnen
                </button>
              </div>
              {phase.kind === 'error' && (
                <p className="text-sm text-red-600 font-medium">{phase.message}</p>
              )}
              <p className="text-xs text-muted/70">Design- und Prototype-Links werden unterstützt</p>
            </motion.div>
          )}

          {/* ── Drop zone ── */}
          {sourceType === 'file' && (phase.kind === 'idle' || phase.kind === 'dragging') && (
            <motion.div key="drop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}
              className={['border-2 border-dashed rounded-2xl p-12 sm:p-20 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200',
                isDragging ? 'border-blue-royal bg-blue-50' : 'border-gray-200 hover:border-blue-royal/60 bg-surface hover:bg-blue-50/30'].join(' ')}
              onDragOver={e => { e.preventDefault(); setPhase({ kind: 'dragging' }) }}
              onDragLeave={() => setPhase({ kind: 'idle' })}
              onDrop={onDrop} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".html,.zip" className="sr-only" onChange={onInputChange} />
              <div className={['w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-200',
                isDragging ? 'bg-blue-royal/10' : 'bg-gray-100'].join(' ')}>
                <svg className={['w-7 h-7', isDragging ? 'text-blue-royal' : 'text-gray-400'].join(' ')}
                  fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="font-semibold text-ink text-lg mb-2">{isDragging ? 'Datei loslassen' : 'HTML oder ZIP ablegen'}</p>
              <p className="text-muted text-sm">oder <span className="text-blue-royal font-medium">Datei auswählen</span></p>
              <p className="text-muted/50 text-xs mt-3">.html · .zip · Webflow-Export · Bleibt im Browser</p>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {phase.kind === 'processing' && (
            <motion.div key="proc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 border border-gray-200">
                  <div className="w-3 h-3 border-[1.5px] border-blue-royal border-t-transparent rounded-full animate-spin shrink-0" />
                  <Shimmer className="w-40 h-2.5" />
                </div>
              </div>
              <div className="h-[540px]"><BrowserSkeleton /></div>
            </motion.div>
          )}

          {/* ── Browser + Comments ── */}
          {(phase.kind === 'rendering' || phase.kind === 'preview') && (
            <motion.div key="browser" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

              {/* Chrome bar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 min-w-0 bg-white rounded-md px-3 py-1 flex items-center gap-2 border border-gray-200">
                  {phase.kind === 'rendering' && <div className="w-3 h-3 border-[1.5px] border-blue-royal border-t-transparent rounded-full animate-spin shrink-0" />}
                  <span className="text-xs text-muted font-mono truncate">{phase.filename}</span>
                </div>
                <button onClick={reset} className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Schließen
                </button>
              </div>

              {/* Content row */}
              <div className="relative flex h-[580px]">
                {/* Preview + overlay */}
                <div className={['relative flex-1 min-w-0 overflow-hidden transition-shadow duration-200',
                  commentMode ? 'ring-2 ring-inset ring-blue-royal/20' : ''].join(' ')}>

                  {/* Skeleton overlay while iframe loads */}
                  <AnimatePresence>
                    {phase.kind === 'rendering' && (
                      <motion.div key="sk" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }} className="absolute inset-0 z-10">
                        <BrowserSkeleton />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <iframe ref={iframeRef} src={phase.src} className="w-full h-full border-0 block"
                    sandbox={sourceType === 'figma'
                      ? 'allow-scripts allow-same-origin allow-forms allow-popups'
                      : 'allow-scripts allow-same-origin allow-forms'}
                    title="Entwurfs-Vorschau" onLoad={onIframeLoad} />

                  {/* Annotation overlay */}
                  <div
                    className={['absolute inset-0 z-20', commentMode ? 'cursor-crosshair' : 'pointer-events-none'].join(' ')}
                    onClick={handleOverlayClick}
                  >
                    {/* Comment mode hint */}
                    <AnimatePresence>
                      {commentMode && !pendingPin && comments.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="absolute top-3 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-[11px] font-medium px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-sm">
                          Klick auf beliebige Stelle
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Existing pins — positioned via direct DOM writes for zero-lag scroll tracking */}
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

                    {/* Pending pin + input (uses viewport coords from click time) */}
                    <AnimatePresence>
                      {pendingPin && (
                        <>
                          <motion.div key="pending-ring" initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute z-20 w-6 h-6 rounded-full rounded-bl-none"
                            style={{ left: `${pendingPin.viewX}%`, top: `${pendingPin.viewY}%`, transform: 'translateY(-100%)' }}>
                            <div className="w-full h-full rounded-full rounded-bl-none border-2 border-blue-royal bg-blue-royal/20 flex items-center justify-center text-[9px] font-bold text-blue-royal">
                              {comments.length + 1}
                            </div>
                            <div className="absolute inset-0 rounded-full rounded-bl-none border-2 border-blue-royal animate-ping opacity-50" />
                          </motion.div>

                          <NewCommentCard key="pending-card" x={pendingPin.viewX} y={pendingPin.viewY}
                            index={comments.length + 1} onSubmit={addComment}
                            onCancel={() => setPendingPin(null)} />
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sidebar */}
                <CommentSidebar
                  comments={comments} activeId={activeId} commentMode={commentMode}
                  onSelect={id => setActiveId(a => a === id ? null : id)}
                  onResolve={resolveComment} onDelete={deleteComment}
                  onToggleMode={() => { setCommentMode(m => !m); setPendingPin(null) }}
                  onAccept={() => { setPaymentStep('offer'); setShowPayment(true) }}
                />

                {/* Payment flow overlay */}
                <AnimatePresence>
                  {showPayment && (
                    <PaymentFlow step={paymentStep} onStep={setPaymentStep}
                      onClose={() => { setShowPayment(false); setPaymentStep('offer') }} />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Error (file mode only — figma errors show inline) ── */}
          {phase.kind === 'error' && sourceType === 'file' && (
            <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}
              className="border-2 border-red-200 rounded-2xl p-12 flex flex-col items-center gap-4 bg-red-50">
              <p className="text-red-700 font-medium text-center">{phase.message}</p>
              <button onClick={reset} className="text-sm text-blue-royal font-semibold hover:underline">Nochmal versuchen</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
