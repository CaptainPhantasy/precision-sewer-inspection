'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { AlertTriangle } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { PIPE_ISSUES } from '@/lib/constants'

export default function WhatWeFind() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="what-we-find" className="section-padding bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="What We Find"
          title="Common Issues We Discover"
          description="50% of our inspections reveal issues homeowners didn't know about. Here's what our cameras commonly find."
          icon={AlertTriangle}
        />

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PIPE_ISSUES?.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-square relative">
                <Image
                  src={issue?.image ?? ''}
                  alt={issue?.name ?? 'Pipe issue'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm">
                    {issue?.name ?? ''}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Each issue comes with expert explanation—no jargon, no scare tactics.
          </p>
        </div>
      </div>
    </section>
  )
}
