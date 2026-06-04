'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { Check, ArrowRight, Video } from 'lucide-react'

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
      'One-Business-Day Delivery',
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
    <section className="psi" data-screen-label="Pricing">
      <div className="container">
        
        <div className="section-head">
          <span className="eyebrow">Pricing</span>
          <h2 className="psi"><span className="rule"></span>Transparent Pricing, No Surprises</h2>
          <p className="lede">We believe in upfront, honest pricing. What you see is what you pay—no surprises.</p>
        </div>

        <div ref={ref} className="pricing-grid">
          {PREVIEW_CARDS.map((card, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.15 }}
              className={`access-card ${card.featured ? 'featured' : ''}`}
            >
              {/* Badges kept intact */}
              {card.badge && (
                <span className={`badge ${card.badge === 'Free Service' ? 'alt' : ''}`}>
                  {card.badge}
                </span>
              )}
              
              <h3>{card.name}</h3>
              <div className="desc">{card.description}</div>
              
              <div className="price">
                <span className="amt" style={card.price === 'Call for Pricing' ? { fontSize: '24px' } : undefined}>
                  {card.price}
                </span>
                {card.priceLabel && <span className="unit">{card.priceLabel}</span>}
              </div>
              
              {/* Inline style overrides the CSS ::before element so the Lucide icon renders cleanly */}
              <style>{`.access-card ul li { display: flex; align-items: flex-start; gap: 10px; } .access-card ul li::before { display: none !important; }`}</style>
              <ul>
                {card.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={18} strokeWidth={1.5} color="currentColor" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="cta-row">
                <Link
                  href={card.href}
                  className={`btn ${card.featured ? 'btn-accent' : 'btn-outline-light'}`}
                >
                  {card.name === 'Independent Video Review' && <Video size={16} strokeWidth={1.5} color="currentColor" style={{ marginRight: '6px' }} />}
                  {card.cta} 
                  <ArrowRight size={16} strokeWidth={1.5} color="currentColor" style={{ marginLeft: '6px' }} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="pricing-foot">
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            View Full Pricing Details <ArrowRight size={14} strokeWidth={1.5} color="currentColor" />
          </Link>
        </div>
        
      </div>
    </section>
  )
}
