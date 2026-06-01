TypeScript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Play, ArrowRight, Star, Clock, ShieldCheck, DollarSign } from 'lucide-react'
import AnimatedCounter from '@/components/animated-counter'

const trustBadges = [
  { icon: Star, value: '4.9', label: 'Google Rating', suffix: '' },
  { icon: Clock, value: '24', label: 'Hour Delivery', suffix: 'h' },
  { icon: ShieldCheck, value: '100', label: 'No Upselling', suffix: '%' },
  { icon: DollarSign, value: '0', label: 'Hidden Fees', suffix: '' },
]

export default function HeroSection() {
  return (
    <section className="cover">
      <div className="container">
        <div className="cover-grid">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow on-dark">
              Central Indiana&apos;s Trusted Choice
            </span>
            
            <h1>
              See What&apos;s Really In Your <em>Pipes</em>
            </h1>
            
            <p className="price-line">
              Before it costs you <b>$7,500</b>
            </p>
            
            <p className="lede-dark">
              Our HD sewer scope lets you see what&apos;s really in your pipes with honest answers. No upselling, no scare tactics—just the evidence you need to make confident decisions.
            </p>

            {/* CTA Buttons */}
            <div className="ctas">
              <Link href="/contact" className="btn btn-accent">
                Book Inspection — 60 Seconds
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#what-we-find" className="btn btn-outline-dark">
                <Play className="w-5 h-5" />
                See Sample Footage
              </a>
            </div>

            {/* Trust Badges */}
            <div className="trust-grid">
              {trustBadges?.map((badge, index) => {
                const IconComponent = badge?.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="cell"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-accent-400 mx-auto mb-2" />}
                    <div className="k">{badge?.label ?? ''}</div>
                    <div className="v">
                      <AnimatedCounter 
                        end={Number(badge?.value ?? 0)} 
                        suffix={badge?.suffix ?? ''} 
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="tech-card"
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', borderRadius: '16px', overflow: 'hidden' }}>
              <Image
                src="/images/tech_hero.jpg"
                alt="Precision Sewer Inspection technician with professional equipment"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            <div className="ribbon">
              <div className="lead">InterNACHI Certified</div>
              <div className="meta">Licensed & Insured</div>
            </div>
            
            <div className="cert-bump">
              <div className="ic">
                <ShieldCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="text">
                <div className="a">Verified Pro</div>
                <div className="b">Precision Inspection</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
