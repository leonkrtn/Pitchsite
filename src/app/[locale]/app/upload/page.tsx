'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle2, Copy, Share2, Check } from 'lucide-react'
import { Button, Input, Textarea, Divider, StepLabel } from '@/components/app/ds'
import { DashboardLayout } from '@/components/app/AppSidebar'
import { createBrowserClient } from '@/lib/supabase'

const T = {
  de: {
    breadcrumb: 'Dashboard',
    breadcrumbCurrent: 'Neues Projekt',
    title: 'Neues Projekt erstellen',
    sub: 'Lade dein Design hoch und erhalte einen einzigartigen Code für deinen Kunden.',
    step1: 'Projektdetails',
    step1b: 'Kundeninfos (optional)',
    step2: 'Design hochladen',
    step3: 'Aktionen',
    nameLabel: 'Projektname',
    namePh: 'z.B. Weber & Partner — Website Relaunch',
    amountLabel: 'Honorar (€)',
    amountPh: '2400',
    dateLabel: 'Geplante Lieferung',
    descLabel: 'Beschreibung / Scope of Work',
    descPh: 'Was beinhaltet dieses Projekt? (wird im Vertrag verwendet)',
    clientCompanyLabel: 'Firmenname',
    clientCompanyPh: 'z.B. Weber & Partner GmbH',
    clientContactLabel: 'Ansprechperson',
    clientContactPh: 'z.B. Max Mustermann',
    clientEmailLabel: 'E-Mail',
    clientEmailPh: 'kunde@beispiel.de',
    clientPhoneLabel: 'Telefon',
    clientPhonePh: '+49 170 123456',
    clientWebsiteLabel: 'Website',
    clientWebsitePh: 'https://weber-partner.de',
    uploadCta: 'Klicke hier um dein Design auszuwählen',
    uploadSub: 'HTML-Datei oder ZIP-Archiv · Max. 50 MB',
    uploadBtn: 'Datei auswählen',
    uploading: 'Datei wird verarbeitet…',
    uploadSuccess: 'Upload erfolgreich!',
    codeLabel: 'Dein Projektcode:',
    copyCode: 'Code kopieren',
    copied: 'Kopiert!',
    shareLink: 'Link teilen',
    cancel: 'Abbrechen',
    submit: 'Pitch erstellen',
    loading: 'Erstelle…',
    errorUpload: 'Upload fehlgeschlagen. Bitte versuche es erneut.',
    errorCreate: 'Projekt konnte nicht erstellt werden.',
    errorNoFile: 'Bitte lade zuerst eine Datei hoch.',
    errorNoName: 'Bitte gib einen Projektnamen ein.',
  },
  en: {
    breadcrumb: 'Dashboard',
    breadcrumbCurrent: 'New project',
    title: 'Create new project',
    sub: 'Upload your design and get a unique code for your client.',
    step1: 'Project details',
    step1b: 'Client info (optional)',
    step2: 'Upload design',
    step3: 'Actions',
    nameLabel: 'Project name',
    namePh: 'e.g. Weber & Partner — Website Relaunch',
    amountLabel: 'Fee (€)',
    amountPh: '2400',
    dateLabel: 'Planned delivery',
    descLabel: 'Description / Scope of work',
    descPh: 'What does this project include? (used in the contract)',
    clientCompanyLabel: 'Company name',
    clientCompanyPh: 'e.g. Weber & Partner Ltd.',
    clientContactLabel: 'Contact person',
    clientContactPh: 'e.g. John Smith',
    clientEmailLabel: 'Email',
    clientEmailPh: 'client@example.com',
    clientPhoneLabel: 'Phone',
    clientPhonePh: '+44 7700 900123',
    clientWebsiteLabel: 'Website',
    clientWebsitePh: 'https://weber-partner.com',
    uploadCta: 'Click here to select your design',
    uploadSub: 'HTML file or ZIP archive · Max. 50 MB',
    uploadBtn: 'Choose file',
    uploading: 'Processing file…',
    uploadSuccess: 'Upload successful!',
    codeLabel: 'Your project code:',
    copyCode: 'Copy code',
    copied: 'Copied!',
    shareLink: 'Share link',
    cancel: 'Cancel',
    submit: 'Create pitch',
    loading: 'Creating…',
    errorUpload: 'Upload failed. Please try again.',
    errorCreate: 'Could not create project.',
    errorNoFile: 'Please upload a file first.',
    errorNoName: 'Please enter a project name.',
  },
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function UploadPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = T[locale as 'de' | 'en'] ?? T.de
  const router = useRouter()
  const supabase = createBrowserClient()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientWebsite, setClientWebsite] = useState('')
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const handleFileChange = async (file: File) => {
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      setError('Datei zu groß (max. 50 MB)')
      return
    }

    setFileName(file.name)
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
    setUploadState('loading')
    setProgress(0)
    setError('')

    const code = generateCode()
    setProjectCode(code)

    // Simulate progress while uploading
    let p = 0
    intervalRef.current = setInterval(() => {
      p += Math.random() * 8 + 2
      if (p >= 85) { clearInterval(intervalRef.current); p = 85 }
      setProgress(Math.min(p, 85))
    }, 120)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/${locale}/app/login`); return }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${code}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('design-uploads')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    clearInterval(intervalRef.current)

    if (uploadError) {
      setUploadState('idle')
      setProgress(0)
      setError(t.errorUpload)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('design-uploads').getPublicUrl(path)
    setFileUrl(publicUrl)
    setProgress(100)
    setTimeout(() => setUploadState('success'), 300)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError(t.errorNoName); return }
    if (uploadState !== 'success') { setError(t.errorNoFile); return }

    setSubmitLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/${locale}/app/login`); return }

    const { data, error: createError } = await (supabase as any)
      .from('projects')
      .insert({
        designer_id: user.id,
        name: name.trim(),
        code: projectCode,
        amount: amount ? parseFloat(amount) : null,
        delivery_date: date || null,
        description: desc.trim() || null,
        file_url: fileUrl,
        file_name: fileName,
        status: 'offen',
        client_name: clientContact.trim() || null,
        client_email: clientEmail.trim() || null,
        client_phone: clientPhone.trim() || null,
        client_company: clientCompany.trim() || null,
        client_website: clientWebsite.trim() || null,
      })
      .select()
      .single() as { data: { id: string } | null; error: Error | null }

    setSubmitLoading(false)

    if (createError || !data) {
      setError(t.errorCreate)
      return
    }

    router.push(`/${locale}/app/project/${data.id}`)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(projectCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout locale={locale} activeSection="upload">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '32px' }}>
          <span onClick={() => router.push(`/${locale}/app/dashboard`)} style={{ color: '#1D4ED8', cursor: 'pointer' }}>{t.breadcrumb}</span>
          <span> / {t.breadcrumbCurrent}</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A', marginBottom: '8px' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '40px' }}>
          {t.sub}
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Step 1 */}
        <StepLabel number={1} title={t.step1} />

        <Input
          label={t.nameLabel} placeholder={t.namePh}
          value={name} onChange={e => setName(e.target.value)} required
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            label={t.amountLabel} type="number" placeholder={t.amountPh}
            value={amount} onChange={e => setAmount(e.target.value)}
            prefix="€" style={{ flex: 1 }}
          />
          <Input
            label={t.dateLabel} type="date"
            value={date} onChange={e => setDate(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <Textarea
          label={t.descLabel} placeholder={t.descPh}
          value={desc} onChange={e => setDesc(e.target.value)} rows={4}
        />

        <div style={{ height: '8px' }} />
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: '12px', padding: '24px', marginBottom: '8px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
            {t.step1b}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Input
              label={t.clientCompanyLabel} placeholder={t.clientCompanyPh}
              value={clientCompany} onChange={e => setClientCompany(e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Input
              label={t.clientContactLabel} placeholder={t.clientContactPh}
              value={clientContact} onChange={e => setClientContact(e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
          </div>
          <div style={{ height: '16px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
            <Input
              label={t.clientEmailLabel} type="email" placeholder={t.clientEmailPh}
              value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Input
              label={t.clientPhoneLabel} type="tel" placeholder={t.clientPhonePh}
              value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
          </div>
          <div style={{ height: '16px' }} />
          <Input
            label={t.clientWebsiteLabel} placeholder={t.clientWebsitePh}
            value={clientWebsite} onChange={e => setClientWebsite(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        <Divider style={{ margin: '32px 0' }} />

        {/* Step 2 */}
        <StepLabel number={2} title={t.step2} />

        {/* Hidden file input */}
        <input
          ref={fileRef} type="file" accept=".html,.zip"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }}
        />

        {uploadState === 'idle' && (
          <UploadZone
            cta={t.uploadCta} sub={t.uploadSub} btnLabel={t.uploadBtn}
            onUpload={() => fileRef.current?.click()}
          />
        )}
        {uploadState === 'loading' && (
          <UploadProgress progress={progress} fileName={fileName} fileSize={fileSize} label={t.uploading} />
        )}
        {uploadState === 'success' && (
          <UploadSuccess
            code={projectCode}
            copied={copied}
            onCopy={handleCopyCode}
            locale={locale}
            successLabel={t.uploadSuccess}
            codeLabel={t.codeLabel}
            copyLabel={t.copyCode}
            copiedLabel={t.copied}
            shareLabel={t.shareLink}
          />
        )}

        <Divider style={{ margin: '32px 0' }} />

        {/* Step 3 */}
        <StepLabel number={3} title={t.step3} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="ghost" onClick={() => router.push(`/${locale}/app/dashboard`)}>{t.cancel}</Button>
          <Button
            variant="primary"
            loading={submitLoading}
            disabled={uploadState !== 'success'}
            onClick={handleSubmit}
            style={{ height: '44px' }}
          >
            {t.submit}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ── UPLOAD ZONE ───────────────────────────────────────────

function UploadZone({ cta, sub, btnLabel, onUpload }: { cta: string; sub: string; btnLabel: string; onUpload: () => void }) {
  const [hov, setHov] = useState(false)
  const [drag, setDrag] = useState(false)

  return (
    <div
      onClick={onUpload}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); onUpload() }}
      style={{
        background: hov || drag ? '#EFF6FF' : '#F8FAFC',
        border: `2px dashed ${hov || drag ? '#1D4ED8' : '#CBD5E1'}`,
        borderRadius: '12px', padding: '48px 32px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'all 200ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <Upload size={48} color={hov || drag ? '#1D4ED8' : '#CBD5E1'} />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#374151' }}>
        {cta}
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginTop: '4px' }}>
        {sub}
      </div>
      <div style={{ marginTop: '20px' }}>
        <Button variant="secondary" size="sm" onClick={() => onUpload()}>
          {btnLabel}
        </Button>
      </div>
    </div>
  )
}

// ── UPLOAD PROGRESS ───────────────────────────────────────

function UploadProgress({ progress, fileName, fileSize, label }: { progress: number; fileName: string; fileSize: string; label: string }) {
  return (
    <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '32px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F172A', marginBottom: '4px' }}>
        {fileName}
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginBottom: '20px' }}>{fileSize}</div>
      <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '9999px',
          background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
          width: `${progress}%`, transition: 'width 120ms linear',
        }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#1D4ED8', marginTop: '6px' }}>
        {Math.round(progress)}%
      </div>
      <div style={{ textAlign: 'center', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '12px' }}>
        {label}
      </div>
    </div>
  )
}

