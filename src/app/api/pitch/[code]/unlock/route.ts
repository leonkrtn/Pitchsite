import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

const COOKIE_PREFIX = 'pitch_'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

// GET — check whether this pitch is already unlocked (used on page load)
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params
  const supabase = createAdminClient()

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('pitch_password')
    .eq('code', code)
    .single() as { data: { pitch_password: string | null } | null }

  const hasPassword = !!project?.pitch_password
  const isUnlocked = !!req.cookies.get(`${COOKIE_PREFIX}${code}`)

  return NextResponse.json({ hasPassword, isUnlocked })
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

  const supabase = createAdminClient()
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('pitch_password')
    .eq('code', code)
    .single() as { data: { pitch_password: string | null } | null }

  if (!project?.pitch_password || project.pitch_password !== password) {
    return NextResponse.json({ error: 'wrong_password' }, { status: 401 })
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
