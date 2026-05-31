'use client'

import React, { useState, useRef, useEffect, useCallback, RefObject, CSSProperties } from 'react'
import { Lock, Users, Check, X, Trash2, Code2, ChevronRight } from 'lucide-react'
import { PALETTE } from './annotations'
import type { AnnotationVisibility, Annotation, NewAnnotation } from './annotations'

// ── HELPERS ───────────────────────────────────────────────

type ElMeta = {
  tag: string; classes: string; width: number; height: number
  bg: string | null; text: string
}

type Rect = { left: number; top: number; width: number; height: number }

function elRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function buildPath(el: Element): Element[] {
  const path: Element[] = [el]
  let cur: Element | null = el.parentElement
  while (cur && cur.tagName !== 'HTML') { path.push(cur); cur = cur.parentElement }
  return path
}

function buildSelector(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.tagName !== 'HTML' && cur.tagName !== 'BODY') {
    const tag = cur.tagName.toLowerCase()
    if (cur.id && /^[a-zA-Z_-]/.test(cur.id)) { parts.unshift(`#${cur.id}`); break }
    const p: Element | null = cur.parentElement
    if (p) {
      const same = Array.from(p.children).filter((c: Element) => c.tagName === cur!.tagName)
      parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(cur) + 1})` : tag)
    }
    cur = p
  }
  return parts.join(' > ') || el.tagName.toLowerCase()
}

function getMeta(el: Element, win: Window): ElMeta {
  const r = el.getBoundingClientRect()
  const cs = win.getComputedStyle(el)
  const bg = cs.backgroundColor
  return {
    tag: el.tagName.toLowerCase(),
    classes: Array.from(el.classList).slice(0, 5).join(' '),
    width: Math.round(r.width),
    height: Math.round(r.height),
    bg: bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' ? bg : null,
    text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
  }
}

// ── BREADCRUMB ────────────────────────────────────────────

function BreadcrumbBar({ path, index, onSelect, color }: {
  path: Element[]; index: number; onSelect: (i: number) => void; color: string
}) {
  const reversed = path.slice().reverse()
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: 14, right: 14,
      display: 'flex', alignItems: 'center', gap: '2px',
      background: 'rgba(15,23,42,.9)', borderRadius: '8px',
      padding: '6px 10px', backdropFilter: 'blur(6px)',
      pointerEvents: 'auto', overflow: 'hidden', zIndex: 25,
    }}>
      {reversed.map((el, i) => {
        const origIdx = path.length - 1 - i
        const active = origIdx === index
        const label = el.tagName.toLowerCase()
          + (el.id ? `#${el.id}` : '')
          + (!el.id && el.classList[0] ? `.${el.classList[0]}` : '')
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={9} color="rgba(255,255,255,.3)" style={{ flexShrink: 0 }} />}
            <button
              onClick={e => { e.stopPropagation(); onSelect(origIdx) }}
              style={{
                background: active ? color : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,.55)',
                border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px',
                fontSize: '11px', fontFamily: '"Geist Mono", monospace',
                fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >{label}</button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── ELEMENT EDITOR POPOVER ────────────────────────────────

function ElementEditor({ rect, meta, selector, description, setDescription, color, visibility,
  setVisibility, onSave, onCancel, locale }: {
  rect: Rect; meta: ElMeta; selector: string
  description: string; setDescription: (d: string) => void
  color: string; visibility: AnnotationVisibility; setVisibility: (v: AnnotationVisibility) => void
  onSave: () => void; onCancel: () => void; locale: string
}) {
  const isDE = locale !== 'en'
  const flipX = rect.left + rect.width + 280 > 1280
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: flipX ? Math.max(0, rect.left - 272) : rect.left + rect.width + 8,
        top: Math.max(8, rect.top),
        width: '264px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
        padding: '14px', boxShadow: '0 16px 48px rgba(0,0,0,.18)', zIndex: 60,
        pointerEvents: 'auto', animation: 'dropIn 150ms ease-out',
      }}
    >
      {/* Meta chip */}
      <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: '8px' }}>
        <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: '11px', color: color, fontWeight: 700, marginBottom: '3px' }}>
          {meta.tag}{meta.classes ? ` .${meta.classes.split(' ')[0]}` : ''}
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
          <span>{meta.width}×{meta.height}px</span>
          {meta.bg && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: meta.bg, border: '1px solid #E2E8F0', flexShrink: 0 }} />
            BG
          </span>}
        </div>
        {meta.text && <div style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>„{meta.text}"</div>}
      </div>

      <textarea
        autoFocus
        value={description}
        onChange={e => setDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave() }}
        placeholder={isDE ? 'Beschreibung / Notiz…' : 'Description / note…'}
        style={{
          width: '100%', minHeight: '60px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
          padding: '8px 10px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
          color: '#0F172A', resize: 'none', outline: 'none', marginBottom: '10px',
          lineHeight: 1.45, boxSizing: 'border-box', transition: 'border-color 150ms',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = color)}
        onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
      />

      {/* Visibility */}
      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '7px', padding: '2px', gap: '2px', marginBottom: '10px' }}>
        {(['private', 'shared'] as const).map(v => {
          const active = visibility === v
          const Icon = v === 'private' ? Lock : Users
          return (
            <button key={v} onClick={() => setVisibility(v)} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 0',
              borderRadius: '5px', border: 'none', cursor: 'pointer', justifyContent: 'center',
              background: active ? '#fff' : 'transparent',
              color: active ? (v === 'shared' ? '#1D4ED8' : '#0F172A') : '#94A3B8',
              fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none', transition: 'all 150ms',
            }}>
              <Icon size={11} />{v === 'private' ? (isDE ? 'Privat' : 'Private') : (isDE ? 'Geteilt' : 'Shared')}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={onSave} style={{
          flex: 1, height: '34px', background: color, color: '#fff', border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          transition: 'opacity 150ms',
        }} onMouseEnter={e => (e.currentTarget.style.opacity = '.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          <Check size={14} />{isDE ? 'Speichern' : 'Save'}
        </button>
        <button onClick={onCancel} style={{
          width: '34px', height: '34px', background: '#F8FAFC', color: '#64748B',
          border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={14} /></button>
      </div>
      <div style={{ marginTop: '7px', fontSize: '10px', fontFamily: 'Inter, sans-serif', color: '#CBD5E1', textAlign: 'center' }}>
        {isDE ? '⌘ + Enter zum Speichern · Esc zum Schließen' : '⌘ + Enter to save · Esc to close'}
      </div>
    </div>
  )
}

// ── ELEMENT ANNOTATION OVERLAY (viewer + pitch read/edit) ─

export function ElementAnnotationOverlay({ annotations, iframeRef, editable, locale, onDelete }: {
  annotations: Annotation[]
  iframeRef: RefObject<HTMLIFrameElement | null>
  editable: boolean
  locale: string
  onDelete?: (id: string) => void
}) {
  const [rects, setRects] = useState<Record<string, Rect>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const isDE = locale !== 'en'

  const resolve = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    const next: Record<string, Rect> = {}
    for (const ann of annotations) {
      if (ann.kind !== 'element' || !ann.selector) continue
      try {
        const el = doc.querySelector(ann.selector as string)
        if (el) { const r = el.getBoundingClientRect(); next[ann.id] = { left: r.left, top: r.top, width: r.width, height: r.height } }
      } catch {}
    }
    setRects(next)
  }, [annotations, iframeRef])

  useEffect(() => { resolve() }, [resolve])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onLoad = () => { resolve() }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [iframeRef, resolve])

  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    const onScroll = () => resolve()
    win.addEventListener('scroll', onScroll, { passive: true })
    return () => win.removeEventListener('scroll', onScroll)
  }, [iframeRef, resolve])

  const elAnns = annotations.filter(a => a.kind === 'element')
  if (elAnns.length === 0) return null

  return (
    <>
      {elAnns.map(ann => {
        const r = rects[ann.id]
        if (!r || r.width === 0) return null
        const c = ann.color || '#1D4ED8'
        const isSel = selected === ann.id
        return (
          <div key={ann.id} onClick={e => { e.stopPropagation(); setSelected(isSel ? null : ann.id) }} style={{ pointerEvents: 'auto' }}>
            {/* Border highlight */}
            <div style={{
              position: 'absolute', left: r.left, top: r.top, width: r.width, height: r.height,
              border: `2px solid ${c}`, background: isSel ? `${c}20` : `${c}12`,
              pointerEvents: 'none', borderRadius: '2px', boxSizing: 'border-box',
              transition: 'background 150ms',
            }} />
            {/* Badge */}
            <div style={{
              position: 'absolute', left: r.left + r.width - 9, top: r.top - 9,
              width: '20px', height: '20px', borderRadius: '50%', background: c,
              border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 16,
            }}>
              <Code2 size={9} color="#fff" />
            </div>
            {/* Popover */}
            {isSel && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: r.left + r.width + 280 > 1280 ? Math.max(0, r.left - 268) : r.left + r.width + 8,
                  top: Math.max(8, r.top),
                  width: '258px', background: '#fff', border: '1px solid #E2E8F0',
                  borderRadius: '12px', padding: '14px',
                  boxShadow: '0 12px 40px rgba(0,0,0,.18)', zIndex: 60,
                  pointerEvents: 'auto', animation: 'dropIn 150ms ease-out',
                }}
              >
                {/* meta chip */}
                <div style={{ marginBottom: '10px', padding: '7px 9px', background: '#F8FAFC', border: '1px solid #EEF2F6', borderRadius: '7px' }}>
                  <div style={{ fontFamily: '"Geist Mono", monospace', fontSize: '11px', color: c, fontWeight: 700, marginBottom: '2px' }}>
                    {(ann.meta as any)?.tag || 'element'}
                    {(ann.meta as any)?.classes ? ` .${((ann.meta as any).classes as string).split(' ')[0]}` : ''}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
                    {(ann.meta as any)?.width}×{(ann.meta as any)?.height}px
                  </div>
                </div>
                {ann.text && <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5, marginBottom: '10px' }}>{ann.text}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: editable ? '10px' : 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'Inter, sans-serif', color: ann.visibility === 'shared' ? '#1D4ED8' : '#94A3B8' }}>
                    {ann.visibility === 'shared' ? <Users size={10} /> : <Lock size={10} />}
                    {ann.visibility === 'shared' ? (isDE ? 'Geteilt' : 'Shared') : (isDE ? 'Privat' : 'Private')}
                  </span>
                </div>
                {editable && onDelete && (
                  <button onClick={() => { onDelete(ann.id); setSelected(null) }} style={{
                    display: 'flex', alignItems: 'center', gap: '5px', background: '#FEF2F2',
                    color: '#DC2626', border: '1px solid #FECACA', borderRadius: '7px',
                    padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif',
                  }}>
                    <Trash2 size={12} />{isDE ? 'Löschen' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── MAIN INSPECTOR ────────────────────────────────────────

export function ElementInspector({ iframeRef, containerRef, color, visibility, setVisibility,
  locale, onCreate, onDelete, existingAnnotations }: {
  iframeRef: RefObject<HTMLIFrameElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  color: string
  visibility: AnnotationVisibility
  setVisibility: (v: AnnotationVisibility) => void
  locale: string
  onCreate: (a: NewAnnotation) => void
  onDelete: (id: string) => void
  existingAnnotations: Annotation[]
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isDE = locale !== 'en'
  const [ready, setReady] = useState(false)
  const [hoverPath, setHoverPath] = useState<Element[]>([])
  const [hoverIdx, setHoverIdx] = useState(0)
  const [hoverRect, setHoverRect] = useState<Rect | null>(null)
  const [fixed, setFixed] = useState<{ el: Element; selector: string; meta: ElMeta; rect: Rect } | null>(null)
  const [desc, setDesc] = useState('')

  // Wait for iframe DOM
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const check = () => { if (iframe.contentDocument?.readyState !== 'loading') setReady(true) }
    iframe.addEventListener('load', check)
    check()
    return () => iframe.removeEventListener('load', check)
  }, [iframeRef])

  // Recompute fixed/hover rect on iframe scroll
  useEffect(() => {
    if (!ready) return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    const onScroll = () => {
      if (fixed) setFixed(prev => prev ? { ...prev, rect: elRect(prev.el) } : null)
      if (hoverPath.length) {
        const el = hoverPath[hoverIdx]
        if (el) setHoverRect(elRect(el))
      }
    }
    win.addEventListener('scroll', onScroll, { passive: true })
    return () => win.removeEventListener('scroll', onScroll)
  }, [ready, fixed, hoverPath, hoverIdx, iframeRef])

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setFixed(null); setDesc(''); return }
    if (fixed || hoverPath.length === 0) return
    const el = hoverPath[hoverIdx]
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const ni = Math.min(hoverIdx + 1, hoverPath.length - 1)
      setHoverIdx(ni); setHoverRect(elRect(hoverPath[ni]))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const ni = Math.max(hoverIdx - 1, 0)
      setHoverIdx(ni); setHoverRect(elRect(hoverPath[ni]))
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && el) {
      e.preventDefault()
      const parent = el.parentElement; if (!parent) return
      const sibs = Array.from(parent.children)
      const si = sibs.indexOf(el)
      const ni = e.key === 'ArrowLeft' ? Math.max(0, si - 1) : Math.min(sibs.length - 1, si + 1)
      if (sibs[ni] && sibs[ni] !== el) {
        const newPath = buildPath(sibs[ni])
        setHoverPath(newPath); setHoverIdx(0); setHoverRect(elRect(sibs[ni]))
      }
    }
  }, [fixed, hoverPath, hoverIdx])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (fixed) return
    const overlay = overlayRef.current
    const iframe = iframeRef.current
    if (!overlay || !iframe?.contentDocument) return
    const r = overlay.getBoundingClientRect()
    const el = iframe.contentDocument.elementFromPoint(e.clientX - r.left, e.clientY - r.top)
    if (!el || el.tagName === 'HTML' || el.tagName === 'BODY') { setHoverPath([]); setHoverRect(null); return }
    const path = buildPath(el)
    const idx = Math.min(hoverIdx, path.length - 1)
    // Keep current ancestor level if path still contains same ancestor
    const sameParent = hoverPath.length > hoverIdx && path.length > idx &&
      path[idx] === hoverPath[hoverIdx]
    const useIdx = sameParent ? idx : 0
    setHoverPath(path); setHoverIdx(useIdx); setHoverRect(elRect(path[useIdx]))
  }, [fixed, hoverIdx, hoverPath, iframeRef])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (hoverPath.length === 0 || fixed) return
    e.preventDefault()
    const ni = e.deltaY < 0
      ? Math.min(hoverIdx + 1, hoverPath.length - 1)
      : Math.max(hoverIdx - 1, 0)
    setHoverIdx(ni); setHoverRect(elRect(hoverPath[ni]))
  }, [hoverPath, hoverIdx, fixed])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (fixed) { setFixed(null); setDesc(''); return }
    if (hoverPath.length === 0) return
    const el = hoverPath[hoverIdx]
    const win = iframeRef.current?.contentWindow
    if (!el || !win) return
    setFixed({ el, selector: buildSelector(el), meta: getMeta(el, win), rect: elRect(el) })
    setDesc('')
  }, [fixed, hoverPath, hoverIdx, iframeRef])

  const handleSave = () => {
    if (!fixed || !containerRef.current) return
    const cw = containerRef.current.clientWidth || 1280
    const ch = containerRef.current.clientHeight || 800
    onCreate({
      kind: 'element',
      visibility, color,
      x_pct: (fixed.rect.left / cw) * 100,
      y_pct: (fixed.rect.top / ch) * 100,
      w_pct: (fixed.rect.width / cw) * 100,
      h_pct: (fixed.rect.height / ch) * 100,
      text: desc.trim() || null,
      selector: fixed.selector,
      meta: { ...fixed.meta } as Record<string, unknown>,
    })
    setFixed(null); setDesc('')
  }

  const activeRect = fixed ? fixed.rect : hoverRect

  return (
    <div
      ref={overlayRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (!fixed) { setHoverPath([]); setHoverRect(null) } }}
      onWheel={handleWheel}
      onClick={handleClick}
      style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: fixed ? 'default' : 'crosshair' }}
    >
      {/* Highlight box */}
      {activeRect && activeRect.width > 0 && (
        <div style={{
          position: 'absolute',
          left: activeRect.left, top: activeRect.top,
          width: activeRect.width, height: activeRect.height,
          border: `2px solid ${color}`,
          background: fixed ? `${color}22` : `${color}16`,
          pointerEvents: 'none', borderRadius: '2px', boxSizing: 'border-box',
          transition: fixed ? 'none' : 'left 60ms ease, top 60ms ease, width 60ms ease, height 60ms ease',
        }} />
      )}

      {/* Hover meta label */}
      {hoverRect && !fixed && hoverPath.length > 0 && (() => {
        const el = hoverPath[hoverIdx]
        const tag = el.tagName.toLowerCase()
        const id = el.id ? `#${el.id}` : ''
        const cls = !el.id && el.classList[0] ? `.${el.classList[0]}` : ''
        const w = Math.round(el.getBoundingClientRect().width)
        const h = Math.round(el.getBoundingClientRect().height)
        return (
          <div style={{
            position: 'absolute',
            left: hoverRect.left,
            top: Math.max(0, hoverRect.top - 24),
            background: color, color: '#fff',
            fontSize: '11px', fontFamily: '"Geist Mono", monospace',
            padding: '3px 8px', borderRadius: '5px', pointerEvents: 'none',
            whiteSpace: 'nowrap', lineHeight: 1.4,
          }}>
            {tag}{id}{cls} {w}×{h}
          </div>
        )
      })()}

      {/* Editor */}
      {fixed && (
        <ElementEditor
          rect={fixed.rect} meta={fixed.meta} selector={fixed.selector}
          description={desc} setDescription={setDesc}
          color={color} visibility={visibility} setVisibility={setVisibility}
          onSave={handleSave} onCancel={() => { setFixed(null); setDesc('') }}
          locale={locale}
        />
      )}

      {/* Existing element annotations */}
      <ElementAnnotationOverlay
        annotations={existingAnnotations}
        iframeRef={iframeRef}
        editable
        locale={locale}
        onDelete={onDelete}
      />

      {/* Breadcrumb */}
      {hoverPath.length > 0 && !fixed && (
        <BreadcrumbBar
          path={hoverPath} index={hoverIdx}
          onSelect={i => { setHoverIdx(i); setHoverRect(elRect(hoverPath[i])) }}
          color={color}
        />
      )}

      {/* Hint when idle */}
      {hoverPath.length === 0 && !fixed && ready && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,.88)', color: '#fff', padding: '8px 16px',
          borderRadius: '8px', fontSize: '12px', fontFamily: 'Inter, sans-serif',
          pointerEvents: 'none', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 16px rgba(0,0,0,.3)',
        }}>
          {isDE
            ? '↕ Hovern · Mausrad / ↑↓ = Eltern/Kind · ←→ = Geschwister · Klick = beschreiben'
            : '↕ Hover · Scroll / ↑↓ = parent/child · ←→ = sibling · Click = annotate'}
        </div>
      )}

      {/* Not ready overlay */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,.6)' }}>
          <div style={{ color: '#94A3B8', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            {isDE ? 'Design lädt…' : 'Loading design…'}
          </div>
        </div>
      )}
    </div>
  )
}
