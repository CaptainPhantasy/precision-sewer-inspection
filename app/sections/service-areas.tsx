'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { SERVICE_AREAS } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

export default function ServiceAreas() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi dark" data-screen-label="Service Areas">
      <div className="container" style={{ textAlign: 'center' }}>

        <div className="section-head" style={{ alignItems: 'center' }}>
          <span className="eyebrow"><T>Service Areas</T></span>
          {/* Inline auto margins center the rule under the heading */}
          <h2 className="psi"><span className="rule" style={{ margin: '0 auto 1rem auto' }}></span><T>Serving Central Indiana</T></h2>
          <p className="lede max-w-2xl mx-auto">
            <T>We provide professional sewer inspection services throughout Central Indiana.</T>
          </p>
        </div>

        <div ref={ref} className="areas-chips">
          {SERVICE_AREAS?.map((area, index) => (
            <Link
              key={area ?? index}
              href={`/sewer-inspection/${(area ?? '').toLowerCase().replace(/\s+/g, '')}-in`}
              className="area-chip"
              style={{ textDecoration: 'none' }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
              >
                {area ?? ''}
              </motion.span>
            </Link>
          ))}
        </div>

        <p className="areas-foot">
          <T>Don&apos;t see your city? Contact us—we likely serve your area too!</T>
        </p>

      </div>
    </section>
  )
}
