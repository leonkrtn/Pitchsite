'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import JSZip from 'jszip'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

type State =
  | { phase: 'idle' }
  | { phase: 'dragging' }
  | { phase: 'loading' }
  | { phase: 'preview'; html: string; filename: string }
  | { phase: 'error'; message: string }

async function resolveZip(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const files = Object.keys(zip.files)

  // Find index.html (root-level preferred, then any)
  const indexPath =
    files.find((f) => f.toLowerCase() === 'index.html') ||
    files.find((f) => f.toLowerCase().endsWith('/index.html')) ||
    files.find((f) => f.toLowerCase().endsWith('.html'))

  if (!indexPath) throw new Error('Keine index.html im ZIP gefunden.')

  const htmlRaw = await zip.files[indexPath].async('string')
  const baseDir = indexPath.includes('/') ? indexPath.replace(/[^/]+$/, '') : ''

  // Build blob URL map for all non-directory entries
  const blobMap = new Map<string, string>()
  await Promise.all(
    files
      .filter((f) => !zip.files[f].dir)
      .map(async (f) => {
        const data = await zip.files[f].async('arraybuffer')
        const mime = guessMime(f)
        const blob = new Blob([data], { type: mime })
        const relativePath = baseDir ? f.replace(baseDir, '') : f
        blobMap.set(relativePath, URL.createObjectURL(blob))
        blobMap.set(f, URL.createObjectURL(blob))
      })
  )

  // Replace asset references in HTML
  const resolved = htmlRaw.replace(
    /(src|href|url)\s*=\s*["']([^"'#?][^"']*?)["']/gi,
    (match, attr, path) => {
      if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:')) {
        return match
      }
      const blobUrl = blobMap.get(path) || blobMap.get(baseDir + path)
      return blobUrl ? `${attr}="${blobUrl}"` : match
    }
  )

  return resolved
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
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    json: 'application/json',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function processFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    return resolveZip(file)
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsText(file)
  })
}

export function DemoUpload() {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Write HTML into iframe via srcdoc to avoid cross-origin issues
  useEffect(() => {
    if (state.phase === 'preview' && iframeRef.current) {
      iframeRef.current.srcdoc = state.html
    }
  }, [state])

  const handleFile = useCallback(async (file: File) => {
    const isHtml = file.name.toLowerCase().endsWith('.html')
    const isZip = file.name.toLowerCase().endsWith('.zip')
    if (!isHtml && !isZip) {
      setState({ phase: 'error', message: 'Nur .html und .zip Dateien werden unterstützt.' })
      return
    }

    setState({ phase: 'loading' })
    try {
      const html = await processFile(file)
      setState({ phase: 'preview', html, filename: file.name })
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

  const reset = () => setState({ phase: 'idle' })

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
            <strong className="text-ink font-medium">.zip</strong> Datei hochladen —
            dein Entwurf öffnet sich direkt im Browser. Alles bleibt lokal, nichts wird
            hochgeladen.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* IDLE & DRAGGING */}
          {(state.phase === 'idle' || state.phase === 'dragging') && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className={[
                'relative border-2 border-dashed rounded-2xl p-12 sm:p-20 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200',
                state.phase === 'dragging'
                  ? 'border-blue-royal bg-blue-50'
                  : 'border-gray-200 hover:border-blue-royal/60 bg-surface hover:bg-blue-50/30',
              ].join(' ')}
              onDragOver={(e) => { e.preventDefault(); setState({ phase: 'dragging' }) }}
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

              {/* Upload icon */}
              <div className={[
                'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-200',
                state.phase === 'dragging' ? 'bg-blue-royal/10' : 'bg-gray-100',
              ].join(' ')}>
                <svg
                  className={['w-8 h-8 transition-colors duration-200', state.phase === 'dragging' ? 'text-blue-royal' : 'text-gray-400'].join(' ')}
                  fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>

              <p className="font-semibold text-ink text-lg mb-2 text-center">
                {state.phase === 'dragging' ? 'Datei loslassen' : 'HTML oder ZIP hier ablegen'}
              </p>
              <p className="text-muted text-sm text-center">
                oder <span className="text-blue-royal font-medium">Datei auswählen</span>
              </p>
              <p className="text-muted/60 text-xs mt-4 text-center">
                .html · .zip · Bleibt im Browser
              </p>
            </motion.div>
          )}

          {/* LOADING */}
          {state.phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-20 flex flex-col items-center justify-center gap-4 bg-surface"
            >
              <div className="w-10 h-10 border-2 border-blue-royal border-t-transparent rounded-full animate-spin" />
              <p className="text-muted text-sm">Entwurf wird verarbeitet…</p>
            </motion.div>
          )}

          {/* ERROR */}
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

          {/* PREVIEW */}
          {state.phase === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            >
              {/* Browser chrome bar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-xs text-muted font-mono border border-gray-200 truncate">
                  {state.filename}
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Schließen
                </button>
              </div>

              {/* iframe */}
              <div className="relative w-full" style={{ height: '600px' }}>
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0 block"
                  sandbox="allow-scripts allow-same-origin"
                  title="Entwurfs-Vorschau"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
