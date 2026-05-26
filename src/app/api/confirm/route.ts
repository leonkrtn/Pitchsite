import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/de', req.url))
  }

  const supabase = createAdminClient()

  const { data, error } = await (supabase as any)
    .from('waitlist')
    .select('id, language, confirmed')
    .eq('token', token)
    .single() as { data: { id: string; language: string; confirmed: boolean } | null; error: Error | null }

  if (error || !data) {
    return NextResponse.redirect(new URL('/de', req.url))
  }

  if (!data.confirmed) {
    await (supabase as any).from('waitlist').update({ confirmed: true }).eq('id', data.id)
  }

  const locale = data.language === 'en' ? 'en' : 'de'
  return NextResponse.redirect(new URL(`/${locale}/bestaetigt`, req.url))
}
