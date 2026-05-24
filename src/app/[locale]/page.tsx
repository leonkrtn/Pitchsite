import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { Solution } from '@/components/sections/Solution'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { DemoUpload } from '@/components/sections/DemoUpload'
import { Pricing } from '@/components/sections/Pricing'
import { FAQ } from '@/components/sections/FAQ'
import { WaitlistSection } from '@/components/sections/WaitlistSection'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <DemoUpload />
        <Pricing />
        <FAQ />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  )
}
