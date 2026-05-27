'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, Bell, Trash2, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { Button, Input, Toast } from '@/components/app/ds'
import { createBrowserClient } from '@/lib/supabase'

const T = {
  de: {
    title: 'Einstellungen',
    subtitle: 'Verwalte dein Profil und deine Präferenzen',
    sections: {
      profile: { label: 'Profil', desc: 'Name und E-Mail-Adresse bearbeiten' },
      security: { label: 'Sicherheit', desc: 'Passwort ändern' },
      notifications: { label: 'Benachrichtigungen', desc: 'E-Mail-Präferenzen verwalten' },
      danger: { label: 'Gefahrenzone', desc: 'Account unwiderruflich löschen' },
    },
    profile: {
      name: 'Name',
      email: 'E-Mail-Adresse',
      save: 'Änderungen speichern',
      saved: 'Gespeichert',
    },
    security: {
      currentPassword: 'Aktuelles Passwort',
      newPassword: 'Neues Passwort',
      confirmPassword: 'Neues Passwort bestätigen',
      change: 'Passwort ändern',
      mismatch: 'Passwörter stimmen nicht überein.',
      minLength: 'Mindestens 8 Zeichen erforderlich.',
      success: 'Passwort wurde geändert.',
    },
    notifications: {
      comments: 'Neue Kunden-Kommentare',
      commentsDesc: 'E-Mail erhalten, wenn ein Kunde einen neuen Kommentar hinterlässt',
      payments: 'Zahlungseingang',
      paymentsDesc: 'E-Mail erhalten, wenn eine Zahlung im Escrow eingegangen ist',
      weekly: 'Wöchentliche Zusammenfassung',
      weeklyDesc: 'Jeden Montag eine Übersicht deiner Projekte und Aktivitäten erhalten',
      save: 'Einstellungen speichern',
      saved: 'Gespeichert',
    },
    danger: {
      title: 'Account löschen',
      desc: 'Alle deine Daten, Projekte und Dateien werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      button: 'Account löschen',
      confirm: 'Bist du sicher? Gib zur Bestätigung "LÖSCHEN" ein:',
      confirmWord: 'LÖSCHEN',
      confirmBtn: 'Endgültig löschen',
      cancel: 'Abbrechen',
      deleting: 'Wird gelöscht…',
    },
    errors: { generic: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your profile and preferences',
    sections: {
      profile: { label: 'Profile', desc: 'Edit your name and email address' },
      security: { label: 'Security', desc: 'Change your password' },
      notifications: { label: 'Notifications', desc: 'Manage email preferences' },
      danger: { label: 'Danger zone', desc: 'Permanently delete your account' },
    },
    profile: {
      name: 'Name',
      email: 'Email address',
      save: 'Save changes',
      saved: 'Saved',
    },
    security: {
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      change: 'Change password',
      mismatch: 'Passwords do not match.',
      minLength: 'Minimum 8 characters required.',
      success: 'Password changed successfully.',
    },
    notifications: {
      comments: 'New client comments',
      commentsDesc: 'Receive an email when a client leaves a new comment',
      payments: 'Payment received',
      paymentsDesc: 'Receive an email when a payment arrives in escrow',
      weekly: 'Weekly digest',
      weeklyDesc: 'Receive a weekly summary of your projects every Monday',
      save: 'Save preferences',
      saved: 'Saved',
    },
    danger: {
      title: 'Delete account',
      desc: 'All your data, projects, and files will be permanently deleted. This action cannot be undone.',
      button: 'Delete account',
      confirm: 'Are you sure? Type "DELETE" to confirm:',
      confirmWord: 'DELETE',
      confirmBtn: 'Permanently delete',
      cancel: 'Cancel',
      deleting: 'Deleting…',
    },
    errors: { generic: 'An error occurred. Please try again.' },
  },
}

function SectionAccordion({ icon, label, desc, active, onToggle, children }: {
  icon: React.ReactNode
  label: string
  desc: string
  active: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const [hov, setHov] = useState(false)

  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '20px 24px', cursor: 'pointer',
          background: hov && !active ? '#FAFAFA' : 'transparent',
          transition: 'background 120ms',
        }}
      >
        <span style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: active ? '#EFF6FF' : '#F8FAFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          color: active ? '#1D4ED8' : '#94A3B8',
        }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{label}</div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
        </div>
        <span style={{ color: '#CBD5E1', transition: 'transform 200ms', transform: active ? 'rotate(180deg)' : 'none', display: 'flex' }}>
          <ChevronDown size={18} />
        </span>
      </div>
      {active && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ paddingTop: '20px' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '9999px', cursor: 'pointer',
        background: checked ? '#1D4ED8' : '#E2E8F0',
        transition: 'background 200ms', position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

export default function SettingsPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [activeSection, setActiveSection] = useState<string | null>('profile')
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('PS')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Profile form
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Security form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Notifications
  const [notifyComments, setNotifyComments] = useState(true)
  const [notifyPayments, setNotifyPayments] = useState(true)
  const [notifyWeekly, setNotifyWeekly] = useState(false)
  const [notifySaving, setNotifySaving] = useState(false)
  const [notifySaved, setNotifySaved] = useState(false)

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/app/login`); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data: profile } = await (supabase as any)
        .from('profiles').select('name, email').eq('id', user.id).single() as { data: { name: string; email: string } | null }
      if (profile) {
        setProfileName(profile.name ?? '')
        setProfileEmail(profile.email ?? user.email ?? '')
        setUserName(profile.name ?? '')
        setUserInitials(profile.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'PS')
      }

      const { data: settings } = await (supabase as any)
        .from('user_settings').select('*').eq('user_id', user.id).single() as { data: any | null }
      if (settings) {
        setNotifyComments(settings.notify_comments ?? true)
        setNotifyPayments(settings.notify_payments ?? true)
        setNotifyWeekly(settings.notify_weekly ?? false)
      }
    }
    load()
  }, [])

  async function saveProfile() {
    setProfileSaving(true)
    try {
      await (supabase as any)
        .from('profiles')
        .update({ name: profileName, email: profileEmail })
        .eq('id', userId)
      setUserName(profileName)
      setUserInitials(profileName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
      setProfileSaved(true)
      showToast(t.profile.saved)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      showToast(t.errors.generic, 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  async function changePassword() {
    setPwError('')
    if (newPw !== confirmPw) { setPwError(t.security.mismatch); return }
    if (newPw.length < 8) { setPwError(t.security.minLength); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showToast(t.security.success)
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (e: any) {
      setPwError(e.message ?? t.errors.generic)
    } finally {
      setPwSaving(false)
    }
  }

  async function saveNotifications() {
    setNotifySaving(true)
    try {
      const existing = await (supabase as any)
        .from('user_settings').select('id').eq('user_id', userId).single() as { data: any | null }
      if (existing.data) {
        await (supabase as any)
          .from('user_settings')
          .update({ notify_comments: notifyComments, notify_payments: notifyPayments, notify_weekly: notifyWeekly })
          .eq('user_id', userId)
      } else {
        await (supabase as any)
          .from('user_settings')
          .insert({ user_id: userId, notify_comments: notifyComments, notify_payments: notifyPayments, notify_weekly: notifyWeekly })
      }
      setNotifySaved(true)
      showToast(t.notifications.saved)
      setTimeout(() => setNotifySaved(false), 3000)
    } catch {
      showToast(t.errors.generic, 'error')
    } finally {
      setNotifySaving(false)
    }
  }

  async function deleteAccount() {
    if (deleteInput !== t.danger.confirmWord) return
    setDeleting(true)
    try {
      await (supabase as any).from('projects').delete().eq('designer_id', userId)
      await (supabase as any).from('profiles').delete().eq('id', userId)
      await supabase.auth.signOut()
      router.push(`/${locale}/app/login`)
    } catch {
      showToast(t.errors.generic, 'error')
      setDeleting(false)
    }
  }

  function toggle(key: string) {
    setActiveSection(prev => prev === key ? null : key)
  }

  return (
    <DashboardLayout locale={locale} activeSection="settings" userName={userName} userInitials={userInitials}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, width: '320px' }}>
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '680px' }}>
        {/* Profile */}
        <SectionAccordion
          icon={<User size={18} />}
          label={t.sections.profile.label}
          desc={t.sections.profile.desc}
          active={activeSection === 'profile'}
          onToggle={() => toggle('profile')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input label={t.profile.name} value={profileName} onChange={e => setProfileName(e.target.value)} style={{ marginBottom: 0 }} />
            <Input label={t.profile.email} value={profileEmail} onChange={e => setProfileEmail(e.target.value)} type="email" style={{ marginBottom: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                loading={profileSaving}
                icon={profileSaved ? <Check size={15} /> : undefined}
                onClick={saveProfile}
              >
                {profileSaved ? t.profile.saved : t.profile.save}
              </Button>
            </div>
          </div>
        </SectionAccordion>

        {/* Security */}
        <SectionAccordion
          icon={<Lock size={18} />}
          label={t.sections.security.label}
          desc={t.sections.security.desc}
          active={activeSection === 'security'}
          onToggle={() => toggle('security')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input label={t.security.currentPassword} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={{ marginBottom: 0 }} />
            <Input label={t.security.newPassword} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ marginBottom: 0 }} />
            <Input label={t.security.confirmPassword} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} error={pwError} style={{ marginBottom: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                loading={pwSaving}
                icon={pwSuccess ? <Check size={15} /> : undefined}
                onClick={changePassword}
              >
                {pwSuccess ? t.security.success : t.security.change}
              </Button>
            </div>
          </div>
        </SectionAccordion>

        {/* Notifications */}
        <SectionAccordion
          icon={<Bell size={18} />}
          label={t.sections.notifications.label}
          desc={t.sections.notifications.desc}
          active={activeSection === 'notifications'}
          onToggle={() => toggle('notifications')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { key: 'comments', label: t.notifications.comments, desc: t.notifications.commentsDesc, value: notifyComments, set: setNotifyComments },
              { key: 'payments', label: t.notifications.payments, desc: t.notifications.paymentsDesc, value: notifyPayments, set: setNotifyPayments },
              { key: 'weekly', label: t.notifications.weekly, desc: t.notifications.weeklyDesc, value: notifyWeekly, set: setNotifyWeekly },
            ].map((item, i, arr) => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                gap: '16px',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '2px' }}>{item.desc}</div>
                </div>
                <Toggle checked={item.value} onChange={item.set} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button
                variant="primary"
                loading={notifySaving}
                icon={notifySaved ? <Check size={15} /> : undefined}
                onClick={saveNotifications}
              >
                {notifySaved ? t.notifications.saved : t.notifications.save}
              </Button>
            </div>
          </div>
        </SectionAccordion>

        {/* Danger Zone */}
        <SectionAccordion
          icon={<Trash2 size={18} />}
          label={t.sections.danger.label}
          desc={t.sections.danger.desc}
          active={activeSection === 'danger'}
          onToggle={() => toggle('danger')}
        >
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '8px', padding: '16px 20px',
          }}>
            <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#7F1D1D', marginBottom: '16px', lineHeight: '1.5' }}>
              {t.danger.desc}
            </p>
            {!showDeleteConfirm ? (
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                {t.danger.button}
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input
                  label={t.danger.confirm}
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder={t.danger.confirmWord}
                  style={{ marginBottom: 0 }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="danger"
                    loading={deleting}
                    disabled={deleteInput !== t.danger.confirmWord}
                    onClick={deleteAccount}
                  >
                    {deleting ? t.danger.deleting : t.danger.confirmBtn}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}>
                    {t.danger.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SectionAccordion>
      </div>
    </DashboardLayout>
  )
}
