import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const COOKIE_PREFIX = 'pitch_'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

// Uses anon key — always available, and projects table allows anon read per RLS.
// The password value stays on the server; only {hasPassword, isUnlocked} / {ok} reach the browser.
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — check whether this pitch is already unlocked (called on page load)
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params

  try {
    const { data: project } = await (db() as any)
      .from('projects')
      .select('pitch_password')
      .eq('code', code)
      .single() as { data: { pitch_password: string | null } | null }

    const hasPassword = !!project?.pitch_password
    const isUnlocked = !!req.cookies.get(`${COOKIE_PREFIX}${code}`)
    return NextResponse.json({ hasPassword, isUnlocked })
  } catch {
    // On any DB error: treat as locked so the gate shows (fail-safe)
    return NextResponse.json({ hasPassword: true, isUnlocked: false })
  }
}

// POST — verify password server-side; set httpOnly cookie on success
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params

  let password: string
  try {
    const body = await req.json()
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  try {
    const { data: project } = await (db() as any)
      .from('projects')
      .select('pitch_password')
      .eq('code', code)
      .single() as { data: { pitch_password: string | null } | null }

    if (!project?.pitch_password || project.pitch_password !== password) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(`${COOKIE_PREFIX}${code}`, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
