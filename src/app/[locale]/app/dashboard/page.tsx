'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Monitor, MessageCircle, DollarSign, Calendar, MoreHorizontal, ChevronRight, Link, FileText, Archive } from 'lucide-react'
import { Button, Badge, Divider, EmptyState } from '@/components/app/ds'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { useBreakpoint } from '@/hooks/useBreakpoint'

type Project = Database['public']['Tables']['projects']['Row']

const THUMBNAIL_GRADIENTS = [
  'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  'linear-gradient(135deg, #FDF4FF, #F3E8FF)',
  'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
]

const T = {
  de: {
    title: 'Übersicht',
    greeting: (name: string) => `Guten Morgen, ${name}.`,
    activeProjects: (n: number) => `Du hast ${n} aktive${n === 1 ? 's' : ''} Projekt${n === 1 ? '' : 'e'}.`,
    newProject: 'Neues Projekt',
    stats: { active: 'Aktive Projekte', escrow: 'In Escrow', paid: 'Ausgezahlt (gesamt)', comments: 'Offene Kommentare' },
    projects: 'Meine Projekte',
    filters: ['Alle', 'Offen', 'In Escrow', 'Abgeschlossen'],
    noProjects: 'Keine Projekte in dieser Kategorie',
    firstProject: 'Noch keine Projekte',
    firstProjectSub: 'Erstelle dein erstes Projekt und teile es mit deinem Kunden.',
    comments: 'Kommentare',
    code: 'Code',
    copyLink: 'Link kopieren',
    editProject: 'Projekt bearbeiten',
    archiveProject: 'Projekt archivieren',
  },
  en: {
    title: 'Overview',
    greeting: (name: string) => `Good morning, ${name}.`,
    activeProjects: (n: number) => `You have ${n} active project${n === 1 ? '' : 's'}.`,
    newProject: 'New project',
    stats: { active: 'Active projects', escrow: 'In escrow', paid: 'Paid out (total)', comments: 'Open comments' },
    projects: 'My projects',
    filters: ['All', 'Open', 'In Escrow', 'Completed'],
    noProjects: 'No projects in this category',
    firstProject: 'No projects yet',
    firstProjectSub: 'Create your first project and share it with your client.',
    comments: 'Comments',
    code: 'Code',
    copyLink: 'Copy link',
    editProject: 'Edit project',
    archiveProject: 'Archive project',
  },
}

// ── STAT CARD ─────────────────────────────────────────────

function StatCard({ label, value, change, positive }: { label: string; value: string; change?: string; positive?: boolean }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
      padding: '20px 24px', flex: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', lineHeight: 1 }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: positive ? '#16A34A' : '#DC2626', marginTop: '6px' }}>
          {change}
        </div>
      )}
    </div>
  )
}

// ── CONTEXT MENU ITEM ─────────────────────────────────────

function ContextMenuItem({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 16px', height: '36px', cursor: 'pointer',
        background: hov ? '#F8FAFC' : 'transparent',
      }}
    >
      <span style={{ color: danger ? '#DC2626' : '#64748B', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: danger ? '#DC2626' : '#374151' }}>{label}</span>
    </div>
  )
}

// ── FILTER TABS ───────────────────────────────────────────

