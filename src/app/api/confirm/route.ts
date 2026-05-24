import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/de', req.url))
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('waitlist')
    .select('id, language, confirmed')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/de', req.url))
  }

  if (!data.confirmed) {
    await supabase.from('waitlist').update({ confirmed: true }).eq('id', data.id)
  }

  const locale = data.language === 'en' ? 'en' : 'de'
  return NextResponse.redirect(new URL(`/${locale}/bestaetigt`, req.url))
}
