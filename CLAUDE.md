# Pitchsite – Project Notes for Claude

## Stack
- Next.js 14 App Router, TypeScript, next-intl (`[locale]` prefix: `de` / `en`)
- Supabase (auth + DB) — see `src/lib/supabase.ts` for server/client helpers
- Framer Motion for animations, Inter + Plus Jakarta Sans fonts

## Styling rules
- **No Tailwind className in JSX components** — all styling is inline styles only
- Responsive layout via `useBreakpoint` hook (`@/hooks/useBreakpoint`): `isMobile` / `isTablet` / `isDesktop`
- Fluid font sizes via CSS `clamp()`, e.g. `clamp(28px, 4vw, 36px)`
- CSS keyframe names defined in `src/styles/globals.css`: `spin`, `shimmer`, `ping`, `sparkle-sweep`, `sparkle-pop`, `dropIn`, `fadeInUp`
- Hover/focus states use `onMouseEnter`/`onMouseLeave` with `useState` — never CSS `:hover`
- Framer Motion: use `style` prop (not `className`) on `motion.*` elements
- `ScrollReveal` accepts a `style` prop (not `className`) for wrapper layout overrides

## Demo-only platform behavior (not real in production yet)

These parts of the platform UI are intentionally mocked for demo purposes:

### Payment (Checkout screen)
- The Stripe payment form in `/app/checkout/[code]` renders a mock Stripe Elements UI
- There is a **"Zahlung überspringen (Demo)"** skip button that bypasses actual payment and marks the project as `escrow` directly
- **Real Stripe integration is not wired up** — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a placeholder

### Google OAuth (Login/Signup)
- "Mit Google anmelden" button shows a **toast notification** ("Google OAuth kommt bald") instead of redirecting to Google
- Only email/password auth is functional via Supabase

### Impressum / Datenschutz (Footer)
- Footer links for "Impressum" and "Datenschutz" are rendered as `<span>` (non-clickable) — pages not built yet

## Supabase TypeScript quirk
The Supabase client does not infer table types correctly in this project (returns `never`). Workaround: cast `(supabase as any).from('table_name')` and add explicit return type assertion at the end, e.g.:
```ts
const { data } = await (supabase as any).from('projects').select('*').eq('id', id).single() as { data: Project | null }
```

## i18n
- Messages in `src/messages/de.json` (German, default) and `src/messages/en.json`
- Keys follow section-based nesting: `footer.tryPlatform`, `nav.cta`, etc.
- `useTranslations('section')` for client components, `getTranslations('section')` for server

## Platform entry point
Footer "Platform testen" / "Try platform" button → `/${locale}/app/login`
