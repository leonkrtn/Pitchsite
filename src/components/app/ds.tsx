'use client'

import { useState, ReactNode, CSSProperties } from 'react'
import {
  Eye, EyeOff, Loader2,
} from 'lucide-react'

// ── BUTTON ────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ghost-danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  fullWidth?: boolean
  style?: CSSProperties
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  variant = 'primary', size = 'md', children, icon, iconRight,
  loading = false, disabled = false, onClick, fullWidth = false,
  style = {}, type = 'button',
}: ButtonProps) {
  const [hov, setHov] = useState(false)
  const [act, setAct] = useState(false)

  const h = size === 'sm' ? '36px' : size === 'lg' ? '52px' : size === 'xl' ? '56px' : '44px'
  const fs = size === 'sm' ? '13px' : size === 'lg' ? '16px' : size === 'xl' ? '17px' : '15px'
  const px = size === 'sm' ? '0 14px' : size === 'lg' ? '0 24px' : '0 20px'
  const iconSize = size === 'sm' ? 14 : 16

  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
    fontSize: fs, height: h, padding: px, border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease', whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto', opacity: disabled ? 0.5 : 1,
    transform: act ? 'scale(0.97)' : 'scale(1)', textDecoration: 'none',
    letterSpacing: '-0.01em',
  }

  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: hov ? '#1E40AF' : '#1D4ED8', color: '#fff', boxShadow: hov ? '0 4px 12px rgba(29,78,216,.3)' : 'none' },
    secondary: { background: hov ? '#F8FAFC' : '#fff', color: '#0F172A', border: `1.5px solid ${hov ? '#CBD5E1' : '#E2E8F0'}` },
    ghost: { background: hov ? '#EFF6FF' : 'transparent', color: '#1D4ED8', border: 'none' },
    danger: { background: hov ? '#B91C1C' : '#DC2626', color: '#fff' },
    'ghost-danger': { background: hov ? '#FEF2F2' : 'transparent', color: '#DC2626', border: 'none' },
    icon: { background: hov ? '#F1F5F9' : 'transparent', color: '#64748B', width: '36px', height: '36px', padding: '0', flexShrink: 0 },
  }

  return (
    <button
      type={type}
      style={{ ...base, ...(variants[variant] || variants.primary), ...style }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setAct(false) }}
      onMouseDown={() => setAct(true)}
      onMouseUp={() => setAct(false)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          Lädt…
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
          {children}
          {iconRight && <span style={{ display: 'flex', flexShrink: 0 }}>{iconRight}</span>}
        </>
      )}
    </button>
  )
}

// ── INPUT ─────────────────────────────────────────────────

interface InputProps {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  prefix?: ReactNode
  suffix?: ReactNode
  style?: CSSProperties
  inputStyle?: CSSProperties
  required?: boolean
  autoFocus?: boolean
  readOnly?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  autoComplete?: string
  name?: string
  id?: string
}

