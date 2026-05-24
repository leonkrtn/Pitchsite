'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import JSZip from 'jszip'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

type State =
  | { phase: 'idle' }
  | { phase: 'dragging' }
  | { phase: 'processing' }
  | { phase: 'rendering'; filename: string; src: string }
  | { phase: 'preview'; filename: string; src: string }
  | { phase: 'error'; message: string }

// Track all created blob URLs so they can be revoked on reset
const blobRegistry: string[] = []

function trackBlob(content: BlobPart, mime: string): string {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  blobRegistry.push(url)
  return url
}

function revokeAll() {
  blobRegistry.splice(0).forEach((u) => URL.revokeObjectURL(u))
}

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    html: 'text/html',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    json: 'application/json',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function resolveZip(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.keys(zip.files)

  const indexPath =
    entries.find((f) => f.toLowerCase() === 'index.html') ||
    entries.find((f) => !zip.files[f].dir && f.toLowerCase().endsWith('/index.html')) ||
    entries.find((f) => !zip.files[f].dir && f.toLowerCase().endsWith('.html'))

  if (!indexPath) throw new Error('Keine index.html im ZIP gefunden.')

  const baseDir = indexPath.includes('/') ? indexPath.replace(/[^/]+$/, '') : ''
  const htmlRaw = await zip.files[indexPath].async('string')

  // Build blob URL map for every non-directory entry
  const blobMap = new Map<string, string>()
  await Promise.all(
    entries
      .filter((f) => !zip.files[f].dir)
      .map(async (f) => {
        const buf = await zip.files[f].async('arraybuffer')
        const url = trackBlob(buf, guessMime(f))
        // Register both the full path and the path relative to index.html's directory
        blobMap.set(f, url)
        if (baseDir && f.startsWith(baseDir)) blobMap.set(f.slice(baseDir.length), url)
      })
  )

  const resolve = (path: string) =>
    blobMap.get(path) ?? blobMap.get(baseDir + path) ?? null

  // Replace src="…" / href="…" attributes
  const patched = htmlRaw
    .replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (match, attr, q, path) => {
      if (/^(https?:|\/\/|data:|blob:|#|mailto:)/.test(path)) return match
      const u = resolve(path)
      return u ? `${attr}=${q}${u}${q}` : match
    })
    // Replace url(…) in inline styles
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, q, path) => {
      if (/^(https?:|\/\/|data:|blob:)/.test(path)) return match
      const u = resolve(path)
      return u ? `url(${q}${u}${q})` : match
    })

  return patched
}

async function processFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    const html = await resolveZip(file)
    return trackBlob(html, 'text/html')
  }
  const text = await file.text()
  return trackBlob(text, 'text/html')
}

// ── Skeleton screen ────────────────────────────────────────────────────────────

function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}

function BrowserSkeleton() {
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Skeleton nav */}
      <div className="h-14 border-b border-gray-100 flex items-center px-6 gap-6 shrink-0">
        <Shimmer className="w-24 h-4" />
        <div className="flex-1" />
        <Shimmer className="w-14 h-3.5" />
        <Shimmer className="w-14 h-3.5" />
        <Shimmer className="w-24 h-8 rounded-lg" />
      </div>

      {/* Skeleton hero */}
      <div className="px-10 pt-16 pb-12 max-w-2xl">
        <Shimmer className="w-16 h-2.5 mb-5" />
        <Shimmer className="w-80 h-8 mb-3" />
        <Shimmer className="w-56 h-8 mb-8" />
        <Shimmer className="w-full h-3.5 mb-2" />
        <Shimmer className="w-5/6 h-3.5 mb-2" />
        <Shimmer className="w-3/4 h-3.5 mb-10" />
        <Shimmer className="w-36 h-11 rounded-xl" />
      </div>

      {/* Skeleton cards */}
      <div className="px-10 grid grid-cols-3 gap-5 max-w-3xl">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-gray-100 rounded-2xl p-5">
            <Shimmer className="w-10 h-10 rounded-xl mb-4" />
            <Shimmer className="w-3/4 h-3.5 mb-2" />
            <Shimmer className="w-full h-3 mb-1.5" />
            <Shimmer className="w-5/6 h-3 mb-1.5" />
            <Shimmer className="w-2/3 h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Browser chrome shared component ──────────────────────────────────────────

