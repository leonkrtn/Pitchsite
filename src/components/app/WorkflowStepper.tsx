'use client'

import { CSSProperties } from 'react'
import { Send, PenLine, Hammer, ClipboardCheck, PartyPopper, Check } from 'lucide-react'
import {
  WORKFLOW, ProjectStatus, StepState, stepStates, stageCopy,
  currentStage, nextActionFor, WorkflowStage,
} from '@/lib/workflow'

const ICONS = { Send, PenLine, Hammer, ClipboardCheck, PartyPopper } as const

const GREEN = '#16A34A'
const BLUE = '#1D4ED8'
const LINE = '#E2E8F0'

function StageIcon({ stage, state, size = 28 }: { stage: WorkflowStage; state: StepState; size?: number }) {
  const Icon = ICONS[stage.iconName]
  const inner = Math.round(size * 0.5)

  if (state === 'done') {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: GREEN, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={inner} color="#fff" strokeWidth={2.6} />
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(29,78,216,.28)', animation: 'ping 1.6s cubic-bezier(0,0,.2,1) infinite' }} />
        <div style={{ width: size, height: size, borderRadius: '50%', background: BLUE, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={inner} color="#fff" strokeWidth={2.2} />
        </div>
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#fff', border: `2px solid ${LINE}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={inner} color="#CBD5E1" strokeWidth={2.2} />
    </div>
  )
}

// ── HORIZONTAL ────────────────────────────────────────────

export function WorkflowStepper({
  status, locale, size = 28, style = {},
}: { status: ProjectStatus; locale: string; size?: number; style?: CSSProperties }) {
  const states = stepStates(status)
  const last = WORKFLOW.length - 1

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', ...style }}>
      {WORKFLOW.map((stage, i) => {
        const leftFilled = i > 0 && states[i - 1] === 'done'
        const rightFilled = states[i] === 'done'
        const copy = stageCopy(stage, locale)
        return (
          <div key={stage.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1, height: '2px', background: leftFilled ? GREEN : LINE, visibility: i === 0 ? 'hidden' : 'visible', transition: 'background 250ms ease' }} />
              <StageIcon stage={stage} state={states[i]} size={size} />
              <div style={{ flex: 1, height: '2px', background: rightFilled ? GREEN : LINE, visibility: i === last ? 'hidden' : 'visible', transition: 'background 250ms ease' }} />
            </div>
            <span style={{
              marginTop: '8px', fontSize: '12px',
              fontWeight: states[i] === 'active' ? 700 : 500,
              fontFamily: 'Inter, sans-serif',
              color: states[i] === 'open' ? '#94A3B8' : states[i] === 'active' ? '#0F172A' : '#475569',
              textAlign: 'center', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
            }}>
              {copy.short}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── VERTICAL ──────────────────────────────────────────────

export function WorkflowStepperVertical({
  status, locale, viewer = 'designer', style = {},
}: { status: ProjectStatus; locale: string; viewer?: 'designer' | 'client'; style?: CSSProperties }) {
  const states = stepStates(status)
  const last = WORKFLOW.length - 1
  return (
    <div style={style}>
      {WORKFLOW.map((stage, i) => {
        const copy = stageCopy(stage, locale)
        const isActive = states[i] === 'active'
        return (
          <div key={stage.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StageIcon stage={stage} state={states[i]} size={26} />
              {i < last && (
                <div style={{
                  width: '2px', flex: 1, minHeight: '22px', marginTop: '2px',
                  background: states[i] === 'done' ? GREEN : LINE,
                  transition: 'background 250ms ease',
                }} />
              )}
            </div>
            <div style={{ paddingBottom: i < last ? '18px' : '0', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600, fontFamily: 'Inter, sans-serif', color: states[i] === 'open' ? '#94A3B8' : '#0F172A' }}>
                {copy.title}
              </div>
              {isActive && (
                <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '3px', lineHeight: 1.5 }}>
                  {viewer === 'designer' ? copy.designerNow : copy.clientNow}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── COMPACT HEADER CHIP ───────────────────────────────────

export function WorkflowStageChip({ status, locale }: { status: ProjectStatus; locale: string }) {
  const stage = currentStage(status)
  const idx = WORKFLOW.findIndex(s => s.id === stage.id)
  const copy = stageCopy(stage, locale)
  const Icon = ICONS[stage.iconName]
  const isDone = stage.id === 'done'
  const accent = isDone ? GREEN : BLUE
  const bg = isDone ? '#F0FDF4' : '#EFF6FF'
  const border = isDone ? '#BBF7D0' : '#BFDBFE'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      height: '28px', padding: '0 11px', borderRadius: '9999px',
      background: bg, border: `1px solid ${border}`,
    }}>
      <Icon size={14} color={accent} strokeWidth={2.2} />
      <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: accent, whiteSpace: 'nowrap' }}>
        {copy.short}
      </span>
      <span style={{ fontSize: '11px', fontFamily: '"Geist Mono", monospace', color: accent, opacity: 0.6 }}>
        {idx + 1}/{WORKFLOW.length}
      </span>
    </div>
  )
}

// ── CURRENT-STAGE BANNER ──────────────────────────────────

export function WorkflowBanner({
  status, locale, viewer, action, style = {},
}: {
  status: ProjectStatus; locale: string; viewer: 'designer' | 'client'
  action?: React.ReactNode; style?: CSSProperties
}) {
  const stage = currentStage(status)
  const copy = stageCopy(stage, locale)
  const Icon = ICONS[stage.iconName]
  const isDone = stage.id === 'done'
  const accent = isDone ? GREEN : BLUE
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 18px', borderRadius: '12px',
      background: isDone ? '#F0FDF4' : '#EFF6FF',
      border: `1px solid ${isDone ? '#BBF7D0' : '#BFDBFE'}`,
      ...style,
    }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <Icon size={19} color={accent} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
          {copy.title}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#475569', marginTop: '2px', lineHeight: 1.45 }}>
          {nextActionFor(status, viewer, locale)}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