function FilterTabs({ active, setActive, tabs }: { active: string; setActive: (t: string) => void; tabs: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            background: active === tab ? '#0F172A' : 'transparent',
            color: active === tab ? '#fff' : '#64748B',
            border: 'none', borderRadius: '9999px',
            padding: '6px 14px', fontSize: '13px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── PROJECT CARD ──────────────────────────────────────────

function ProjectCard({ project, idx, locale, t, onNavigate }: {
  project: Project; idx: number; locale: string; t: typeof T.de; onNavigate: (id: string) => void
}) {
  const [hov, setHov] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatAmount = (amount: number | null) => amount ? `€ ${amount.toLocaleString('de-DE')},–` : '—'
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate(project.id)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: '12px', padding: '20px 24px', cursor: 'pointer',
        boxShadow: hov ? '0 4px 12px rgba(0,0,0,.08)' : '0 1px 3px rgba(0,0,0,.04)',
        transition: 'all 200ms',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}
    >
      <div style={{
        width: '72px', height: '52px', borderRadius: '8px',
        background: THUMBNAIL_GRADIENTS[idx % 3],
        border: '1px solid #BFDBFE', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Monitor size={24} color="#93C5FD" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
            {project.name}
          </span>
          <Badge status={project.status as any} locale={locale} />
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '8px' }}>
          {project.client_name || '—'}
          {project.client_name && project.client_email && <span style={{ color: '#94A3B8' }}> · {project.client_email}</span>}
          <span style={{ color: '#64748B' }}> · {t.code}: </span>
          <span style={{ fontFamily: '"Geist Mono", monospace', color: '#64748B' }}>{project.code}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MessageCircle size={14} color="#94A3B8" />
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>0 {t.comments}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <DollarSign size={14} color="#94A3B8" />
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{formatAmount(project.amount)}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={14} color="#94A3B8" />
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{formatDate(project.delivery_date)}</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: menuOpen ? '#F1F5F9' : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms',
            }}
          >
            <MoreHorizontal size={18} color="#64748B" />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '40px', width: '180px',
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,.12)', padding: '8px 0', zIndex: 20,
              animation: 'dropIn 150ms ease-out',
            }}>
              <ContextMenuItem label={t.copyLink} icon={<Link size={15} />} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${locale}/app/pitch/${project.code}`); setMenuOpen(false) }} />
              <ContextMenuItem label={t.editProject} icon={<FileText size={15} />} onClick={() => setMenuOpen(false)} />
              <Divider style={{ margin: '4px 0' }} />
              <ContextMenuItem label={t.archiveProject} icon={<Archive size={15} />} danger onClick={() => setMenuOpen(false)} />
            </div>
          )}
        </div>
        <ChevronRight size={16} color="#CBD5E1" />
      </div>
    </div>
  )
}

// ── DASHBOARD PAGE ────────────────────────────────────────

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()
  const { isMobile } = useBreakpoint()

  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState(t.filters[0])
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('PS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single() as { data: { name: string } | null }

      if (profile?.name) {
        setUserName(profile.name)
        setUserInitials(profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
      }

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('designer_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(projectData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = projects.filter(p => {
    if (filter === t.filters[0]) return true
    if (filter === t.filters[1]) return p.status === 'offen'
    if (filter === t.filters[2]) return p.status === 'escrow' || p.status === 'abgeliefert'
    if (filter === t.filters[3]) return p.status === 'abgeschlossen'
    return true
  })

  const activeCount = projects.filter(p => p.status !== 'abgeschlossen').length
  const escrowTotal = projects.filter(p => p.status === 'escrow').reduce((s, p) => s + (p.amount ?? 0), 0)
  const paidTotal = projects.filter(p => p.status === 'abgeschlossen').reduce((s, p) => s + (p.amount ?? 0), 0)

  const firstName = userName.split(' ')[0] || 'Designer'

  return (
    <DashboardLayout locale={locale} activeSection="dashboard" userName={userName} userInitials={userInitials}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>
            {t.greeting(firstName)} {t.activeProjects(activeCount)}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => router.push(`/${locale}/app/upload`)}
        >
          {t.newProject}
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <StatCard label={t.stats.active} value={String(activeCount)} />
        <StatCard label={t.stats.escrow} value={escrowTotal > 0 ? `€ ${escrowTotal.toLocaleString('de-DE')},–` : '€ 0,–'} />
        <StatCard label={t.stats.paid} value={paidTotal > 0 ? `€ ${paidTotal.toLocaleString('de-DE')},–` : '€ 0,–'} />
        <StatCard label={t.stats.comments} value="0" />
      </div>

      {/* Projects */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
            {t.projects}
          </h2>
          {!isMobile && <FilterTabs active={filter} setActive={setFilter} tabs={t.filters} />}
        </div>

        {isMobile && (
          <div style={{ marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            <FilterTabs active={filter} setActive={setFilter} tabs={t.filters} />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '96px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Monitor size={48} />}
                title={projects.length === 0 ? t.firstProject : t.noProjects}
                description={projects.length === 0 ? t.firstProjectSub : ''}
                action={projects.length === 0 ? (
                  <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push(`/${locale}/app/upload`)}>
                    {t.newProject}
                  </Button>
                ) : undefined}
              />
            ) : (
              filtered.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  idx={i}
                  locale={locale}
                  t={t}
                  onNavigate={(id) => router.push(`/${locale}/app/project/${id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
