import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendConfirmationEmail } from '@/lib/email'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, locale = 'de' } = body ?? {}

  if (!name || String(name).trim().length < 2) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }
  if (!email || !isValidEmail(String(email).trim())) {
    return NextResponse.json({ error: 'Invalid email', code: 'INVALID_EMAIL' }, { status: 400 })
  }

  const cleanName = String(name).trim()
  const cleanEmail = String(email).trim().toLowerCase()
  const supabase = createAdminClient()

  // Check for existing confirmed entry
  const { data: existing } = await (supabase as any)
    .from('waitlist')
    .select('id, confirmed')
    .eq('email', cleanEmail)
    .single() as { data: { id: string; confirmed: boolean } | null }

  if (existing?.confirmed) {
    return NextResponse.json({ error: 'Already registered', code: 'EXISTS' }, { status: 409 })
  }

  const token = crypto.randomUUID()

  if (existing && !existing.confirmed) {
    // Resend confirmation with new token
    await (supabase as any).from('waitlist').update({ token, name: cleanName }).eq('email', cleanEmail)
  } else {
    const { error } = await (supabase as any).from('waitlist').insert({
      name: cleanName,
      email: cleanEmail,
      language: locale,
      token,
    })
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`

  try {
    await sendConfirmationEmail({ to: cleanEmail, name: cleanName, token, locale, baseUrl })
  } catch {
    // Don't fail the whole request if email sending fails — entry is already in DB
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
