'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Calendar, Euro, ChevronRight, Check, Clock, CircleDot, ClipboardCheck } from 'lucide-react'
import { NavbarDashboard } from '@/components/app/AppNavbar'
import { Badge } from '@/components/app/ds'
import { WorkflowStepper } from '@/components/app/WorkflowStepper'
import { createBrowserClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  de: {
    title: 'Meine Projekte',
    subtitle: 'Alle Projekte, auf die du Zugriff hast.',
    loading: 'Laden…',
    noProjects: 'Keine Projekte',
    noProjectsSub: 'Gib einen Projektcode ein, um ein Projekt zu öffnen.',
    enterCode: 'Code eingeben',
    view: 'Design ansehen',
    amount: 'Betrag',
    delivery: 'Lieferdatum',
    timeline: {
      offen: 'Warte auf deine Rückmeldung',
      ausstehend: 'Zahlung ausstehend',
      escrow: 'Betrag gesichert – Lieferung läuft',
      abgeliefert: 'Abnahme nötig – bitte prüfen',
      abgeschlossen: 'Abgeschlossen',
    },
    approveCta: 'Prüfen & abnehmen',
  },
  en: {
    title: 'My projects',
    subtitle: 'All projects you have access to.',
    loading: 'Loading…',
    noProjects: 'No projects',
    noProjectsSub: 'Enter a project code to open a project.',
    enterCode: 'Enter code',
    view: 'View design',
    amount: 'Amount',
    delivery: 'Delivery date',
    timeline: {
      offen: 'Waiting for your response',
      ausstehend: 'Payment pending',
      escrow: 'Amount secured – delivery in progress',
      abgeliefert: 'Approval needed – please review',
      abgeschlossen: 'Completed',
    },
    approveCta: 'Review & approve',
  },
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  offen: <CircleDot size={15} color="#3B82F6" />,
  ausstehend: <Clock size={15} color="#F59E0B" />,
  escrow: <Clock size={15} color="#8B5CF6" />,
  abgeliefert: <ClipboardCheck size={15} color="#14B8A6" />,
  abgeschlossen: <Check size={15} color="#10B981" />,
}

export default function ClientDashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()
  const { isMobile } = useBreakpoint()

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('K')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }

      const { data: profile } = await (supabase as any)
        .from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
      if (profile?.name) {
        setUserName(profile.name)
        setUserInitials(profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
      }

      const { data: projectData } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('client_user_id', user.id)
        .order('created_at', { ascending: false }) as { data: any[] | null }

      setProjects(projectData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatAmount = (a: number | null) => a ? `€ ${a.toLocaleString('de-DE')},–` : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <NavbarDashboard locale={locale} userName={userName} userInitials={userInitials} />

      <div style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px', animation: 'fadeInUp 200ms ease-out' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                {t.title}
              </h1>
              <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>
                {t.subtitle}
              </p>
            </div>
            <button
              onClick={() => router.push(`/${locale}/join`)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
            >
              # {t.enterCode}
            </button>
          </div>

          {/* Projects */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ height: '120px', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '6px' }}>
                {t.noProjects}
              </div>
              <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
                {t.noProjectsSub}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                  t={t}
                  formatDate={formatDate}
                  formatAmount={formatAmount}
                  onView={() => {
                    localStorage.setItem(`pitch_access_${project.code}`, Date.now().toString())
                    router.push(`/${locale}/app/pitch/${project.code}`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, locale, t, formatDate, formatAmount, onView }: any) {
  const [hov, setHov] = useState(false)
  const needsAction = project.status === 'abgeliefert'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: '12px', padding: '20px 24px',
        boxShadow: hov ? '0 4px 12px rgba(0,0,0,.08)' : '0 1px 3px rgba(0,0,0,.04)',
        transition: 'all 200ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
              {project.name}
            </span>
            <Badge status={project.status} locale={locale} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
            {STATUS_ICON[project.status]}
            {t.timeline[project.status as keyof typeof t.timeline]}
          </div>
        </div>
        <button
          onClick={onView}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: needsAction ? '#1D4ED8' : '#EFF6FF', color: needsAction ? '#fff' : '#1D4ED8', border: `1px solid ${needsAction ? '#1D4ED8' : '#BFDBFE'}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', flexShrink: 0, boxShadow: needsAction ? '0 2px 8px rgba(29,78,216,.25)' : 'none' }}
        >
          {needsAction ? <ClipboardCheck size={14} /> : <Eye size={14} />}
          {needsAction ? t.approveCta : t.view}
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Euro size={13} color="#94A3B8" />
          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{formatAmount(project.amount)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={13} color="#94A3B8" />
          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{formatDate(project.delivery_date)}</span>
        </div>
      </div>

      <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', maxWidth: '560px' }}>
        <WorkflowStepper status={project.status} locale={locale} size={22} />
      </div>
    </div>
  )
}
