'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Video, HandCoins, Clock, BadgeCheck } from 'lucide-react'

const features = [
  {
    icon: Video,
    title: 'Evidence You Can See',
    description: "We don't just tell you what we found—we show you. Every inspection includes HD video you can watch, pause, and share.",
  },
  {
    icon: HandCoins,
    title: 'No Upselling, Ever',
    description: "We're inspectors, not contractors. We don't do repairs, so we have nothing to gain by finding problems that aren't there.",
  },
  {
    icon: Clock,
    title: 'Answers in 24 Hours',
    description: "We know timing matters, especially in real estate transactions. That's why we deliver your video and report within 24 hours.",
  },
  {
    icon: BadgeCheck,
    title: 'Decide with Confidence',
    description: 'Every inspection includes video evidence and a structured evaluation—real evidence and honest recommendations to help you make informed decisions.',
  },
]

export default function WhyChooseUs() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi" data-screen-label="Why Choose Us">
      <div className="container">
        
        {/* Replaced old SectionHeading with the exact design system DOM structure */}
        <div className="section-head">
          <span className="eyebrow">Why Choose Us</span>
          <h2 className="psi"><span className="rule"></span>The Difference is in the Details</h2>
          <p className="lede">We built Precision Sewer Inspection around one simple principle: give people the truth, and they'll make smart decisions.</p>
        </div>

        <div ref={ref} className="find-grid">
          {features?.map((feature, index) => {
            const IconComponent = feature?.icon
            return (
              <motion.article
                key={index}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.1 }}
                className="finding"
              >
                <div className="head">
                  <div className="title">
                    {feature?.title ?? ''}
                    {/* Preserved Lucide icons, styled to match the design system's subtitle slot */}
                    {IconComponent && (
                      <span className="sub" style={{ display: 'flex', alignItems: 'center' }}>
                        <IconComponent size={14} strokeWidth={1.5} color="currentColor" />
                      </span>
                    )}
                  </div>
                  <span className="pill">Observed</span>
                </div>
                <p>{feature?.description ?? ''}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
