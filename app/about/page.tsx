import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Award, Heart, Eye, Zap, Users, Check } from 'lucide-react'
import { COMPANY_INFO, TEAM_MEMBERS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About Us | InterNACHI Certified Sewer Inspectors Indianapolis',
  description: "Meet the Precision Sewer Inspection team. InterNACHI certified inspectors serving Central Indiana. We're inspectors, not contractors—honest assessments only.",
  openGraph: {
    title: 'About Precision Sewer Inspection | Indianapolis Sewer Scope Experts',
    description: 'InterNACHI certified inspectors. No upselling, just honest sewer line assessments. Serving Indianapolis and Central Indiana.',
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
                About Us
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                We Built This Company On One Simple Promise
              </h1>
              <p className="text-xl text-primary-200">
                Tell the truth, show the evidence, and let people make their own informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                We started Precision Sewer Inspection for one simple reason: <strong>we were tired of seeing good people get taken advantage of.</strong>
              </p>
              <p className="text-gray-600 mb-4">
                Time after time, we watched homeowners and home buyers get scared into expensive repairs they didn't need. Contractors would find &quot;problems&quot; that weren't really problems, quoting prices that made your jaw drop.
              </p>
              <p className="text-gray-600 mb-4">
                Meanwhile, the honest inspectors—the ones who just wanted to give people the truth—were getting drowned out by the salespeople.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>So we decided to do something different.</strong>
              </p>
              <p className="text-gray-600 mb-4">
                We made a simple promise: We would be inspectors, not contractors. We would show people exactly what we found—the good, the bad, and the ugly—without trying to sell them anything. Because when you don't do repairs, you have no reason to exaggerate problems.
              </p>
              <p className="text-gray-600">
                Turns out, people appreciate honesty. Word spread. And today, we're proud to serve all of Central Indiana—not because we're the cheapest or the biggest, but because we're the ones who tell the truth.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These aren't just words on a wall. They're the principles that guide every inspection we do.
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
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{value?.title ?? ''}</h3>
                    <p className="text-gray-600 text-sm">{value?.description ?? ''}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Certified professionals dedicated to giving you honest, accurate inspections.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {TEAM_MEMBERS?.map((member, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={member?.image ?? ''}
                      alt={member?.name ?? 'Team member'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{member?.name ?? ''}</h3>
                    <p className="text-primary-600 font-medium mb-3">{member?.role ?? ''}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {member?.certifications?.map((cert, i) => (
                        <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          {cert ?? ''}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm">{member?.experience ?? ''} experience</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-8">Certified & Trusted</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-primary-800 rounded-xl p-6">
                <Shield className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold">InterNACHI Certified</p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Award className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold">Licensed & Insured</p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Check className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold">Certified Professional</p>
              </div>
              <div className="bg-primary-800 rounded-xl p-6">
                <Users className="w-10 h-10 text-primary-300 mx-auto mb-3" />
                <p className="font-semibold">Indiana Clay Pipe Specialists</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Ready to Work With Us?</h2>
            <p className="text-gray-600 mb-8">
              Experience the difference that honest, evidence-based inspections can make.
            </p>
            <Link href="/contact" className="btn-cta">
              Book Your Inspection
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
