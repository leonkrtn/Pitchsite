import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export default function ImpressumPage() {
  return (
    <>
      <Navigation />
      <main className="pt-14 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm py-20">
          <h1 className="font-display font-bold text-2xl text-ink mb-3">Impressum</h1>
          <p className="text-muted text-sm leading-relaxed">
            Das Impressum wird vor dem Launch veröffentlicht.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
