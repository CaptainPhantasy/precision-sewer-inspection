'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { SERVICE_AREAS } from '@/lib/constants'

export default function ServiceAreas() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi dark" data-screen-label="Service Areas">
      <div className="container" style={{ textAlign: 'center' }}>
        
        <div className="section-head" style={{ alignItems: 'center' }}>
          <span className="eyebrow">Service Areas</span>
          {/* Inline auto margins center the rule under the heading */}
          <h2 className="psi"><span className="rule" style={{ margin: '0 auto 1rem auto' }}></span>Serving Central Indiana</h2>
          <p className="lede max-w-2xl mx-auto">
            We provide professional sewer inspection services throughout Central Indiana.
          </p>
        </div>

        <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', padding: '2rem 0' }}>
          {SERVICE_AREAS?.map((area, index) => (
            <motion.span
              key={area ?? index}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
              className="badge" // Reuses the badge styling we validated in the pricing section
            >
              {area ?? ''}
            </motion.span>
          ))}
        </div>

        <p style={{ marginTop: '1rem', color: 'var(--text-light)', opacity: 0.8, fontSize: '0.9rem' }}>
          Don&apos;t see your city? Contact us—we likely serve your area too!
        </p>
        
      </div>
    </section>
  )
}