function BrowserChrome({
  filename,
  loading,
  onClose,
}: {
  filename: string
  loading: boolean
  onClose: () => void
}) {
  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="flex gap-1.5 shrink-0">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 min-w-0 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 border border-gray-200">
        {loading && (
          <div className="w-3 h-3 border-[1.5px] border-blue-royal border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        <span className="text-xs text-muted font-mono truncate">{filename}</span>
      </div>
      <button
        onClick={onClose}
        className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1.5 shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Schließen
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DemoUpload() {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.html') && !name.endsWith('.zip')) {
      setState({ phase: 'error', message: 'Nur .html und .zip Dateien werden unterstützt.' })
      return
    }
    setState({ phase: 'processing' })
    try {
      const src = await processFile(file)
      setState({ phase: 'rendering', filename: file.name, src })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Unbekannter Fehler.' })
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  const reset = useCallback(() => {
    revokeAll()
    setState({ phase: 'idle' })
  }, [])

  const onIframeLoad = useCallback(() => {
    setState((s) =>
      s.phase === 'rendering' ? { phase: 'preview', filename: s.filename, src: s.src } : s
    )
  }, [])

  const isDragging = state.phase === 'dragging'

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-royal mb-4 block">
            Probier es aus
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight mb-4 max-w-xl">
            Lad deinen Entwurf hoch. Sieh was dein Kunde sieht.
          </h2>
          <p className="text-muted text-base leading-relaxed max-w-xl mb-12">
            Einfach eine <strong className="text-ink font-medium">.html</strong> oder{' '}
            <strong className="text-ink font-medium">.zip</strong> Datei hochladen — dein Entwurf
            öffnet sich direkt im Browser. Alles bleibt lokal, nichts wird hochgeladen.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Drop zone ── */}
          {(state.phase === 'idle' || state.phase === 'dragging') && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className={[
                'border-2 border-dashed rounded-2xl p-12 sm:p-20 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200',
                isDragging
                  ? 'border-blue-royal bg-blue-50'
                  : 'border-gray-200 hover:border-blue-royal/60 bg-surface hover:bg-blue-50/30',
              ].join(' ')}
              onDragOver={(e) => {
                e.preventDefault()
                setState({ phase: 'dragging' })
              }}
              onDragLeave={() => setState({ phase: 'idle' })}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.zip"
                className="sr-only"
                onChange={onInputChange}
              />
              <div
                className={[
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-200',
                  isDragging ? 'bg-blue-royal/10' : 'bg-gray-100',
                ].join(' ')}
              >
                <svg
                  className={[
                    'w-8 h-8 transition-colors duration-200',
                    isDragging ? 'text-blue-royal' : 'text-gray-400',
                  ].join(' ')}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="font-semibold text-ink text-lg mb-2 text-center">
                {isDragging ? 'Datei loslassen' : 'HTML oder ZIP hier ablegen'}
              </p>
              <p className="text-muted text-sm text-center">
                oder <span className="text-blue-royal font-medium">Datei auswählen</span>
              </p>
              <p className="text-muted/60 text-xs mt-4 text-center">.html · .zip · Bleibt im Browser</p>
            </motion.div>
          )}

          {/* ── Processing skeleton (file being read/extracted) ── */}
          {state.phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 border border-gray-200">
                  <div className="w-3 h-3 border-[1.5px] border-blue-royal border-t-transparent rounded-full animate-spin shrink-0" />
                  <Shimmer className="w-40 h-2.5" />
                </div>
              </div>
              <div className="h-[600px]">
                <BrowserSkeleton />
              </div>
            </motion.div>
          )}

          {/* ── Browser with iframe (rendering + preview share the same key so iframe doesn't remount) ── */}
          {(state.phase === 'rendering' || state.phase === 'preview') && (
            <motion.div
              key="browser"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <BrowserChrome
                filename={state.filename}
                loading={state.phase === 'rendering'}
                onClose={reset}
              />
              <div className="relative h-[600px]">
                {/* Skeleton fades out once iframe fires onLoad */}
                <AnimatePresence>
                  {state.phase === 'rendering' && (
                    <motion.div
                      key="skeleton-overlay"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 z-10"
                    >
                      <BrowserSkeleton />
                    </motion.div>
                  )}
                </AnimatePresence>
                <iframe
                  ref={iframeRef}
                  src={state.src}
                  className="w-full h-full border-0 block"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="Entwurfs-Vorschau"
                  onLoad={onIframeLoad}
                />
              </div>
            </motion.div>
          )}

          {/* ── Error ── */}
          {state.phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="border-2 border-red-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-red-50"
            >
              <p className="text-red-700 font-medium text-center">{state.message}</p>
              <button
                onClick={reset}
                className="text-sm text-blue-royal font-semibold hover:underline"
              >
                Nochmal versuchen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
