'use client'

import { useState, ReactNode, CSSProperties } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2,
  Settings, HelpCircle,
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
          <Button variant="primary" size="sm" fullWidth style={{ height: '32px', fontSize: '13px' }}>
            Upgrade
          </Button>
        </div>
      </div>
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
