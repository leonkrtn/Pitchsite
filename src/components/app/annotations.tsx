'use client'

import { useState, useRef, useEffect, useLayoutEffect, CSSProperties, PointerEvent as RPointerEvent } from 'react'
import {
  MousePointer2, MapPin, Square, PenLine, MessageSquareText,
  Lock, Users, Trash2, Check, X,
} from 'lucide-react'

// ── TYPES ─────────────────────────────────────────────────

export type AnnotationKind = 'pin' | 'box' | 'draw' | 'callout'
export type AnnotationVisibility = 'private' | 'shared'
export type Tool = 'select' | AnnotationKind

export interface Annotation {
  id: string
  kind: AnnotationKind
  visibility: AnnotationVisibility
  x_pct: number
  y_pct: number
  w_pct: number | null
  h_pct: number | null
  path: { x: number; y: number }[] | null
  color: string
  text: string | null
  resolved: boolean
  created_at: string
}

export interface NewAnnotation {
  kind: AnnotationKind
  visibility: AnnotationVisibility
  x_pct: number
  y_pct: number
  w_pct?: number | null
  h_pct?: number | null
  path?: { x: number; y: number }[] | null
  color: string
  text?: string | null
}

// ── CONSTANTS ─────────────────────────────────────────────

export const PALETTE = ['#1D4ED8', '#D97706', '#DC2626', '#16A34A', '#7C3AED', '#0F172A']

export const TOOLS: { id: Tool; icon: typeof MapPin; de: string; en: string }[] = [
  { id: 'select', icon: MousePointer2, de: 'Auswählen', en: 'Select' },
  { id: 'pin', icon: MapPin, de: 'Kommentar', en: 'Comment' },
  { id: 'box', icon: Square, de: 'Hervorheben', en: 'Highlight' },
  { id: 'draw', icon: PenLine, de: 'Zeichnen', en: 'Draw' },
  { id: 'callout', icon: MessageSquareText, de: 'Beschreibung', en: 'Describe' },
]

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

// ── TOOLBAR ───────────────────────────────────────────────

