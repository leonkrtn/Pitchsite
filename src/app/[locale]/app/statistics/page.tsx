'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, TrendingUp, Euro, Users, Target, MessageCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { Button } from '@/components/app/ds'
import { createBrowserClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  de: {
    title: 'Statistiken',
    subtitle: 'Auswertung deiner Projekte und Finanzen',
    export: 'CSV exportieren',
    periods: { d30: 'Letzte 30 Tage', d90: 'Letzte 90 Tage', year: 'Dieses Jahr', all: 'Gesamt' },
    kpis: {
      revenue: 'Gesamtumsatz',
      avgProject: 'Ø Projektgröße',
      conversion: 'Conversion-Rate',
      openComments: 'Offene Kommentare',
    },
    charts: {
      monthlyRevenue: 'Monatlicher Umsatz',
      statusDist: 'Projektverteilung',
      topCustomers: 'Top-Kunden nach Umsatz',
    },
    status: { offen: 'Offen', ausstehend: 'Ausstehend', escrow: 'In Escrow', abgeschlossen: 'Abgeschlossen' },
    months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    noData: 'Keine Daten für diesen Zeitraum',
    customer: 'Kunde',
    projects: 'Projekte',
    revenue: 'Umsatz',
  },
  en: {
    title: 'Statistics',
    subtitle: 'Analysis of your projects and finances',
    export: 'Export CSV',
    periods: { d30: 'Last 30 days', d90: 'Last 90 days', year: 'This year', all: 'All time' },
    kpis: {
      revenue: 'Total revenue',
      avgProject: 'Avg. project size',
      conversion: 'Conversion rate',
      openComments: 'Open comments',
    },
    charts: {
      monthlyRevenue: 'Monthly revenue',
      statusDist: 'Project distribution',
      topCustomers: 'Top customers by revenue',
    },
    status: { offen: 'Open', ausstehend: 'Pending', escrow: 'In Escrow', abgeschlossen: 'Completed' },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    noData: 'No data for this period',
    customer: 'Customer',
    projects: 'Projects',
    revenue: 'Revenue',
  },
}

const STATUS_COLORS: Record<string, string> = {
  offen: '#3B82F6',
  ausstehend: '#F59E0B',
  escrow: '#8B5CF6',
  abgeschlossen: '#10B981',
}

type Period = 'd30' | 'd90' | 'year' | 'all'

function filterByPeriod<T extends { created_at: string }>(items: T[], period: Period): T[] {
  if (period === 'all') return items
  const now = new Date()
  const from = new Date()
  if (period === 'd30') from.setDate(now.getDate() - 30)
  else if (period === 'd90') from.setDate(now.getDate() - 90)
  else if (period === 'year') from.setMonth(0, 1)
  return items.filter(i => new Date(i.created_at) >= from)
}

function KpiCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
      padding: '20px 24px', flex: 1, minWidth: '180px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <span style={{ color: '#CBD5E1', display: 'flex' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '6px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
      padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function PeriodButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#0F172A' : 'transparent',
        color: active ? '#fff' : '#64748B',
        border: 'none', borderRadius: '9999px',
        padding: '6px 14px', fontSize: '13px', fontWeight: 600,
        fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 150ms',
      }}
    >
      {label}
    </button>
  )
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0F172A', borderRadius: '8px', padding: '8px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.15)',
    }}>
      <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        € {Number(payload[0].value).toLocaleString('de-DE')},–
      </div>
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0F172A', borderRadius: '8px', padding: '8px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.15)',
    }}>
      <div style={{ fontSize: '13px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </div>
    </div>
  )
}

