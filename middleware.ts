import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from './src/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// Routes that require authentication
const PROTECTED = ['/app/dashboard', '/app/upload', '/app/project', '/app/client', '/app/statistics', '/app/settings', '/app/help', '/app/viewer']

function isProtected(pathname: string): boolean {
  // Strip locale prefix (e.g. /de/app/dashboard → /app/dashboard)
  const stripped = pathname.replace(/^\/(de|en)/, '')
  return PROTECTED.some(p => stripped.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let API routes through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Run intl middleware first (adds locale, sets cookies)
  const intlResponse = intlMiddleware(request)

  // Only check auth for protected app routes
  if (isProtected(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Detect locale from pathname
      const locale = pathname.startsWith('/en') ? 'en' : 'de'
      const loginUrl = new URL(`/${locale}/app/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return intlResponse ?? NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
