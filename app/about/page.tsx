import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import { ArrowRight, Shield, Award, Heart, Eye, Zap, Users, Check } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

export const metadata: Metadata = {
  title: 'About Us | Independent Sewer Scope Inspections, Indianapolis | Precision Sewer',
  description: "We're inspectors, not contractors. One InterNACHI-member inspector, camera-verified findings, no sewer repairs, no contractor referrals. Serving Central Indiana.",
  openGraph: {
    title: 'About Us | Independent Sewer Scope Inspections, Indianapolis | Precision Sewer',
    description: "We're inspectors, not contractors. One InterNACHI-member inspector, camera-verified findings, no sewer repairs, no contractor referrals. Serving Central Indiana.",
  },
  alternates: {
    canonical: '/about',
  },
}

const values = [
  { icon: Heart, title: 'Honesty Over Profit', description: "We'd rather lose a sale than gain it through deception." },
  { icon: Eye, title: 'Evidence Over Opinion', description: "We show you what's there, not what we think you want to hear." },
  { icon: Zap, title: 'Speed Without Sacrifice', description: 'Fast delivery, never at the expense of quality.' },
  { icon: Users, title: 'Education Over Fear', description: "We explain what we find, we don't scare you into action." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>About Us</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>We Built This Company On One Simple Promise</T>
              </h1>
              <p className="text-xl text-primary-200">
                <T>Tell the truth, show the evidence, and let people make their own informed decisions.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6"><T>Our Story</T></h2>
              <p className="text-gray-600 mb-4">
                <T>We started Precision Sewer Inspections because we kept watching the same thing happen in Central Indiana real estate: a camera goes down a sewer line, and the person holding it has a repair crew waiting in the truck. The &quot;inspection&quot; becomes a sales pitch. The findings grow to fit the invoice.</T>
              </p>
              <p className="text-gray-600 mb-4">
                <T>So we drew one hard line and built the whole company on it: we sell no repairs on anything we inspect. No sewer repairs, no drain work, no contractor referrals — nothing to gain from what the camera finds. When your report says the line is clear, that&apos;s because it is — and when it shows a problem, you get the footage, the location, and plain-English facts you can hand to any contractor you choose.</T>
              </p>
              <p className="text-gray-600">
                <T>We&apos;re a new company, and we won&apos;t pretend otherwise. No invented track record, no padded team page. What you get is exactly what exists: one inspector, professional HD equipment, a published national standard, and reports that say what the camera saw.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4"><T>Our Values</T></h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                <T>These aren't just words on a wall. They're the principles that guide every inspection we do.</T>
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values?.map((value, index) => {
                const IconComponent = value?.icon
                return (
                  <div key={index} className="card-service text-center">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      {IconComponent && <IconComponent className="w-7 h-7 text-primary-600" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2"><T>{value?.title ?? ''}</T></h3>
                    <p className="text-gray-600 text-sm"><T>{value?.description ?? ''}</T></p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* The Inspector */}
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6"><T>The Inspector</T></h2>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <T>Ryan Galbraith — Owner &amp; Inspector · InterNACHI Member</T>
              </h3>
              <p className="text-gray-600 mb-4">
                <T>Ryan performs every PSI inspection to InterNACHI&apos;s published Sewer Scope Standards of Practice — a national standard anyone can read for themselves. He completed InterNACHI&apos;s Sewer Scope Inspector training, and he&apos;s an InterNACHI member in good standing — ID NACHI26032508, verifiable at nachi.org/verify. Go check. We mean it.</T>
              </p>
              <p className="text-gray-600">
                <T>Here&apos;s the part we&apos;re proudest of: Ryan deliberately does not wear titles that can&apos;t be verified. He&apos;s not a home inspector — sewer lines are the whole point, done properly, not one line item on a long checklist. And when a credential turned out to be a logo you download rather than a registration anyone can look up, he left it off. An inspector who won&apos;t inflate his own badge is not going to inflate your sewer findings. That&apos;s the whole company, in one decision.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Trust row */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-8"><T>Trust &amp; Verification</T></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-primary-800 rounded-xl p-6">
                <Shield className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold">InterNACHI Member</p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Award className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold"><T>Fully Insured</T></p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Check className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold"><T>Inspections to InterNACHI&apos;s Published Sewer Scope Standards of Practice</T></p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Users className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold"><T>No Contractor Referrals</T></p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4"><T>Ready to Work With Us?</T></h2>
            <p className="text-gray-600 mb-8">
              <T>Experience the difference that honest, evidence-based inspections can make.</T>
            </p>
            <Link href="/contact" className="btn-cta">
              <T>Book Your Inspection</T>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