// ── UPLOAD SUCCESS ────────────────────────────────────────

function UploadSuccess({ code, copied, onCopy, locale, successLabel, codeLabel, copyLabel, copiedLabel, shareLabel }: {
  code: string; copied: boolean; onCopy: () => void; locale: string;
  successLabel: string; codeLabel: string; copyLabel: string; copiedLabel: string; shareLabel: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t) }, [])
  const pitchUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/app/pitch/${code}` : `/${locale}/app/pitch/${code}`

  return (
    <div style={{
      background: '#F0FDF4', border: '2px solid #86EFAC',
      borderRadius: '12px', padding: '32px',
      textAlign: 'center',
      opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 400ms cubic-bezier(.34,1.56,.64,1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <div style={{ animation: 'successPop 400ms cubic-bezier(.34,1.56,.64,1)' }}>
          <CheckCircle2 size={48} color="#16A34A" />
        </div>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#166534' }}>
        {successLabel}
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#64748B', marginTop: '20px', marginBottom: '8px' }}>
        {codeLabel}
      </div>
      <div style={{ background: '#0F172A', borderRadius: '12px', padding: '20px 28px', display: 'inline-block', marginBottom: '20px' }}>
        <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: '"Geist Mono", "Courier New", monospace', color: '#fff', letterSpacing: '0.15em' }}>
          {code}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
        <Button
          variant="secondary" size="sm"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={onCopy}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
        <Button
          variant="ghost" size="sm"
          icon={<Share2 size={14} />}
          onClick={() => navigator.clipboard.writeText(pitchUrl)}
        >
          {shareLabel}
        </Button>
      </div>
      <div style={{ fontSize: '13px', fontFamily: '"Geist Mono", monospace', color: '#64748B', background: '#F1F5F9', padding: '8px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
        {pitchUrl}
      </div>
    </div>
  )
}
