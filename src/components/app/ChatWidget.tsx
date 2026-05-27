'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

interface Message {
  id: string
  project_id: string
  sender_name: string
  sender_id: string | null
  is_designer: boolean
  message: string
  created_at: string
  read_by_designer: boolean
}

interface ChatWidgetProps {
  projectId: string
  senderName: string
  isDesigner: boolean
  senderId?: string | null
  mode?: 'floating' | 'inline'
  locale?: string
  bottomOffset?: number
}

const T = {
  de: {
    title: 'Nachrichten',
    placeholder: 'Nachricht schreiben…',
    empty: 'Noch keine Nachrichten. Schreib die erste!',
    you: 'Du',
    designer: 'Designer',
  },
  en: {
    title: 'Messages',
    placeholder: 'Write a message…',
    empty: 'No messages yet. Write the first one!',
    you: 'You',
    designer: 'Designer',
  },
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'de-DE', {
    hour: '2-digit', minute: '2-digit',
  })
}

function ChatBubble({ msg, isOwn, locale }: { msg: Message; isOwn: boolean; locale: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#94A3B8', marginBottom: '4px', padding: '0 4px' }}>
        {msg.sender_name} · {formatTime(msg.created_at, locale)}
      </div>
      <div style={{
        maxWidth: '82%', padding: '10px 14px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isOwn ? '#1D4ED8' : '#F1F5F9',
        color: isOwn ? '#fff' : '#0F172A',
        fontSize: '14px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {msg.message}
      </div>
    </div>
  )
}

function ChatPanel({
  messages, text, setText, onSend, sending, bottomRef, t, locale, isDesigner,
}: {
  messages: Message[]
  text: string
  setText: (v: string) => void
  onSend: () => void
  sending: boolean
  bottomRef: React.RefObject<HTMLDivElement | null>
  t: typeof T.de
  locale: string
  isDesigner: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif', fontSize: '13px', padding: '24px' }}>
            {t.empty}
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isOwn={isDesigner ? msg.is_designer : !msg.is_designer}
              locale={locale}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-end', background: '#fff' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={t.placeholder}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
            borderRadius: '10px', padding: '9px 12px', fontSize: '14px',
            fontFamily: 'Inter, sans-serif', color: '#0F172A', outline: 'none',
            transition: 'border-color 150ms', lineHeight: 1.5,
            maxHeight: '96px', overflowY: 'auto',
          }}
        />
        <button
          onClick={onSend}
          disabled={!text.trim() || sending}
          style={{
            width: '38px', height: '38px', borderRadius: '10px', border: 'none',
            background: text.trim() && !sending ? '#1D4ED8' : '#E2E8F0',
            cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 150ms', flexShrink: 0,
          }}
        >
          <Send size={15} color={text.trim() && !sending ? '#fff' : '#94A3B8'} />
        </button>
      </div>
    </div>
  )
}

export function ChatWidget({
  projectId, senderName, isDesigner, senderId, mode = 'floating', locale = 'de', bottomOffset = 0,
}: ChatWidgetProps) {
  const supabase = createBrowserClient()
  const t = T[locale as 'de' | 'en'] ?? T.de

  const [open, setOpen] = useState(mode === 'inline')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }) as { data: Message[] | null }

      if (data) {
        setMessages(data)
        if (isDesigner) {
          setUnread(data.filter(m => !m.is_designer && !m.read_by_designer).length)
        }
      }
    }
    load()

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload: any) => {
        const msg = payload.new as Message
        setMessages(prev => [...prev, msg])
        if (isDesigner && !msg.is_designer) {
          setUnread(prev => prev + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  // Scroll to bottom when messages arrive or panel opens
  useEffect(() => {
    if (open || mode === 'inline') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, open])

  // Mark as read when designer opens the panel
  useEffect(() => {
    if ((open || mode === 'inline') && isDesigner && unread > 0) {
      setUnread(0)
      ;(supabase as any)
        .from('project_messages')
        .update({ read_by_designer: true })
        .eq('project_id', projectId)
        .eq('is_designer', false)
        .eq('read_by_designer', false)
    }
  }, [open, isDesigner])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await (supabase as any).from('project_messages').insert({
      project_id: projectId,
      sender_name: senderName,
      sender_id: senderId ?? null,
      is_designer: isDesigner,
      message: text.trim(),
    })
    setText('')
    setSending(false)
  }

  const panelContent = (
    <ChatPanel
      messages={messages}
      text={text}
      setText={setText}
      onSend={handleSend}
      sending={sending}
      bottomRef={bottomRef}
      t={t}
      locale={locale}
      isDesigner={isDesigner}
    />
  )

  // ── INLINE mode (used in project detail page) ─────────────
  if (mode === 'inline') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '440px', background: '#fff' }}>
        {panelContent}
      </div>
    )
  }

  // ── FLOATING mode (pitch + viewer pages) ──────────────────
  const buttonBottom = 24 + bottomOffset
  const panelBottom = buttonBottom + 64

  return (
    <>
      {/* Floating panel */}
      {open && (
        <div style={{
          position: 'fixed', right: '24px', bottom: `${panelBottom}px`,
          width: '340px', height: '440px',
          background: '#fff', borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 16px 48px rgba(0,0,0,.18)',
          zIndex: 200,
          display: 'flex', flexDirection: 'column',
          animation: 'dropIn 180ms ease-out',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            height: '52px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', flexShrink: 0, background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F172A' }}>
                {t.title}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
          </div>
          {panelContent}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', right: '24px', bottom: `${buttonBottom}px`,
          width: '52px', height: '52px',
          background: open ? '#0F172A' : '#1D4ED8',
          border: 'none', borderRadius: '50%',
          boxShadow: '0 4px 16px rgba(29,78,216,.4)',
          cursor: 'pointer', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 200ms, transform 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={20} color="#fff" />}
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#EF4444', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#fff',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </>
  )
}
