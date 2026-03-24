'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { Check, ArrowRight, Video } from 'lucide-react'
import SectionHeading from '@/components/section-heading'

const PREVIEW_CARDS = [
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

export default function PricingPreview() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="section-padding bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="Pricing"
          title="Transparent Pricing, No Surprises"
          description="We believe in upfront, honest pricing. What you see is what you pay—no surprises."
        />

        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PREVIEW_CARDS.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`card-pricing relative ${card.featured ? 'featured' : ''}`}
            >
              {card.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${card.badgeColor} text-white text-xs font-semibold px-4 py-1 rounded-full`}>
                  {card.badge}
                </span>
              )}
              <h3 className="text-xl font-bold mb-1 text-gray-900">
                {card.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{card.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-heading font-bold text-gray-900">
                  {card.price}
                </span>
                {card.priceLabel && <span className="text-gray-500 ml-1">{card.priceLabel}</span>}
              </div>
              <ul className="space-y-3 mb-8 text-left">
                {card.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-secondary-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={card.href}
                className={`w-full justify-center ${
                  card.featured
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {card.name === 'Independent Video Review' && <Video className="w-4 h-4 mr-1" />}
                {card.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/pricing" className="text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center gap-2">
            View Full Pricing Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
