'use client'

import { useState, ReactNode, CSSProperties } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2,
  Settings, HelpCircle, X, Check, Zap,
} from 'lucide-react'
import { NavbarDashboard } from './AppNavbar'
import { Button, Divider } from './ds'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// ── SIDEBAR ITEM ──────────────────────────────────────────

function SidebarItem({ icon, label, active, onClick }: {
  icon: ReactNode; label: string; active: boolean; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 24px', cursor: 'pointer', position: 'relative',
        background: active ? '#EFF6FF' : hov ? '#F8FAFC' : 'transparent',
        transition: 'background 120ms',
        borderLeft: active ? '3px solid #1D4ED8' : '3px solid transparent',
      }}
    >
      <span style={{ color: active ? '#1D4ED8' : hov ? '#0F172A' : '#64748B', display: 'flex' }}>{icon}</span>
      <span style={{
        fontSize: '14px', fontWeight: active ? 600 : 500,
        fontFamily: 'Inter, sans-serif',
        color: active ? '#1D4ED8' : hov ? '#0F172A' : '#64748B',
        transition: 'color 120ms',
      }}>{label}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
      color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '0 24px', marginBottom: '8px',
    }}>{children}</div>
  )
}

// ── SIDEBAR ───────────────────────────────────────────────

interface SidebarProps {
  locale: string
  activeSection?: string
}