export function AnnotationToolbar({
  tool, setTool, color, setColor, visibility, setVisibility, locale, compact = false,
}: {
  tool: Tool; setTool: (t: Tool) => void
  color: string; setColor: (c: string) => void
  visibility: AnnotationVisibility; setVisibility: (v: AnnotationVisibility) => void
  locale: string; compact?: boolean
}) {
  const isDE = locale !== 'en'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '6px' : '10px', flexWrap: 'wrap' }}>
      {/* Tools */}
      <div style={{ display: 'flex', gap: '2px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '3px' }}>
        {TOOLS.map(({ id, icon: Icon, de, en }) => {
          const active = tool === id
          return (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={isDE ? de : en}
              style={{
                width: '34px', height: '34px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: active ? '#1D4ED8' : 'transparent',
                color: active ? '#fff' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms ease, transform 120ms ease',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1F5F9' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Icon size={17} strokeWidth={2.1} />
            </button>
          )
        })}
      </div>

      {/* Colors */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        {PALETTE.map(c => {
          const active = color === c
          return (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              style={{
                width: active ? '22px' : '18px', height: active ? '22px' : '18px',
                borderRadius: '50%', background: c, cursor: 'pointer',
                border: active ? '2px solid #fff' : '2px solid transparent',
                boxShadow: active ? `0 0 0 2px ${c}` : '0 0 0 1px rgba(0,0,0,.08)',
                transition: 'all 150ms ease', padding: 0, flexShrink: 0,
              }}
            />
          )
        })}
      </div>

      {/* Visibility */}
      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
        {(['private', 'shared'] as const).map(v => {
          const active = visibility === v
          const Icon = v === 'private' ? Lock : Users
          const label = v === 'private' ? (isDE ? 'Privat' : 'Private') : (isDE ? 'Geteilt' : 'Shared')
          return (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              title={v === 'private' ? (isDE ? 'Nur für dich sichtbar' : 'Only visible to you') : (isDE ? 'Für den Kunden sichtbar' : 'Visible to the client')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: active ? '#fff' : 'transparent',
                color: active ? (v === 'shared' ? '#1D4ED8' : '#0F172A') : '#64748B',
                boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                transition: 'all 150ms ease',
              }}
            >
              <Icon size={13} /> {!compact && label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── EDITOR POPOVER ────────────────────────────────────────

function EditorPopover({
  ann, locale, onChangeText, onChangeColor, onChangeVisibility, onDelete, onClose, readOnly,
}: {
  ann: Annotation; locale: string
  onChangeText: (t: string) => void
  onChangeColor: (c: string) => void
  onChangeVisibility: (v: AnnotationVisibility) => void
  onDelete: () => void
  onClose: () => void
  readOnly?: boolean
}) {
  const isDE = locale !== 'en'
  const [text, setText] = useState(ann.text ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (!readOnly && ann.kind !== 'draw') ref.current?.focus() }, [])

  // Anchor the popover to the right of the annotation, flipping if near edge
  const flipX = ann.x_pct > 62
  const left = ann.kind === 'box'
    ? `calc(${ann.x_pct + (ann.w_pct ?? 0) / 2}% )`
    : `${ann.x_pct}%`

  if (readOnly) {
    return (
      <div style={popoverShell(ann, flipX)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: text ? '8px' : 0 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: ann.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
            {isDE ? 'Anmerkung vom Designer' : 'Designer note'}
          </span>
        </div>
        {text && <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{text}</div>}
      </div>
    )
  }

  return (
    <div style={popoverShell(ann, flipX)} onPointerDown={e => e.stopPropagation()}>
      {ann.kind !== 'draw' && (
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => text !== (ann.text ?? '') && onChangeText(text)}
          placeholder={isDE ? 'Beschreibung / Notiz…' : 'Description / note…'}
          style={{
            width: '100%', minHeight: '62px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
            padding: '8px 10px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#0F172A',
            resize: 'none', outline: 'none', marginBottom: '10px', lineHeight: 1.45,
          }}
        />
      )}

      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        {PALETTE.map(c => (
          <button key={c} onClick={() => onChangeColor(c)} style={{
            width: '18px', height: '18px', borderRadius: '50%', background: c, cursor: 'pointer', padding: 0,
            border: ann.color === c ? '2px solid #fff' : '2px solid transparent',
            boxShadow: ann.color === c ? `0 0 0 2px ${c}` : '0 0 0 1px rgba(0,0,0,.08)',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '7px', padding: '2px' }}>
          {(['private', 'shared'] as const).map(v => {
            const active = ann.visibility === v
            const Icon = v === 'private' ? Lock : Users
            return (
              <button key={v} onClick={() => onChangeVisibility(v)} style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                background: active ? '#fff' : 'transparent', color: active ? (v === 'shared' ? '#1D4ED8' : '#0F172A') : '#94A3B8',
                fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
              }}>
                <Icon size={11} /> {v === 'private' ? (isDE ? 'Privat' : 'Private') : (isDE ? 'Geteilt' : 'Shared')}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onDelete} title={isDE ? 'Löschen' : 'Delete'} style={iconBtn('#DC2626', '#FEF2F2')}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => { if (text !== (ann.text ?? '')) onChangeText(text); onClose() }} title={isDE ? 'Fertig' : 'Done'} style={iconBtn('#16A34A', '#F0FDF4')}>
            <Check size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function popoverShell(ann: Annotation, flipX: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: `${ann.x_pct}%`,
    top: `${ann.y_pct}%`,
    transform: flipX ? 'translate(calc(-100% - 18px), -8px)' : 'translate(18px, -8px)',
    width: '252px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
    padding: '14px', boxShadow: '0 12px 40px rgba(0,0,0,.16)', zIndex: 60,
    animation: 'dropIn 150ms ease-out',
  }
}

function iconBtn(color: string, bg: string): CSSProperties {
  return {
    width: '30px', height: '30px', borderRadius: '7px', border: 'none', cursor: 'pointer',
    background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}

// ── CANVAS (overlay + interactions) ───────────────────────

export function AnnotationCanvas({
  annotations, editable, tool, color, visibility, selectedId,
  onCreate, onSelect, onUpdate, onDelete, locale,
}: {
  annotations: Annotation[]
  editable: boolean
  tool: Tool
  color: string
  visibility: AnnotationVisibility
  selectedId: string | null
  onCreate: (a: NewAnnotation) => void
  onSelect: (id: string | null) => void
  onUpdate: (id: string, patch: Partial<Annotation>) => void
  onDelete: (id: string) => void
  locale: string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const [liveBox, setLiveBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [livePath, setLivePath] = useState<{ x: number; y: number }[] | null>(null)
  const drawing = useRef<{ active: boolean; start: { x: number; y: number } } | null>(null)

  useLayoutEffect(() => {
    if (!overlayRef.current) return
    const el = overlayRef.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const toPct = (e: RPointerEvent) => {
    const r = overlayRef.current!.getBoundingClientRect()
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
  }

  const capturing = editable && tool !== 'select'

  function onPointerDown(e: RPointerEvent) {
    if (!capturing) return
    e.preventDefault()
    overlayRef.current?.setPointerCapture(e.pointerId)
    const p = toPct(e)
    drawing.current = { active: true, start: p }
    if (tool === 'box') setLiveBox({ x: p.x, y: p.y, w: 0, h: 0 })
    if (tool === 'draw') setLivePath([p])
  }

  function onPointerMove(e: RPointerEvent) {
    if (!drawing.current?.active) return
    const p = toPct(e)
    const s = drawing.current.start
    if (tool === 'box') {
      setLiveBox({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
    } else if (tool === 'draw') {
      setLivePath(prev => (prev ? [...prev, p] : [p]))
    }
  }

  function onPointerUp(e: RPointerEvent) {
    if (!drawing.current?.active) return
    const p = toPct(e)
    const s = drawing.current.start
    drawing.current = null

    if (tool === 'pin') {
      onCreate({ kind: 'pin', visibility, color, x_pct: s.x, y_pct: s.y })
    } else if (tool === 'callout') {
      const w = 22, h = 12
      onCreate({ kind: 'callout', visibility, color, x_pct: clamp(s.x, 0, 100 - w), y_pct: clamp(s.y + 4, 0, 100 - h), w_pct: w, h_pct: h, text: '' })
    } else if (tool === 'box') {
      const x = Math.min(s.x, p.x), y = Math.min(s.y, p.y)
      const w = Math.abs(p.x - s.x), h = Math.abs(p.y - s.y)
      setLiveBox(null)
      if (w > 1.5 && h > 1.5) onCreate({ kind: 'box', visibility, color, x_pct: x, y_pct: y, w_pct: w, h_pct: h })
    } else if (tool === 'draw') {
      const path = livePath && livePath.length > 1 ? livePath : null
      setLivePath(null)
      if (path) {
        const xs = path.map(pt => pt.x), ys = path.map(pt => pt.y)
        onCreate({ kind: 'draw', visibility, color, x_pct: Math.min(...xs), y_pct: Math.min(...ys), path })
      }
    }
  }

  const selected = annotations.find(a => a.id === selectedId) || null

  return (
    <div
      ref={overlayRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute', inset: 0, zIndex: 12,
        pointerEvents: capturing ? 'auto' : 'none',
        cursor: capturing ? 'crosshair' : 'default',
        touchAction: capturing ? 'none' : 'auto',
      }}
    >
      {/* Freehand strokes (existing + live) as one SVG in px space */}
      <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
        {annotations.filter(a => a.kind === 'draw' && a.path).map(a => (
          <polyline
            key={a.id}
            points={a.path!.map(pt => `${(pt.x / 100) * size.w},${(pt.y / 100) * size.h}`).join(' ')}
            fill="none" stroke={a.color} strokeWidth={selectedId === a.id ? 4 : 3}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={a.visibility === 'private' ? 0.95 : 1}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onPointerDown={e => { e.stopPropagation(); onSelect(selectedId === a.id ? null : a.id) }}
          />
        ))}
        {livePath && livePath.length > 1 && (
          <polyline points={livePath.map(pt => `${(pt.x / 100) * size.w},${(pt.y / 100) * size.h}`).join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Callout arrows */}
        {annotations.filter(a => a.kind === 'callout').map(a => {
          const bx = (a.x_pct / 100) * size.w
          const by = (a.y_pct / 100) * size.h
          return <line key={`arr-${a.id}`} x1={bx + 8} y1={by} x2={bx - 14} y2={by - 18} stroke={a.color} strokeWidth={2} strokeDasharray="3 3" />
        })}
      </svg>

      {/* Boxes */}
      {annotations.filter(a => a.kind === 'box').map(a => (
        <div
          key={a.id}
          onPointerDown={e => { e.stopPropagation(); onSelect(selectedId === a.id ? null : a.id) }}
          style={{
            position: 'absolute', left: `${a.x_pct}%`, top: `${a.y_pct}%`, width: `${a.w_pct}%`, height: `${a.h_pct}%`,
            border: `2px solid ${a.color}`, borderRadius: '4px',
            background: hexToRgba(a.color, a.visibility === 'shared' ? 0.1 : 0.06),
            boxShadow: selectedId === a.id ? `0 0 0 3px ${hexToRgba(a.color, 0.25)}` : 'none',
            pointerEvents: 'auto', cursor: 'pointer', transition: 'box-shadow 150ms ease',
          }}
        >
          {a.visibility === 'private' && <PrivateTag color={a.color} />}
        </div>
      ))}

      {/* Live box preview */}
      {liveBox && (
        <div style={{ position: 'absolute', left: `${liveBox.x}%`, top: `${liveBox.y}%`, width: `${liveBox.w}%`, height: `${liveBox.h}%`, border: `2px dashed ${color}`, borderRadius: '4px', background: hexToRgba(color, 0.08), pointerEvents: 'none' }} />
      )}

      {/* Callout boxes */}
      {annotations.filter(a => a.kind === 'callout').map(a => (
        <div
          key={a.id}
          onPointerDown={e => { e.stopPropagation(); onSelect(selectedId === a.id ? null : a.id) }}
          style={{
            position: 'absolute', left: `${a.x_pct}%`, top: `${a.y_pct}%`,
            minWidth: '120px', maxWidth: '200px',
            background: '#fff', borderLeft: `3px solid ${a.color}`, borderRadius: '6px',
            padding: '8px 10px', boxShadow: selectedId === a.id ? `0 0 0 3px ${hexToRgba(a.color, 0.25)}, 0 6px 18px rgba(0,0,0,.12)` : '0 6px 18px rgba(0,0,0,.12)',
            pointerEvents: 'auto', cursor: 'pointer', transition: 'box-shadow 150ms ease',
          }}
        >
          <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: a.text ? '#374151' : '#94A3B8', lineHeight: 1.4 }}>
            {a.text || (locale === 'en' ? 'Description…' : 'Beschreibung…')}
          </div>
          {a.visibility === 'private' && <PrivateTag color={a.color} inline />}
        </div>
      ))}

      {/* Pins */}
      {annotations.filter(a => a.kind === 'pin').map((a, i) => (
        <Pin key={a.id} ann={a} selected={selectedId === a.id} editable={editable}
          onClick={() => onSelect(selectedId === a.id ? null : a.id)} />
      ))}

      {/* Editor / reader popover for selected */}
      {selected && (
        <EditorPopover
          ann={selected}
          locale={locale}
          readOnly={!editable}
          onChangeText={t => onUpdate(selected.id, { text: t })}
          onChangeColor={c => onUpdate(selected.id, { color: c })}
          onChangeVisibility={v => onUpdate(selected.id, { visibility: v })}
          onDelete={() => onDelete(selected.id)}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  )
}

function Pin({ ann, selected, editable, onClick }: { ann: Annotation; selected: boolean; editable: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'absolute', left: `${ann.x_pct}%`, top: `${ann.y_pct}%`, zIndex: 14, pointerEvents: 'auto' }}>
      <div
        onPointerDown={e => { e.stopPropagation(); onClick() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '26px', height: '26px', borderRadius: '50% 50% 50% 0',
          background: ann.color, border: '2px solid #fff',
          boxShadow: selected ? `0 0 0 4px ${hexToRgba(ann.color, 0.3)}` : '0 2px 8px rgba(0,0,0,.25)',
          transform: `rotate(-45deg) ${hov || selected ? 'scale(1.12)' : 'scale(1)'}`,
          transition: 'transform 180ms cubic-bezier(.34,1.56,.64,1), box-shadow 150ms ease',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {ann.visibility === 'private'
          ? <Lock size={11} color="#fff" style={{ transform: 'rotate(45deg)' }} />
          : <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', transform: 'rotate(45deg)' }} />}
      </div>
    </div>
  )
}

function PrivateTag({ color, inline }: { color: string; inline?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: inline ? '6px' : '-9px', right: inline ? '6px' : '-9px',
      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
      border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,.15)',
    }}>
      <Lock size={9} color={color} />
    </div>
  )
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── SIDE LIST ─────────────────────────────────────────────

export function AnnotationList({
  annotations, selectedId, onSelect, onDelete, locale, emptyHint,
}: {
  annotations: Annotation[]; selectedId: string | null
  onSelect: (id: string) => void; onDelete: (id: string) => void
  locale: string; emptyHint: string
}) {
  const isDE = locale !== 'en'
  if (annotations.length === 0) {
    return <div style={{ textAlign: 'center', padding: '36px 16px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', lineHeight: 1.5 }}>{emptyHint}</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {annotations.map(a => {
        const kind = TOOLS.find(t => t.id === a.kind)
        const Icon = kind?.icon ?? MapPin
        return (
          <div
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '9px', cursor: 'pointer',
              background: selectedId === a.id ? '#EFF6FF' : '#F8FAFC',
              border: `1px solid ${selectedId === a.id ? '#BFDBFE' : '#EEF2F6'}`,
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: hexToRgba(a.color, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} color={a.color} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: a.text ? '#374151' : '#94A3B8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {a.text || (isDE ? `${kind?.de}` : `${kind?.en}`)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'Inter, sans-serif', color: a.visibility === 'shared' ? '#1D4ED8' : '#94A3B8' }}>
                  {a.visibility === 'shared' ? <Users size={10} /> : <Lock size={10} />}
                  {a.visibility === 'shared' ? (isDE ? 'Geteilt' : 'Shared') : (isDE ? 'Privat' : 'Private')}
                </span>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(a.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', display: 'flex', alignSelf: 'flex-start' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
