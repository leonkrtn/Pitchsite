import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params

  // Check 1: client unlocked via password (httpOnly cookie)
  const unlockCookie = req.cookies.get(`pitch_${code}`)

  // Check 2: authenticated designer (bypasses cookie requirement)
  let isDesigner = false
  if (!unlockCookie) {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => req.cookies.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (user) {
      const admin = createAdminClient()
      const { data: proj } = await (admin as any)
        .from('projects')
        .select('designer_id')
        .eq('code', code)
        .single() as { data: { designer_id: string } | null }
      if (proj?.designer_id === user.id) isDesigner = true
    }
  }

  if (!unlockCookie && !isDesigner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch file_url server-side — never sent to the client
  const supabase = createAdminClient()
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('file_url, file_name')
    .eq('code', code)
    .single() as { data: { file_url: string | null; file_name: string | null } | null }

  if (!project?.file_url) {
    return NextResponse.json({ error: 'No file' }, { status: 404 })
  }

  const fileRes = await fetch(project.file_url)
  if (!fileRes.ok) {
    return NextResponse.json({ error: 'Could not fetch file' }, { status: 502 })
  }

  const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream'
  return new NextResponse(fileRes.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
