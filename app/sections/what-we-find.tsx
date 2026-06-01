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
    <section id="what-we-find" className="psi alt">
      <div className="container">
        <SectionHeading
          label="What We Find"
          title="Common Issues We Discover"
          description="50% of our inspections reveal issues homeowners didn't know about. Here's what our cameras commonly find."
          icon={AlertTriangle}
        />

        <div ref={ref} className="pipes-grid">
          {PIPE_ISSUES?.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="pipe"
            >
              <div className="still">
                <Image
                  src={issue?.image ?? ''}
                  alt={issue?.name ?? 'Pipe issue'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="label-row">
                <h3 className="nm">
                  {issue?.name ?? ''}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="findings-foot">
          <p>
            Each issue comes with expert explanation—no jargon, no scare tactics.
          </p>
        </div>
      </div>
    </section>
  )
}
