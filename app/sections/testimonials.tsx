'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star, Quote } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { TESTIMONIALS } from '@/lib/constants'

export default function Testimonials() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="Testimonials"
          title="What Our Customers Say"
          description="Don't just take our word for it. Here's what Indiana homeowners and real estate professionals say about us."
        />

        <div ref={ref} className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS?.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="card-testimonial"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: testimonial?.rating ?? 5 })?.map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-primary-200 mb-3" />
              <p className="text-gray-700 italic mb-4">
                &quot;{testimonial?.quote ?? ''}&quot;
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">{testimonial?.author ?? ''}</p>
                <p className="text-sm text-gray-500">{testimonial?.role ?? ''}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