export default function StatisticsPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()
  const { isMobile } = useBreakpoint()

  const [period, setPeriod] = useState<Period>('d30')
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [allPins, setAllPins] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('PS')
  const [loading, setLoading] = useState(true)

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

      const { data: projects } = await (supabase as any)
        .from('projects').select('*').eq('designer_id', user.id).order('created_at', { ascending: false }) as { data: any[] | null }
      setAllProjects(projects ?? [])

      const projectIds = (projects ?? []).map((p: any) => p.id)
      if (projectIds.length > 0) {
        const { data: pins } = await (supabase as any)
          .from('project_pins').select('*').in('project_id', projectIds) as { data: any[] | null }
        setAllPins(pins ?? [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const projects = filterByPeriod(allProjects, period)
  const pins = filterByPeriod(allPins, period)

  const completedProjects = projects.filter(p => p.status === 'abgeschlossen')
  const totalRevenue = completedProjects.reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
  const avgProjectSize = projects.length > 0 ? projects.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) / projects.length : 0
  const conversionRate = projects.length > 0 ? Math.round((completedProjects.length / projects.length) * 100) : 0
  const openComments = pins.filter(p => !p.resolved).length

  // Monthly revenue (last 12 months)
  const now = new Date()
  const monthlyData = t.months.map((month, i) => {
    const year = now.getFullYear() - (i > now.getMonth() ? 1 : 0)
    const monthIdx = (now.getMonth() - (t.months.length - 1 - i) + 12) % 12
    const revenue = allProjects
      .filter(p => {
        const d = new Date(p.created_at)
        return d.getMonth() === monthIdx && d.getFullYear() === year && p.status === 'abgeschlossen'
      })
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
    return { month, revenue }
  })

  // Status distribution
  const statusGroups = ['offen', 'ausstehend', 'escrow', 'abgeschlossen'].map(status => ({
    name: t.status[status as keyof typeof t.status],
    value: projects.filter(p => p.status === status).length,
    color: STATUS_COLORS[status],
  })).filter(g => g.value > 0)

  // Top customers
  const customerMap: Record<string, { name: string; email: string; count: number; revenue: number }> = {}
  projects.forEach((p: any) => {
    if (!p.client_email) return
    if (!customerMap[p.client_email]) {
      customerMap[p.client_email] = { name: p.client_name ?? p.client_email, email: p.client_email, count: 0, revenue: 0 }
    }
    customerMap[p.client_email].count++
    customerMap[p.client_email].revenue += p.amount ?? 0
  })
  const topCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  function exportCSV() {
    const header = ['Name', 'Kunde', 'Status', 'Betrag', 'Erstellt']
    const rows = projects.map((p: any) => [
      p.name,
      p.client_name ?? '',
      p.status,
      p.amount ?? 0,
      new Date(p.created_at).toLocaleDateString('de-DE'),
    ])
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pitchsite-projekte-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'd30', label: t.periods.d30 },
    { key: 'd90', label: t.periods.d90 },
    { key: 'year', label: t.periods.year },
    { key: 'all', label: t.periods.all },
  ]

  return (
    <DashboardLayout locale={locale} activeSection="statistics" userName={userName} userInitials={userInitials}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>
            {t.subtitle}
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={exportCSV}>
          {t.export}
        </Button>
      </div>

      {/* Period filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {periods.map(p => (
          <PeriodButton key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} />
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '96px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <KpiCard
              label={t.kpis.revenue}
              value={totalRevenue > 0 ? `€ ${totalRevenue.toLocaleString('de-DE')},–` : '€ 0,–'}
              icon={<Euro size={18} />}
            />
            <KpiCard
              label={t.kpis.avgProject}
              value={avgProjectSize > 0 ? `€ ${Math.round(avgProjectSize).toLocaleString('de-DE')},–` : '€ 0,–'}
              icon={<TrendingUp size={18} />}
            />
            <KpiCard
              label={t.kpis.conversion}
              value={`${conversionRate}%`}
              sub={`${completedProjects.length} / ${projects.length} ${locale === 'de' ? 'Projekte' : 'projects'}`}
              icon={<Target size={18} />}
            />
            <KpiCard
              label={t.kpis.openComments}
              value={String(openComments)}
              sub={`${pins.length} ${locale === 'de' ? 'gesamt' : 'total'}`}
              icon={<MessageCircle size={18} />}
            />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '16px', marginBottom: '16px' }}>
            {/* Monthly revenue bar chart */}
            <SectionCard title={t.charts.monthlyRevenue}>
              {monthlyData.every(d => d.revenue === 0) ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.noData}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barSize={18}>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* Status donut chart */}
            <SectionCard title={t.charts.statusDist}>
              {statusGroups.length === 0 ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.noData}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusGroups}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusGroups.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{value}</span>}
                      iconSize={8}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {/* Top customers */}
          <SectionCard title={t.charts.topCustomers}>
            {topCustomers.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.noData}</span>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 24px', marginBottom: '12px', padding: '0 0 8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.customer}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>{t.projects}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>{t.revenue}</span>
                </div>
                {topCustomers.map((c, i) => (
                  <div key={c.email} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 24px', padding: '10px 0', borderBottom: i < topCustomers.length - 1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{c.name}</div>
                      {c.name !== c.email && (
                        <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{c.email}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', textAlign: 'right' }}>{c.count}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', textAlign: 'right' }}>
                      {c.revenue > 0 ? `€ ${c.revenue.toLocaleString('de-DE')},–` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </DashboardLayout>
  )
}
