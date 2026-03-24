import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import { Check, ArrowRight, Info, Phone, AlertCircle, Building2, Users, Video } from 'lucide-react'
import { ACCESS_METHODS, MULTI_UNIT_PRICING, VOLUME_PACKAGES, COMPANY_INFO } from '@/lib/constants'

const PRICING_CARDS = [
  {
    name: 'Independent Video Review',
    description: 'Free Expert Opinion',
    price: '$0',
    priceLabel: '/ review',
    badge: 'Free Service',
    badgeColor: 'bg-secondary-500',
    features: [
      'Independent Sewer Video Review',
      'No-Jargon Explanation of Findings',
      'Report Reviewed if Provided',
      '24-Hour Response',
      'Informational Review Only (No Repair Recommendations)',
      'No Contractor Referrals'
    ],
    cta: 'Submit Video',
    href: '/video-review',
    featured: false
  },
  {
    name: 'Early Adopter',
    description: 'Limited Time Launch Pricing',
    price: '$159',
    priceLabel: 'per inspection (cleanout access)',
    badge: 'Limited Time',
    badgeColor: 'bg-accent-500',
    features: [
      'HD Video Recording',
      'HD images and factual summary with no jargon',
      '24-Hour Delivery',
      'Standard Cleanout Access',
      'Phone Consultation',
      'No Upselling Guarantee'
    ],
    cta: 'Book Now',
    href: '/contact',
    featured: true
  },
  {
    name: 'Volume Packages',
    description: 'Brokerages & Investors',
    price: 'Call for Pricing',
    priceLabel: '',
    badge: null,
    badgeColor: '',
    features: [
      '10+ Scope Prepaid Bundles',
      'Per-Scope Discounts',
      'Priority Scheduling',
      'Dedicated Account Support',
      'Annual Package Options'
    ],
    cta: 'Get Quote',
    href: '/contact',
    featured: false
  }
]

export const metadata: Metadata = {
  title: 'Sewer Scope Cost Indianapolis | $159 Standard',
  description: 'Sewer inspection pricing in Indianapolis. Standard rate $159. Multi-unit discounts, volume packages for investors. Transparent pricing, no hidden fees.',
  openGraph: {
    title: 'Sewer Scope Pricing | Indianapolis | Precision Sewer Inspection',
    description: 'Transparent sewer inspection pricing. Standard rate $159. Volume packages available. No surprises.',
  },
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                Transparent Pricing
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Clear, Upfront Pricing
              </h1>
              <p className="text-xl text-primary-200">
                Premium reporting quality with transparent pricing. Know exactly what you&apos;ll pay before we arrive.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {PRICING_CARDS.map((card, index) => (
                <div
                  key={index}
                  className={`card-pricing relative ${card.featured ? 'featured' : ''}`}
                >
                  {card.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${card.badgeColor} text-white text-xs font-semibold px-4 py-1 rounded-full`}>
                      {card.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{card.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{card.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-heading font-bold text-gray-900">{card.price}</span>
                    {card.priceLabel && <span className="text-gray-500 block text-sm mt-1">{card.priceLabel}</span>}
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    {card.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={card.href}
                    className={`w-full justify-center ${
                      card.featured ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {card.name === 'Independent Video Review' && <Video className="w-4 h-4 mr-1" />}
                    {card.cta}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Access Methods */}
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              Access Method Pricing
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Price varies by access type. Please confirm access availability before your appointment to avoid delays or additional charges.
            </p>

            <div className="space-y-4">
              {ACCESS_METHODS?.map((method, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="mb-4 sm:mb-0">
                    <h3 className="font-semibold text-gray-900">{method?.method ?? ''}</h3>
                    <p className="text-sm text-gray-500">{method?.description ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-700">{method?.price ?? ''}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Important Access Information</h4>
                  <p className="text-sm text-amber-800">
                    Some older systems may have buried or hard-to-locate clean-outs that require additional effort. If access cannot be established after reasonable effort, alternative access methods or additional charges may apply. We&apos;ll always discuss options with you before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-6 bg-primary-50 rounded-xl border border-primary-200">
              <div className="flex gap-3">
                <Info className="w-6 h-6 text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary-900 mb-1">Same-Day Delivery Option</h4>
                  <p className="text-sm text-primary-700">
                    Need it faster? Add same-day delivery for $39.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Unit Pricing */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                Multi-Family Properties
              </h2>
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Discounted rates for duplexes, triplexes, and apartment buildings.
            </p>

            <div className="space-y-4 max-w-xl mx-auto">
              {MULTI_UNIT_PRICING?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-xl border border-gray-200"
                >
                  <div className="mb-4 sm:mb-0">
                    <h3 className="font-semibold text-gray-900">{item?.units ?? ''}</h3>
                    <p className="text-sm text-gray-500">{item?.description ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-700">{item?.price ?? ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Volume Packages */}
        <section className="section-padding bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                Prepaid Volume Packages
              </h2>
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Brokerage and investor packages with cost savings and priority scheduling. Purchase upfront and save on every scope.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {VOLUME_PACKAGES?.map((pkg, index) => (
                <div
                  key={index}
                  className="p-6 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{pkg?.name ?? ''}</h3>
                  <p className="text-sm text-gray-500 mb-4">{pkg?.description ?? ''}</p>
                  <div className="mb-4">
                    <span className="text-xl font-bold text-primary-700">{pkg?.price ?? ''}</span>
                  </div>
                  <ul className="space-y-2">
                    {pkg?.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span>{feature ?? ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/contact" className="btn-primary">
                Purchase Volume Package
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Ready to Book?</h2>
            <p className="text-gray-600 mb-8">
              Schedule your inspection online in 60 seconds or call us for immediate assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cta">
                Book Inspection
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary"
              >
                <Phone className="w-5 h-5" />
                {COMPANY_INFO?.phone ?? ''}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
