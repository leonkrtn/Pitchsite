'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, Mail, Send, Check } from 'lucide-react'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { Button, Input, Textarea, Toast } from '@/components/app/ds'
import { createBrowserClient } from '@/lib/supabase'

const FAQ_DE = [
  {
    category: 'Erste Schritte',
    items: [
      { q: 'Wie erstelle ich mein erstes Projekt?', a: 'Klicke auf der Übersicht oben rechts auf „Neues Projekt". Lade anschließend dein Design hoch, gib Projektdetails wie Projektname, Kundendaten und Betrag ein und teile den generierten Link mit deinem Kunden.' },
      { q: 'Wie teile ich ein Pitch mit meinem Kunden?', a: 'Nach dem Erstellen eines Projekts erhältst du einen einzigartigen Pitch-Link (z. B. pitchsite.de/pitch/XXXXX). Diesen kannst du direkt per E-Mail oder Messenger an deinen Kunden weitergeben. Kein Login für den Kunden erforderlich.' },
      { q: 'Welche Dateiformate werden unterstützt?', a: 'Derzeit unterstützen wir PDF- und Bilddateien (PNG, JPG, WEBP). Weitere Formate wie Figma, Sketch und Adobe XD sind in Planung.' },
    ],
  },
  {
    category: 'Pitch & Feedback',
    items: [
      { q: 'Wie hinterlässt ein Kunde Feedback?', a: 'Dein Kunde öffnet den Pitch-Link und kann direkt im Design auf beliebige Stellen klicken, um einen Kommentar zu hinterlassen. Kein Account erforderlich – er gibt einfach seinen Namen und den Kommentar ein.' },
      { q: 'Kann ich Kommentare als erledigt markieren?', a: 'Ja. In der Projektdetailansicht siehst du alle offenen Kommentare. Du kannst jeden einzelnen als „gelöst" markieren, um die Übersicht zu behalten.' },
      { q: 'Wie viele Kunden können gleichzeitig Feedback geben?', a: 'Es gibt keine Einschränkung bei der Anzahl der Personen, die über denselben Pitch-Link Feedback geben können.' },
    ],
  },
  {
    category: 'Zahlung & Escrow',
    items: [
      { q: 'Was ist das Escrow-System?', a: 'Wenn ein Kunde den Pitch akzeptiert und den Vertrag unterzeichnet, zahlt er den vereinbarten Betrag in ein sicheres Treuhandkonto (Escrow). Das Geld wird erst an dich ausgezahlt, wenn der Kunde die Lieferung bestätigt hat.' },
      { q: 'Wann werde ich ausgezahlt?', a: 'Die Auszahlung erfolgt, sobald dein Kunde die Lieferung offiziell bestätigt hat. Der Status wechselt dann von „In Escrow" auf „Abgeschlossen" und die Auszahlung wird initiiert.' },
      { q: 'Welche Zahlungsmethoden werden unterstützt?', a: 'Wir unterstützen Kreditkarte, SEPA-Lastschrift und SOFORT-Überweisung über Stripe. Weitere Methoden werden schrittweise ergänzt.' },
      { q: 'Fallen Gebühren an?', a: 'Pitchsite berechnet eine Servicegebühr von 3 % auf den Projektwert. Stripe-Transaktionsgebühren kommen je nach Zahlungsmethode noch hinzu.' },
    ],
  },
  {
    category: 'Verträge',
    items: [
      { q: 'Wie funktioniert die digitale Signatur?', a: 'Wenn dein Kunde den Pitch akzeptiert, wird ihm automatisch ein Vertrag mit den vereinbarten Konditionen zugeschickt. Er kann diesen direkt im Browser mit einer digitalen Unterschrift unterzeichnen.' },
      { q: 'Ist der Vertrag rechtlich bindend?', a: 'Ja. Digitale Signaturen sind in Deutschland und der EU gemäß der eIDAS-Verordnung rechtlich anerkannt. Wir empfehlen dennoch, bei größeren Projekten einen Anwalt hinzuzuziehen.' },
      { q: 'Kann ich eine eigene Vertragsvorlage verwenden?', a: 'Diese Funktion ist in der Pro-Version geplant. Derzeit wird ein standardisierter Pitchsite-Vertrag verwendet.' },
    ],
  },
  {
    category: 'Konto & Einstellungen',
    items: [
      { q: 'Wie ändere ich mein Passwort?', a: 'Gehe zu Einstellungen → Sicherheit und gib dein aktuelles sowie dein neues Passwort ein. Klicke anschließend auf „Passwort ändern".' },
      { q: 'Kann ich meinen Account löschen?', a: 'Ja. In den Einstellungen unter „Gefahrenzone" kannst du deinen Account und alle damit verbundenen Daten dauerhaft löschen. Diese Aktion ist nicht reversibel.' },
      { q: 'Welche Daten werden über mich gespeichert?', a: 'Wir speichern deinen Namen, deine E-Mail-Adresse sowie die Projektdaten, die du auf der Plattform erstellst. Du kannst jederzeit eine Kopie deiner Daten anfordern (DSGVO-konform).' },
    ],
  },
]

