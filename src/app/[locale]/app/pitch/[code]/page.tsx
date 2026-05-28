'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle, X, MousePointer, LogIn, UserPlus, KeyRound, Monitor, Smartphone } from 'lucide-react'
import { Button, Input } from '@/components/app/ds'
import { AppLogo } from '@/components/app/AppNavbar'
import { createBrowserClient } from '@/lib/supabase'
import { fetchAndRenderDesign } from '@/lib/renderDesign'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ChatWidget } from '@/components/app/ChatWidget'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type Pin = Database['public']['Tables']['project_pins']['Row']

const T = {
  de: {
    by: 'von',
    comments: 'Kommentare',
    accept: '✓ Projekt annehmen',
    acceptHint: 'Zum nächsten Schritt →',
    acceptHintSub: 'Noch kein finaler Abschluss',
    commentMode: 'Kommentarmodus:',
    on: 'EIN', off: 'AUS',
    commentHint: 'Klicke irgendwo auf das Design um einen Kommentar zu setzen',
    commentPh: 'Dein Kommentar…',
    namePh: 'Dein Name (optional)',
    cancel: 'Abbrechen',
    send: 'Senden',
    allComments: (n: number) => `Alle Kommentare (${n})`,
    notFound: 'Projekt nicht gefunden.',
    reply: 'Antworten',
    authRequired: 'Account erforderlich',
    authSub: 'Um zu kommentieren oder das Projekt anzunehmen, benötigst du ein kostenloses Konto.',
    loginTab: 'Anmelden',
    signupTab: 'Registrieren',
    name: 'Name',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    loginBtn: 'Anmelden',
    signupBtn: 'Konto erstellen',
    authError: 'Fehler bei der Anmeldung. Bitte überprüfe deine Eingaben.',
  },
  en: {
    by: 'by',
    comments: 'Comments',
    accept: '✓ Accept project',
    acceptHint: 'Continue to next step →',
    acceptHintSub: 'Nothing is final yet',
    commentMode: 'Comment mode:',
    on: 'ON', off: 'OFF',
    commentHint: 'Click anywhere on the design to add a comment',
    commentPh: 'Your comment…',
    namePh: 'Your name (optional)',
    cancel: 'Cancel',
    send: 'Send',
    allComments: (n: number) => `All comments (${n})`,
    notFound: 'Project not found.',
    reply: 'Reply',
    authRequired: 'Account required',
    authSub: 'To comment or accept the project, you need a free account.',
    loginTab: 'Log in',
    signupTab: 'Sign up',
    name: 'Name',
    email: 'Email address',
    password: 'Password',
    loginBtn: 'Log in',
    signupBtn: 'Create account',
    authError: 'Login failed. Please check your details.',
  },
}

