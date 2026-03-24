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
    <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] bg-repeat" />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/images/hero_equipment.jpg"
          alt="Sewer inspection background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1 bg-accent-500/20 text-accent-400 text-sm font-semibold rounded-full mb-6">
              Central Indiana&apos;s Trusted Choice
            </span>
            
            <h1 className="text-hero text-white mb-6">
              See What&apos;s Really In Your <span className="text-accent-400">Pipes</span>
            </h1>
            
            <p className="text-xl text-primary-200 mb-4">
              Before it costs you <span className="text-white font-bold">$7,500</span>
            </p>
            
            <p className="text-lg text-primary-300 mb-8 max-w-lg">
              Our HD sewer scope lets you see what&apos;s really in your pipes with honest answers. No upselling, no scare tactics—just the evidence you need to make confident decisions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/contact" className="btn-cta">
                Book Inspection — 60 Seconds
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#what-we-find" className="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-700/50">
                <Play className="w-5 h-5" />
                See Sample Footage
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {trustBadges?.map((badge, index) => {
                const IconComponent = badge?.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-accent-400 mx-auto mb-2" />}
                    <div className="text-2xl font-bold text-white">
                      <AnimatedCounter 
                        end={Number(badge?.value ?? 0)} 
                        suffix={badge?.suffix ?? ''} 
                      />
                    </div>
                    <div className="text-xs text-primary-300">{badge?.label ?? ''}</div>
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
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/tech_hero.jpg"
                alt="Precision Sewer Inspection technician with professional equipment"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">InterNACHI Certified</p>
                    <p className="text-sm text-gray-600">Licensed & Insured</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
