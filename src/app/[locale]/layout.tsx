import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })

  const isDe = locale === 'de'
  const title = isDe ? 'Pitchsite — Kommt bald' : 'Pitchsite — Coming soon'
  const description = t('subline')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [`/og/${locale}.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/${locale}.png`],
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'de' | 'en')) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
