import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import StructuredData from '@/components/structured-data'
import HeroSection from './sections/hero'
import WhyChooseUs from './sections/why-choose-us'
import HowItWorks from './sections/how-it-works'
import WhatWeFind from './sections/what-we-find'
import Testimonials from './sections/testimonials'
import PricingPreview from './sections/pricing-preview'
import ServiceAreas from './sections/service-areas'
import FAQSection from './sections/faq-section'
import FinalCTA from './sections/final-cta'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <WhyChooseUs />
        <HowItWorks />
        <WhatWeFind />
        <Testimonials />
        <PricingPreview />
        <ServiceAreas />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