const FAQ_EN = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I create my first project?', a: 'Click "New project" in the top right of the overview. Upload your design, fill in project details like name, client info, and amount, then share the generated link with your client.' },
      { q: 'How do I share a pitch with my client?', a: 'After creating a project, you receive a unique pitch link (e.g. pitchsite.de/pitch/XXXXX). Share it via email or messenger. No login required for your client.' },
      { q: 'Which file formats are supported?', a: 'Currently we support PDF and image files (PNG, JPG, WEBP). More formats like Figma, Sketch, and Adobe XD are planned.' },
    ],
  },
  {
    category: 'Pitch & Feedback',
    items: [
      { q: 'How does a client leave feedback?', a: 'Your client opens the pitch link and can click anywhere on the design to leave a comment. No account required – they just enter their name and comment.' },
      { q: 'Can I mark comments as resolved?', a: 'Yes. In the project detail view you can see all open comments. Mark each one as "resolved" to keep track of progress.' },
      { q: 'How many clients can give feedback at the same time?', a: 'There is no limit on the number of people who can give feedback via the same pitch link.' },
    ],
  },
  {
    category: 'Payment & Escrow',
    items: [
      { q: 'What is the escrow system?', a: 'When a client accepts a pitch and signs the contract, they pay the agreed amount into a secure escrow account. The money is released to you once the client confirms delivery.' },
      { q: 'When will I get paid?', a: 'Payment is released once your client officially confirms delivery. The status changes from "In Escrow" to "Completed" and the payout is initiated.' },
      { q: 'Which payment methods are supported?', a: 'We support credit card, SEPA direct debit, and SOFORT via Stripe. More methods will be added over time.' },
      { q: 'Are there fees?', a: 'Pitchsite charges a 3% service fee on the project value. Stripe transaction fees may apply depending on the payment method.' },
    ],
  },
  {
    category: 'Contracts',
    items: [
      { q: 'How does the digital signature work?', a: 'When your client accepts the pitch, a contract with the agreed terms is automatically sent to them. They can sign it digitally directly in the browser.' },
      { q: 'Is the contract legally binding?', a: 'Yes. Digital signatures are legally recognized in Germany and the EU under the eIDAS regulation. We still recommend consulting a lawyer for larger projects.' },
      { q: 'Can I use my own contract template?', a: 'This feature is planned for the Pro version. Currently, a standardized Pitchsite contract is used.' },
    ],
  },
  {
    category: 'Account & Settings',
    items: [
      { q: 'How do I change my password?', a: 'Go to Settings → Security and enter your current and new password. Click "Change password".' },
      { q: 'Can I delete my account?', a: 'Yes. In Settings under "Danger zone" you can permanently delete your account and all associated data. This action is irreversible.' },
      { q: 'What data is stored about me?', a: 'We store your name, email address, and the project data you create on the platform. You can request a copy of your data at any time (GDPR compliant).' },
    ],
  },
]