export function AppSidebar({ locale, activeSection = 'dashboard' }: SidebarProps) {
  const router = useRouter()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const mainItems = [
    { icon: <LayoutDashboard size={18} />, label: locale === 'en' ? 'Overview' : 'Übersicht', key: 'dashboard', path: `/${locale}/app/dashboard` },
    { icon: <BarChart2 size={18} />, label: locale === 'en' ? 'Statistics' : 'Statistiken', key: 'statistics', path: `/${locale}/app/statistics` },
  ]
  const accountItems = [
    { icon: <Settings size={18} />, label: locale === 'en' ? 'Settings' : 'Einstellungen', key: 'settings', path: `/${locale}/app/settings` },
    { icon: <HelpCircle size={18} />, label: locale === 'en' ? 'Help' : 'Hilfe', key: 'help', path: `/${locale}/app/help` },
  ]

  return (
    <div style={{
      position: 'fixed', top: '64px', left: 0, bottom: 0, width: '240px',
      background: '#fff', borderRight: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column', zIndex: 40,
      paddingTop: '24px',
    }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SectionLabel>{locale === 'en' ? 'Main menu' : 'Hauptmenü'}</SectionLabel>
        {mainItems.map(item => (
          <SidebarItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.key}
            onClick={() => router.push(item.path)}
          />
        ))}
        <Divider style={{ margin: '16px 24px', width: 'calc(100% - 48px)' }} />
        <SectionLabel>{locale === 'en' ? 'Account' : 'Konto'}</SectionLabel>
        {accountItems.map(item => (
          <SidebarItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.key}
            onClick={() => router.push(item.path)}
          />
        ))}
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '8px', padding: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1E40AF', marginBottom: '4px' }}>
            {locale === 'en' ? 'Try Pro' : 'Pro testen'}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#3B82F6', marginBottom: '12px', lineHeight: '1.4' }}>
            {locale === 'en' ? 'No commission on your first 3 deals.' : 'Keine Provision auf die ersten 3 Deals.'}
          </div>
          <Button variant="primary" size="sm" fullWidth style={{ height: '32px', fontSize: '13px' }} onClick={() => setShowUpgrade(true)}>
            Upgrade
          </Button>
        </div>
      </div>

      {showUpgrade && <UpgradeModal locale={locale} onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}

// ── UPGRADE MODAL ─────────────────────────────────────────

const PLANS = {
  de: [
    {
      key: 'free',
      name: 'Free',
      price: '0',
      period: '',
      desc: 'Für den Einstieg',
      current: true,
      cta: 'Aktueller Plan',
      color: '#64748B',
      features: [
        '3 aktive Projekte',
        'Pitchsite-Branding',
        '5 % Provision pro Deal',
        'Kunden-Feedback & Pins',
        'Digitale Verträge',
      ],
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '29',
      period: '/ Monat',
      desc: 'Für aktive Freelancer',
      current: false,
      cta: 'Pro starten',
      color: '#1D4ED8',
      badge: 'Beliebt',
      features: [
        'Unbegrenzte Projekte',
        'Eigenes Logo (kein Branding)',
        '2 % Provision pro Deal',
        'Prioritäts-Support',
        'Individuelle E-Mail-Domain',
        'Erweiterte Statistiken',
      ],
    },
    {
      key: 'agency',
      name: 'Agency',
      price: '79',
      period: '/ Monat',
      desc: 'Für Teams & Agenturen',
      current: false,
      cta: 'Agency starten',
      color: '#7C3AED',
      features: [
        'Alles aus Pro',
        'Bis zu 5 Team-Mitglieder',
        'White-Label komplett',
        '0 % Provision',
        'API-Zugang',
        'Dedizierter Account Manager',
      ],
    },
  ],
  en: [
    {
      key: 'free',
      name: 'Free',
      price: '0',
      period: '',
      desc: 'Get started',
      current: true,
      cta: 'Current plan',
      color: '#64748B',
      features: [
        '3 active projects',
        'Pitchsite branding',
        '5% commission per deal',
        'Client feedback & pins',
        'Digital contracts',
      ],
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '29',
      period: '/ month',
      desc: 'For active freelancers',
      current: false,
      cta: 'Start Pro',
      color: '#1D4ED8',
      badge: 'Popular',
      features: [
        'Unlimited projects',
        'Custom logo (no branding)',
        '2% commission per deal',
        'Priority support',
        'Custom email domain',
        'Advanced analytics',
      ],
    },
    {
      key: 'agency',
      name: 'Agency',
      price: '79',
      period: '/ month',
      desc: 'For teams & agencies',
      current: false,
      cta: 'Start Agency',
      color: '#7C3AED',
      features: [
        'Everything in Pro',
        'Up to 5 team members',
        'Full white-label',
        '0% commission',
        'API access',
        'Dedicated account manager',
      ],
    },
  ],
}

function UpgradeModal({ locale, onClose }: { locale: string; onClose: () => void }) {
  const plans = PLANS[locale as 'de' | 'en'] ?? PLANS.de
  const title = locale === 'en' ? 'Choose your plan' : 'Plan wählen'
  const comingSoon = locale === 'en' ? 'Coming soon' : 'Demnächst verfügbar'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '820px', boxShadow: '0 32px 100px rgba(0,0,0,.25)', animation: 'dropIn 200ms ease-out', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Zap size={20} color="#1D4ED8" />
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>{title}</span>
            </div>
            <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
              {locale === 'en' ? 'Scale your freelance business with Pitchsite.' : 'Skaliere dein Freelance-Business mit Pitchsite.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', padding: '24px 32px 32px' }}>
          {plans.map(plan => (
            <PlanCard key={plan.key} plan={plan} comingSoon={comingSoon} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, comingSoon }: { plan: (typeof PLANS.de)[0]; comingSoon: string }) {
  const [hov, setHov] = useState(false)
  const isHighlighted = plan.key === 'pro'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `2px solid ${isHighlighted ? plan.color : hov ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: '14px', padding: '24px',
        background: isHighlighted ? '#EFF6FF' : '#fff',
        position: 'relative',
        transition: 'border-color 150ms, box-shadow 150ms',
        boxShadow: isHighlighted ? '0 4px 20px rgba(29,78,216,.12)' : hov ? '0 4px 12px rgba(0,0,0,.06)' : 'none',
      }}
    >
      {(plan as any).badge && (
        <div style={{ position: 'absolute', top: '-1px', right: '16px', background: plan.color, color: '#fff', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', padding: '3px 10px', borderRadius: '0 0 8px 8px' }}>
          {(plan as any).badge}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: plan.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {plan.name}
        </div>
        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '12px' }}>
          {plan.desc}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
            {plan.price === '0' ? 'Kostenlos' : `€${plan.price}`}
          </span>
          {plan.period && (
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{plan.period}</span>
          )}
        </div>
      </div>

      <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '16px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Check size={14} color={plan.color} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      {plan.current ? (
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
          {plan.cta}
        </div>
      ) : (
        <button
          onClick={() => alert(comingSoon)}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            background: isHighlighted ? plan.color : '#0F172A',
            color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: 'pointer', transition: 'opacity 150ms',
            opacity: hov ? 0.9 : 1,
          }}
        >
          {plan.cta}
        </button>
      )}
    </div>
  )
}

// ── DASHBOARD LAYOUT ──────────────────────────────────────

interface DashboardLayoutProps {
  children: ReactNode
  locale: string
  activeSection?: string
  userName?: string
  userInitials?: string
}

export function DashboardLayout({ children, locale, activeSection, userName, userInitials }: DashboardLayoutProps) {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <NavbarDashboard locale={locale} userName={userName} userInitials={userInitials} />
      {!isMobile && <AppSidebar locale={locale} activeSection={activeSection} />}
      <div style={{
        marginLeft: isMobile ? '0' : '240px',
        paddingTop: '64px',
        minHeight: '100vh',
      }}>
        <div style={{ padding: isMobile ? '20px 16px' : '32px 40px', animation: 'fadeInUp 200ms ease-out' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