export default function PitchViewerPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const { isMobile } = useBreakpoint()

  const [project, setProject] = useState<Project | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [commentMode, setCommentMode] = useState(false)
  const [activePin, setActivePin] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptHov, setAcceptHov] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'comment' | 'accept' | null>(null)
  const [showSetupPw, setShowSetupPw] = useState(false)
  const [showPasswordGate, setShowPasswordGate] = useState(false)
  const [noPwSet, setNoPwSet] = useState(false)
  const [blobSrc, setBlobSrc] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState(900)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const frameRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: proj } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('code', code)
        .single() as { data: Project | null }

      if (!proj) { setLoading(false); return }

      setProject(proj)

      const isDesigner = user?.id === proj.designer_id

      if (!isDesigner) {
        const pw = (proj as any).pitch_password as string | null
        if (!pw) {
          setNoPwSet(true)
          setLoading(false)
          return
        }
        // Check sessionStorage — unlocked for this browser session already?
        const sessionKey = `pitch_unlocked_${code}`
        const sessionPw = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null
        if (sessionPw !== pw) {
          setShowPasswordGate(true)
        }
      }

      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', user.id).single() as { data: { name: string } | null }
        if (profile?.name) setAuthorName(profile.name)

        if (!(proj as any).client_user_id && proj.designer_id !== user.id) {
          await (supabase as any).from('projects').update({ client_user_id: user.id }).eq('id', proj.id)
        }
      }

      const { data: pinData } = await (supabase as any)
        .from('project_pins')
        .select('*')
        .eq('project_id', proj.id)
        .order('created_at', { ascending: true }) as { data: Pin[] | null }

      setPins(pinData ?? [])
      setLoading(false)

      if (searchParams.get('setup') === '1') {
        setShowSetupPw(true)
      }
    }
    load()
  }, [code])

  useEffect(() => {
    if (!project?.file_url || !project?.file_name) return
    let revoke: (() => void) | null = null
    setBlobSrc(null)
    setIframeHeight(900)
    fetchAndRenderDesign(project.file_url, project.file_name).then(({ src, revoke: rv }) => {
      setBlobSrc(src)
      revoke = rv
    }).catch(() => setBlobSrc(project.file_url))
    return () => { revoke?.() }
  }, [project?.file_url])

  const handleIframeLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      if (doc) {
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
        )
        if (h > 100) setIframeHeight(h)
      }
    } catch {}
  }, [])

  const handleFrameClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return
    if (activePin) { setActivePin(null); return }
    const rect = frameRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setNewPin({ x, y })
    setActivePin(null)
  }, [commentMode, activePin])

  const handleAddComment = async (text: string, anonymousName?: string) => {
    if (!project || !newPin) return
    const author = authorName || anonymousName || project.client_name || 'Anonym'

    const { data } = await (supabase as any)
      .from('project_pins')
      .insert({ project_id: project.id, x_pct: newPin.x, y_pct: newPin.y, comment: text, author })
      .select()
      .single() as { data: Pin | null }

    if (data) {
      setPins(prev => [...prev, data])
      setNewPin(null)
      setActivePin(data.id)
    }
  }

  const handleAccept = () => {
    if (!project) return
    if (!currentUserId) {
      setPendingAction('accept')
      setShowAuthModal(true)
      return
    }
    setAcceptLoading(true)
    setTimeout(() => {
      setAcceptLoading(false)
      router.push(`/${locale}/app/contract/${project.code}`)
    }, 800)
  }

  const handleAuthSuccess = async (userId: string, name: string) => {
    setCurrentUserId(userId)
    setAuthorName(name)
    setShowAuthModal(false)

    if (project && project.designer_id !== userId) {
      await (supabase as any).from('projects').update({ client_user_id: userId }).eq('id', project.id)
    }

    if (pendingAction === 'accept' && project) {
      router.push(`/${locale}/app/contract/${project.code}`)
    }
    setPendingAction(null)
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        …
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.notFound}</div>
      </div>
    )
  }

  if (noPwSet) {
    const isDE = locale !== 'en'
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <KeyRound size={22} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
            {isDE ? 'Kein Zugangspasswort gesetzt' : 'No access password set'}
          </h2>
          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', lineHeight: 1.6 }}>
            {isDE
              ? 'Dieser Pitch hat noch kein Zugangspasswort. Bitte wende dich an den Designer.'
              : 'This pitch does not have an access password yet. Please contact the designer.'}
          </p>
        </div>
      </div>
    )
  }

  if (showPasswordGate) {
    return (
      <PasswordGate
        correctPassword={(project as any).pitch_password}
        locale={locale}
        onUnlock={() => {
          sessionStorage.setItem(`pitch_unlocked_${code}`, (project as any).pitch_password)
          setShowPasswordGate(false)
          if (!(project as any).pitch_password_changed) setShowSetupPw(true)
        }}
      />
    )
  }

  const headerH = isMobile ? 52 : 64
  const toolbarH = isMobile ? 44 : 48
  const bottomBarH = isMobile ? 68 : 0

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          t={t}
          onClose={() => { setShowAuthModal(false); setPendingAction(null) }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* First-time password setup modal */}
      {showSetupPw && (
        <SetupPasswordModal
          locale={locale}
          code={code}
          onDone={() => {
            setShowSetupPw(false)
            router.replace(`/${locale}/app/pitch/${code}`)
          }}
        />
      )}

      {/* Header */}
      <div style={{ height: `${headerH}px`, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 24px', flexShrink: 0, zIndex: 50 }}>
        <AppLogo />

        {isMobile ? (
          <>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.name}
              </div>
            </div>
            <div
              onClick={() => setSidebarOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '5px 12px', cursor: 'pointer' }}
            >
              <MessageCircle size={14} color="#1D4ED8" />
              <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1D4ED8' }}>{pins.length}</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{project.name}</div>
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
                {t.by} {project.client_name || '—'} · <span style={{ fontFamily: '"Geist Mono", monospace' }}>{project.code}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                onClick={() => setSidebarOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '6px 14px', cursor: 'pointer' }}
              >
                <MessageCircle size={16} color="#1D4ED8" />
                <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1D4ED8' }}>
                  {pins.length} {t.comments}
                </span>
              </div>
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setAcceptHov(true)}
                onMouseLeave={() => setAcceptHov(false)}
              >
                {acceptHov && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: '#0F172A', borderRadius: '8px', padding: '9px 13px',
                    pointerEvents: 'none', zIndex: 60,
                    animation: 'fadeInUp 150ms ease-out', whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
                  }}>
                    <div style={{ position: 'absolute', top: '-4px', right: '18px', width: '8px', height: '8px', background: '#0F172A', transform: 'rotate(45deg)' }} />
                    <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#fff', marginBottom: '2px' }}>
                      {t.acceptHint}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.6)' }}>
                      {t.acceptHintSub}
                    </div>
                  </div>
                )}
                <div style={{ transform: acceptHov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 200ms cubic-bezier(.34,1.56,.64,1)' }}>
                  <Button variant="primary" loading={acceptLoading} onClick={handleAccept} style={{ height: '40px' }}>
                    {t.accept}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ height: `${toolbarH}px`, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 16px' : '0 24px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, zIndex: 49 }}>
        {previewMode === 'desktop' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>{t.commentMode}</span>
              <ToggleSwitch on={commentMode} onChange={setCommentMode} />
              <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
                {commentMode ? t.on : t.off}
              </span>
            </div>
            {commentMode && !isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '9999px', padding: '6px 14px' }}>
                <MousePointer size={14} color="#D97706" />
                <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#92400E' }}>{t.commentHint}</span>
              </div>
            )}
            {commentMode && isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '9999px', padding: '5px 10px' }}>
                <MousePointer size={12} color="#D97706" />
                <span style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#92400E' }}>{t.commentHint}</span>
              </div>
            )}
          </>
        )}

        {/* Device preview switcher */}
        <div style={{ marginLeft: 'auto', display: 'flex', background: '#E2E8F0', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {(['desktop', 'mobile'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setPreviewMode(mode); if (mode === 'mobile') setCommentMode(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: isMobile ? '4px 8px' : '4px 12px',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: previewMode === mode ? '#fff' : 'transparent',
                color: previewMode === mode ? '#0F172A' : '#64748B',
                boxShadow: previewMode === mode ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all 150ms', fontFamily: 'Inter, sans-serif',
                fontSize: '12px', fontWeight: 500,
              }}
            >
              {mode === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
              {!isMobile && (mode === 'desktop' ? 'Desktop' : 'Mobile')}
            </button>
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#1A1A2E', backgroundImage: 'repeating-conic-gradient(#22223B 0% 25%, #1A1A2E 0% 50%)', backgroundSize: '20px 20px', position: 'relative', display: 'flex', flexDirection: 'column', marginBottom: `${bottomBarH}px` }}>
        <div style={{ flex: 1, padding: previewMode === 'mobile' ? '32px 24px' : isMobile ? '16px' : '40px', display: 'flex', justifyContent: 'center', alignItems: previewMode === 'mobile' ? 'center' : 'flex-start', overflowX: isMobile && previewMode === 'desktop' ? 'auto' : 'hidden', overflowY: 'auto' }}>

          {previewMode === 'desktop' ? (
            <div
              ref={frameRef}
              onClick={handleFrameClick}
              style={{
                width: '1280px',
                background: '#fff',
                boxShadow: '0 20px 80px rgba(0,0,0,.4)',
                position: 'relative',
                cursor: commentMode ? 'crosshair' : 'default',
                flexShrink: 0,
              }}
            >
              {project.file_url ? (
                blobSrc ? (
                  <iframe
                    ref={iframeRef}
                    src={blobSrc}
                    onLoad={handleIframeLoad}
                    sandbox="allow-same-origin allow-scripts"
                    style={{ width: '1280px', height: `${iframeHeight}px`, border: 'none', display: 'block', pointerEvents: commentMode ? 'none' : 'auto' }}
                    title={project.name}
                  />
                ) : (
                  <div style={{ width: '1280px', height: `${iframeHeight}px`, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                    Lädt…
                  </div>
                )
              ) : (
                <div style={{ width: '1280px', height: `${iframeHeight}px`, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                  No design file uploaded
                </div>
              )}

              {pins.map((pin, i) => (
                <CommentPin
                  key={pin.id}
                  pin={pin}
                  number={i + 1}
                  active={activePin === pin.id}
                  onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
                  t={t}
                />
              ))}

              {newPin && commentMode && (
                <>
                  <div style={{ position: 'absolute', left: `${newPin.x}%`, top: `${newPin.y}%`, width: '28px', height: '28px', borderRadius: '50% 50% 50% 0', background: 'rgba(29,78,216,.6)', border: '2px solid #fff', zIndex: 10 }} />
                  <NewCommentPopover
                    pos={newPin}
                    onClose={() => setNewPin(null)}
                    onSubmit={handleAddComment}
                    placeholder={t.commentPh}
                    cancelLabel={t.cancel}
                    sendLabel={t.send}
                    showNameField={!currentUserId}
                    namePlaceholder={t.namePh}
                  />
                </>
              )}
            </div>
          ) : (
            <div style={{
              width: '393px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'stretch',
              borderRadius: '50px',
              border: '10px solid #1C1C1E',
              boxShadow: '0 0 0 2px #3A3A3C, 0 40px 120px rgba(0,0,0,.7)',
              overflow: 'hidden',
              background: '#fff',
              position: 'relative',
            }}>
              {/* Status bar */}
              <div style={{ height: '44px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, position: 'relative' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>9:41</span>
                <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '117px', height: '34px', background: '#1C1C1E', borderRadius: '20px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <rect x="0" y="1" width="13" height="8" rx="2" stroke="#0F172A" strokeWidth="1.2"/>
                    <rect x="1" y="2" width="9" height="6" rx="1" fill="#0F172A"/>
                    <path d="M14 3.5v3a1.5 1.5 0 000-3z" fill="#0F172A"/>
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                {project.file_url ? (
                  blobSrc ? (
                    <iframe
                      src={blobSrc}
                      sandbox="allow-same-origin allow-scripts"
                      style={{ width: '393px', height: '100%', minHeight: '600px', border: 'none', display: 'block' }}
                      title={project.name}
                    />
                  ) : (
                    <div style={{ width: '393px', height: '100%', minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                      Lädt…
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    No design file uploaded
                  </div>
                )}
              </div>

              {/* Home indicator */}
              <div style={{ height: '34px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '134px', height: '5px', background: '#1C1C1E', borderRadius: '3px' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '1px solid #E2E8F0', zIndex: 50, display: 'flex', gap: '10px' }}>
          <Button variant="primary" fullWidth loading={acceptLoading} onClick={handleAccept} style={{ height: '44px', fontSize: '14px' }}>
            {t.accept}
          </Button>
        </div>
      )}

      {/* Chat */}
      {project && (
        <ChatWidget
          projectId={project.id}
          senderName={authorName || (project as any).client_name || 'Kunde'}
          isDesigner={false}
          senderId={currentUserId}
          mode="floating"
          locale={locale}
          bottomOffset={isMobile ? 68 : 0}
        />
      )}

      {/* Comment Sidebar */}
      {sidebarOpen && (
        <CommentSidebar
          pins={pins}
          title={t.allComments(pins.length)}
          onClose={() => setSidebarOpen(false)}
          onPinClick={id => { setActivePin(id); setSidebarOpen(false) }}
          isMobile={isMobile}
          topOffset={headerH + toolbarH}
        />
      )}
    </div>
  )
}

// ── PASSWORD GATE ─────────────────────────────────────────

function PasswordGate({ correctPassword, onUnlock, locale }: {
  correctPassword: string
  onUnlock: () => void
  locale: string
}) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [focused, setFocused] = useState(false)
  const isDE = locale !== 'en'

  const labels = {
    title: isDE ? 'Passwortgeschützter Pitch' : 'Password-protected pitch',
    sub: isDE
      ? 'Dein Designer hat dir ein Passwort mitgeteilt. Gib es hier ein um den Entwurf zu öffnen.'
      : 'Your designer shared a password with you. Enter it below to view the design.',
    placeholder: isDE ? 'Passwort eingeben' : 'Enter password',
    cta: isDE ? 'Öffnen' : 'Open',
    errorMsg: isDE ? 'Falsches Passwort. Bitte nochmal versuchen.' : 'Wrong password. Please try again.',
  }

  const submit = () => {
    if (input === correctPassword) {
      onUnlock()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,.5)', animation: 'dropIn 200ms ease-out' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <KeyRound size={22} color="#1D4ED8" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
          {labels.title}
        </h2>
        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '28px', lineHeight: 1.6 }}>
          {labels.sub}
        </p>
        {error && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#DC2626' }}>
            {labels.errorMsg}
          </div>
        )}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={labels.placeholder}
            autoFocus
            style={{
              width: '100%', height: '44px', border: `1.5px solid ${error ? '#FECACA' : focused ? '#1D4ED8' : '#E2E8F0'}`,
              borderRadius: '10px', padding: '0 14px', fontSize: '15px', fontFamily: 'Inter, sans-serif',
              outline: 'none', boxSizing: 'border-box',
              boxShadow: focused ? '0 0 0 3px rgba(29,78,216,.1)' : 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
          />
        </div>
        <button
          onClick={submit}
          disabled={!input}
          style={{
            width: '100%', height: '48px', background: input ? '#1D4ED8' : '#E2E8F0',
            color: input ? '#fff' : '#94A3B8', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: input ? 'pointer' : 'not-allowed', transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => { if (input) e.currentTarget.style.background = '#1E40AF' }}
          onMouseLeave={e => { if (input) e.currentTarget.style.background = '#1D4ED8' }}
        >
          {labels.cta}
        </button>
      </div>
    </div>
  )
}

// ── SETUP PASSWORD MODAL ─────────────────────────────────

function SetupPasswordModal({ locale, code, onDone }: { locale: string; code: string; onDone: () => void }) {
  const supabase = createBrowserClient()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDE = locale !== 'en'
  const labels = {
    title: isDE ? 'Persönliches Passwort festlegen' : 'Set your personal password',
    sub: isDE
      ? 'Dein Designer hat dir ein Einmalpasswort geschickt. Lege jetzt dein eigenes fest — nur du kennst es danach.'
      : 'Your designer sent you a one-time password. Set your own now — only you will know it.',
    pw1: isDE ? 'Neues Passwort' : 'New password',
    pw2: isDE ? 'Passwort bestätigen' : 'Confirm password',
    cta: isDE ? 'Passwort speichern' : 'Save password',
    errShort: isDE ? 'Mindestens 4 Zeichen.' : 'At least 4 characters.',
    errMismatch: isDE ? 'Passwörter stimmen nicht überein.' : 'Passwords do not match.',
  }

  const handleSubmit = async () => {
    if (pw.length < 4) { setError(labels.errShort); return }
    if (pw !== pw2) { setError(labels.errMismatch); return }
    setLoading(true)
    await (supabase as any).from('projects')
      .update({ pitch_password: pw, pitch_password_changed: true })
      .eq('code', code)
    setLoading(false)
    onDone()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '36px', boxShadow: '0 32px 80px rgba(0,0,0,.3)', animation: 'dropIn 200ms ease-out' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <KeyRound size={22} color="#1D4ED8" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
          {labels.title}
        </h2>
        <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '28px', lineHeight: 1.6 }}>
          {labels.sub}
        </p>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#DC2626' }}>{error}</span>
          </div>
        )}
        <Input label={labels.pw1} type="password" placeholder="••••••••" value={pw} onChange={e => { setPw(e.target.value); setError('') }} autoFocus />
        <Input label={labels.pw2} type="password" placeholder="••••••••" value={pw2} onChange={e => { setPw2(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit} style={{ height: '48px', fontSize: '15px' }} disabled={!pw || !pw2}>
          {labels.cta}
        </Button>
      </div>
    </div>
  )
}

// ── AUTH MODAL ────────────────────────────────────────────

function AuthModal({ t, onClose, onSuccess }: {
  t: typeof T.de
  onClose: () => void
  onSuccess: (userId: string, name: string) => void
}) {
  const supabase = createBrowserClient()
  const [tab, setTab] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup() {
    setLoading(true); setError('')
    const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (e || !data.user) { setError(t.authError); setLoading(false); return }
    await (supabase as any).from('profiles').upsert({ id: data.user.id, name, email })
    onSuccess(data.user.id, name)
  }

  async function handleLogin() {
    setLoading(true); setError('')
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e || !data.user) { setError(t.authError); setLoading(false); return }
    const { data: profile } = await (supabase as any).from('profiles').select('name').eq('id', data.user.id).single() as { data: { name: string } | null }
    onSuccess(data.user.id, profile?.name ?? email)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.3)', animation: 'dropIn 200ms ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>{t.authRequired}</div>
            <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '4px' }}>{t.authSub}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#F8FAFC', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
          {(['signup', 'login'] as const).map(tp => (
            <button
              key={tp}
              onClick={() => { setTab(tp); setError('') }}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', background: tab === tp ? '#fff' : 'transparent', color: tab === tp ? '#0F172A' : '#64748B', boxShadow: tab === tp ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all 150ms' }}
            >
              {tp === 'signup' ? t.signupTab : t.loginTab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {tab === 'signup' && (
            <Input label={t.name} value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: '12px' }} />
          )}
          <Input label={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '12px' }} />
          <Input label={t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} error={error} style={{ marginBottom: '4px' }} />
        </div>

        <Button
          variant="primary"
          fullWidth
          loading={loading}
          icon={tab === 'signup' ? <UserPlus size={15} /> : <LogIn size={15} />}
          onClick={tab === 'signup' ? handleSignup : handleLogin}
          style={{ marginTop: '16px' }}
        >
          {tab === 'signup' ? t.signupBtn : t.loginBtn}
        </Button>
      </div>
    </div>
  )
}

// ── TOGGLE ────────────────────────────────────────────────

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: '48px', height: '24px', borderRadius: '9999px', background: on ? '#1D4ED8' : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 200ms', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '27px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left 200ms' }} />
    </div>
  )
}

// ── COMMENT PIN ───────────────────────────────────────────

function CommentPin({ pin, number, active, onClick, t }: { pin: Pin; number: number; active: boolean; onClick: () => void; t: typeof T.de }) {
  const [hov, setHov] = useState(false)
  const initials = pin.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ position: 'absolute', left: `${pin.x_pct}%`, top: `${pin.y_pct}%`, zIndex: 10 }}>
      <div
        onClick={e => { e.stopPropagation(); onClick() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '28px', height: '28px',
          borderRadius: '50% 50% 50% 0',
          background: '#1D4ED8', border: '2px solid #fff',
          boxShadow: active ? '0 0 0 4px rgba(29,78,216,.3)' : '0 2px 8px rgba(0,0,0,.25)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov ? 'scale(1.1)' : active ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 200ms', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff', marginTop: '-2px' }}>{number}</span>
      </div>
      {(hov || active) && (
        <div style={{
          position: 'absolute', left: '36px', top: '-8px',
          width: '280px', background: '#fff',
          border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 20,
          animation: 'dropIn 150ms ease-out',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff', flexShrink: 0 }}>{initials}</div>
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>{pin.author}</span>
            <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginLeft: 'auto' }}>
              {new Date(pin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.5 }}>{pin.comment}</div>
          <div style={{ fontSize: '13px', color: '#1D4ED8', fontFamily: 'Inter, sans-serif', marginTop: '10px', cursor: 'pointer' }}>{t.reply}</div>
        </div>
      )}
    </div>
  )
}

// ── NEW COMMENT POPOVER ───────────────────────────────────

function NewCommentPopover({ pos, onClose, onSubmit, placeholder, cancelLabel, sendLabel, showNameField, namePlaceholder }: {
  pos: { x: number; y: number }
  onClose: () => void
  onSubmit: (text: string, name?: string) => void
  placeholder: string
  cancelLabel: string
  sendLabel: string
  showNameField?: boolean
  namePlaceholder?: string
}) {
  const [text, setText] = useState('')
  const [name, setName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('commenter_name') ?? ''
  })
  const [focused, setFocused] = useState(false)
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: 'absolute', left: `calc(${pos.x}% + 32px)`, top: `calc(${pos.y}% - 8px)`,
      width: '300px', background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: '12px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 30,
      animation: 'dropIn 150ms ease-out',
    }}>
      {showNameField && (
        <input
          value={name}
          onChange={e => {
            setName(e.target.value)
            localStorage.setItem('commenter_name', e.target.value)
          }}
          placeholder={namePlaceholder}
          style={{
            width: '100%', height: '36px', border: '1.5px solid #E2E8F0',
            borderRadius: '8px', padding: '0 12px', fontSize: '13px',
            fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none',
            marginBottom: '8px', boxSizing: 'border-box',
          }}
        />
      )}
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', minHeight: '80px', border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
          borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          color: '#0F172A', resize: 'none', outline: 'none', transition: 'border-color 150ms',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <Button variant="ghost" size="sm" onClick={onClose}>{cancelLabel}</Button>
        <Button variant="primary" size="sm" onClick={() => text.trim() && onSubmit(text, name.trim() || undefined)}>{sendLabel}</Button>
      </div>
    </div>
  )
}

// ── COMMENT SIDEBAR ───────────────────────────────────────

function CommentSidebar({ pins, title, onClose, onPinClick, isMobile, topOffset }: {
  pins: Pin[]; title: string; onClose: () => void; onPinClick: (id: string) => void
  isMobile?: boolean; topOffset?: number
}) {
  const top = topOffset ?? 112
  return (
    <div style={{
      position: 'fixed', right: 0, top: `${top}px`, bottom: 0,
      width: isMobile ? '100%' : '320px',
      background: '#fff',
      borderLeft: isMobile ? 'none' : '1px solid #E2E8F0',
      borderTop: isMobile ? '1px solid #E2E8F0' : 'none',
      zIndex: 40, display: 'flex', flexDirection: 'column',
      boxShadow: isMobile ? '0 -8px 32px rgba(0,0,0,.15)' : 'none',
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
          {title}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <X size={18} color="#64748B" />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pins.map((pin, i) => (
          <div
            key={pin.id}
            onClick={() => onPinClick(pin.id)}
            style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px', background: '#F8FAFC', cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1D4ED8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', lineHeight: 1.4 }}>{pin.comment}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{pin.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