const T = {
  de: {
    title: 'Hilfe',
    subtitle: 'Finde schnell Antworten oder kontaktiere uns direkt',
    searchPlaceholder: 'FAQ durchsuchen…',
    faqTitle: 'Häufig gestellte Fragen',
    contactTitle: 'Kontakt aufnehmen',
    contactSubtitle: 'Wir antworten in der Regel innerhalb von 24 Stunden.',
    form: {
      name: 'Dein Name',
      email: 'Deine E-Mail-Adresse',
      subject: 'Betreff',
      message: 'Nachricht',
      send: 'Nachricht senden',
      sent: 'Nachricht gesendet!',
      sentDesc: 'Wir haben deine Anfrage erhalten und melden uns bald.',
    },
    supportEmail: 'support@pitchsite.de',
    noResults: 'Keine Ergebnisse gefunden.',
    errors: { generic: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
  },
  en: {
    title: 'Help',
    subtitle: 'Find answers quickly or contact us directly',
    searchPlaceholder: 'Search FAQ…',
    faqTitle: 'Frequently asked questions',
    contactTitle: 'Get in touch',
    contactSubtitle: 'We typically reply within 24 hours.',
    form: {
      name: 'Your name',
      email: 'Your email address',
      subject: 'Subject',
      message: 'Message',
      send: 'Send message',
      sent: 'Message sent!',
      sentDesc: 'We received your request and will get back to you soon.',
    },
    supportEmail: 'support@pitchsite.de',
    noResults: 'No results found.',
    errors: { generic: 'An error occurred. Please try again.' },
  },
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const [hov, setHov] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', cursor: 'pointer', gap: '16px',
        }}
      >
        <span style={{
          fontSize: '14px', fontWeight: open ? 600 : 500,
          fontFamily: 'Inter, sans-serif',
          color: open ? '#0F172A' : hov ? '#1D4ED8' : '#0F172A',
          transition: 'color 120ms', lineHeight: '1.4',
        }}>{q}</span>
        <span style={{
          color: '#CBD5E1', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 200ms', display: 'flex',
        }}>
          <ChevronDown size={16} />
        </span>
      </div>
      {open && (
        <div style={{
          fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B',
          lineHeight: '1.65', paddingBottom: '16px',
          animation: 'fadeInUp 150ms ease-out',
        }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function HelpPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const faqData = locale === 'en' ? FAQ_EN : FAQ_DE
  const router = useRouter()
  const supabase = createBrowserClient()

  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('PS')
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

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

      const { data: profile } = await (supabase as any)
        .from('profiles').select('name, email').eq('id', user.id).single() as { data: { name: string; email: string } | null }
      if (profile) {
        setUserName(profile.name ?? '')
        setUserInitials(profile.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'PS')
        setFormName(profile.name ?? '')
        setFormEmail(profile.email ?? user.email ?? '')
      }
    }
    load()
  }, [])

  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqData
    const q = searchQuery.toLowerCase()
    return faqData
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0)
  }, [searchQuery, faqData])

  async function sendMessage() {
    if (!formName || !formEmail || !formSubject || !formMessage) return
    setSending(true)
    try {
      await (supabase as any)
        .from('support_messages')
        .insert({
          user_id: userId,
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMessage,
        })
      setSent(true)
      setFormSubject('')
      setFormMessage('')
    } catch {
      showToast(t.errors.generic, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout locale={locale} activeSection="help" userName={userName} userInitials={userInitials}>
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

      {/* Search */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
        padding: '16px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <Search size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A',
            background: 'transparent',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '18px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '20px', alignItems: 'start' }}>
        {/* FAQ */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
          padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '20px' }}>
            {t.faqTitle}
          </div>

          {filteredFaq.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#94A3B8' }}>{t.noResults}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filteredFaq.map(cat => (
                <div key={cat.category}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: '4px',
                  }}>
                    {cat.category}
                  </div>
                  {cat.items.map(item => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact form */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
          padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          position: 'sticky', top: '88px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '4px' }}>
            {t.contactTitle}
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginBottom: '20px' }}>
            {t.contactSubtitle}
          </div>

          {/* Support email */}
          <a href={`mailto:${t.supportEmail}`} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', background: '#F8FAFC',
            border: '1px solid #E2E8F0', borderRadius: '8px',
            marginBottom: '20px', textDecoration: 'none',
          }}>
            <Mail size={15} color="#1D4ED8" />
            <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#1D4ED8', fontWeight: 500 }}>
              {t.supportEmail}
            </span>
          </a>

          {sent ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '32px 0', gap: '12px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={22} color="#16A34A" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                {t.form.sent}
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', textAlign: 'center', lineHeight: '1.5' }}>
                {t.form.sentDesc}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
                {locale === 'de' ? 'Neue Nachricht' : 'New message'}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <Input label={t.form.name} value={formName} onChange={e => setFormName(e.target.value)} style={{ marginBottom: '12px' }} />
              <Input label={t.form.email} type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ marginBottom: '12px' }} />
              <Input label={t.form.subject} value={formSubject} onChange={e => setFormSubject(e.target.value)} style={{ marginBottom: '12px' }} />
              <Textarea label={t.form.message} value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4} style={{ marginBottom: '12px' }} />
              <Button
                variant="primary"
                fullWidth
                loading={sending}
                icon={<Send size={15} />}
                onClick={sendMessage}
                disabled={!formName || !formEmail || !formSubject || !formMessage}
              >
                {t.form.send}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
