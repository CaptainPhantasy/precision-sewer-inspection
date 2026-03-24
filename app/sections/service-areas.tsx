'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MapPin } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { SERVICE_AREAS } from '@/lib/constants'

export default function ServiceAreas() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="section-padding bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 justify-center mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-300" />
            </div>
            <span className="text-sm font-semibold text-primary-300 uppercase tracking-wider">
              Service Areas
            </span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Serving Central Indiana
          </h2>
          <p className="text-lg text-primary-200 max-w-2xl mx-auto">
            We provide professional sewer inspection services throughout Central Indiana.
          </p>
        </div>

        <div ref={ref} className="flex flex-wrap justify-center gap-3">
          {SERVICE_AREAS?.map((area, index) => (
            <motion.span
              key={area ?? index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="px-4 py-2 bg-primary-800/50 text-primary-100 rounded-full text-sm font-medium hover:bg-primary-700 transition-colors cursor-default"
            >
              {area ?? ''}
            </motion.span>
          ))}
        </div>

        <p className="text-center text-primary-300 mt-8 text-sm">
          Don&apos;t see your city? Contact us—we likely serve your area too!
        </p>
      </div>
    </section>
  )
}
