import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params

  // Check 1: client unlocked via password (httpOnly cookie)
  const unlockCookie = req.cookies.get(`pitch_${code}`)

  // Check 2: authenticated designer (Supabase session cookie)
  let isDesigner = false
  if (!unlockCookie) {
    try {
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
        const { data: proj } = await (db() as any)
          .from('projects')
          .select('designer_id')
          .eq('code', code)
          .single() as { data: { designer_id: string } | null }
        if (proj?.designer_id === user.id) isDesigner = true
      }
    } catch {
      // Auth check failed — fall through to unauthorized
    }
  }

  if (!unlockCookie && !isDesigner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch file_url server-side — never exposed to the client
  let fileUrl: string
  try {
    const { data: project } = await (db() as any)
      .from('projects')
      .select('file_url')
      .eq('code', code)
      .single() as { data: { file_url: string | null } | null }

    if (!project?.file_url) {
      return NextResponse.json({ error: 'No file' }, { status: 404 })
    }
    fileUrl = project.file_url
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const fileRes = await fetch(fileUrl)
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