export function Input({
  label, error, type = 'text', placeholder, value, onChange,
  prefix, suffix, style = {}, inputStyle = {}, required = false,
  autoFocus = false, readOnly = false, onKeyDown, autoComplete, name, id,
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const actualType = type === 'password' && showPw ? 'text' : type

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151', marginBottom: '6px' }}
        >
          {label}{required && <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: '14px', fontSize: '15px', color: '#64748B', pointerEvents: 'none', zIndex: 1 }}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          readOnly={readOnly}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          style={{
            width: '100%', height: '44px',
            border: `1.5px solid ${error ? '#DC2626' : focused ? '#1D4ED8' : '#E2E8F0'}`,
            borderRadius: '8px', background: readOnly ? '#F8FAFC' : '#fff',
            padding: `0 ${type === 'password' ? '44px' : suffix ? '44px' : '14px'} 0 ${prefix ? '32px' : '14px'}`,
            fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#0F172A',
            outline: 'none',
            boxShadow: focused ? (error ? '0 0 0 3px rgba(220,38,38,.10)' : '0 0 0 3px rgba(29,78,216,.12)') : 'none',
            transition: 'all 150ms',
            ...inputStyle,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B', display: 'flex', alignItems: 'center' }}
          >
            {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {suffix && type !== 'password' && (
          <span style={{ position: 'absolute', right: '12px', color: '#64748B', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>{suffix}</span>
        )}
      </div>
      {error && <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{error}</p>}
    </div>
  )
}

// ── TEXTAREA ──────────────────────────────────────────────

interface TextareaProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  style?: CSSProperties
  name?: string
  id?: string
}

export function Textarea({ label, placeholder, value, onChange, rows = 4, style = {}, name, id }: TextareaProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151', marginBottom: '6px' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%', border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
          borderRadius: '8px', background: '#fff', padding: '10px 14px',
          fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#0F172A',
          outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(29,78,216,.12)' : 'none',
          transition: 'all 150ms', resize: 'vertical', minHeight: '100px',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────────

type ProjectStatus = 'offen' | 'ausstehend' | 'escrow' | 'abgeschlossen'

interface BadgeProps {
  status: ProjectStatus
  locale?: string
}

export function Badge({ status, locale = 'de' }: BadgeProps) {
  const labels: Record<ProjectStatus, { de: string; en: string }> = {
    offen:         { de: 'Offen',          en: 'Open' },
    ausstehend:    { de: 'Ausstehend',     en: 'Pending' },
    escrow:        { de: 'In Escrow',      en: 'In Escrow' },
    abgeschlossen: { de: 'Abgeschlossen',  en: 'Completed' },
  }
  const cfgs: Record<ProjectStatus, { bg: string; text: string; dot: string }> = {
    offen:         { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
    ausstehend:    { bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
    escrow:        { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
    abgeschlossen: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  }
  const c = cfgs[status] || cfgs.offen
  const label = (labels[status] || labels.offen)[locale as 'de' | 'en'] ?? (labels[status] || labels.offen).de
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      height: '22px', padding: '0 10px', borderRadius: '9999px',
      background: c.bg, fontSize: '12px', fontWeight: 600,
      fontFamily: 'Inter, sans-serif', color: c.text, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ── CARD ──────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, style = {}, onClick, hover = false }: CardProps) {
  const [isHov, setIsHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setIsHov(true)}
      onMouseLeave={() => hover && setIsHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${isHov ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: '12px',
        boxShadow: isHov ? '0 4px 12px rgba(0,0,0,.08)' : '0 1px 3px rgba(0,0,0,.06)',
        transition: 'all 200ms',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── DIVIDER ───────────────────────────────────────────────

export function Divider({ style = {} }: { style?: CSSProperties }) {
  return <div style={{ height: '1px', background: '#E2E8F0', ...style }} />
}

// ── OR DIVIDER ────────────────────────────────────────────

export function OrDivider({ label = 'oder' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
      <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
      <span style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
    </div>
  )
}

// ── STEP LABEL ────────────────────────────────────────────

export function StepLabel({ number, title }: { number: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: '#0F172A', color: '#fff',
        fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{number}</div>
      <span style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
        {title}
      </span>
    </div>
  )
}

// ── SPINNER ───────────────────────────────────────────────

export function Spinner({ size = 20, color = '#1D4ED8' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <path d="M21 12a9 9 0 11-2.636-6.364" />
    </svg>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#CBD5E1' }}>
        {icon}
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
        {title}
      </p>
      <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: action ? '24px' : '0' }}>
        {description}
      </p>
      {action}
    </div>
  )
}

// ── TOAST ─────────────────────────────────────────────────

export function Toast({ message, type = 'success', onDismiss }: {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss?: () => void
}) {
  const colors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  }
  const c = colors[type]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      padding: '12px 16px', borderRadius: '8px',
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: '14px', fontFamily: 'Inter, sans-serif', color: c.text,
      boxShadow: '0 4px 12px rgba(0,0,0,.08)',
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, padding: '2px', display: 'flex' }}>
          ✕
        </button>
      )}
    </div>
  )
}
