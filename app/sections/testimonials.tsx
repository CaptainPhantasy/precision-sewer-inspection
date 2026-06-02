'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { TESTIMONIALS } from '@/lib/constants'

export default function Testimonials() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi alt" data-screen-label="Testimonials">
      <div className="container">
        
        {/* Replaced old SectionHeading with the exact design system DOM structure */}
        <div className="section-head">
          <span className="eyebrow">Testimonials</span>
          <h2 className="psi"><span className="rule"></span>What Our Customers Say</h2>
          <p className="lede">Don't just take our word for it. Here's what Indiana homeowners and real estate professionals say about us.</p>
        </div>

        <div ref={ref} className="testimonial-grid">
          {TESTIMONIALS?.map((testimonial, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.15 }}
              className="testimonial"
            >
              {/* Dynamically generates the text-based star pattern expected by the CSS */}
              <div className="stars">
                {Array.from({ length: testimonial?.rating ?? 5 }).map(() => '★').join(' ')}
              </div>
              
              <blockquote>&quot;{testimonial?.quote ?? ''}&quot;</blockquote>
              
              <div className="who">
                <div className="name">{testimonial?.author ?? ''}</div>
                <div className="role">{testimonial?.role ?? ''}</div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

