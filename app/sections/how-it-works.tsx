'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Calendar, Camera, Video, CheckCircle, ArrowRight } from 'lucide-react'
import { T } from '@/components/diversity/diversity-provider'

const steps = [
  {
    icon: Calendar,
    step: '1',
    title: 'Book Online in 60 Seconds',
    description: "Pick your time, share your address, and you're done. No phone calls, no voicemail tag.",
  },
  {
    icon: Camera,
    step: '2',
    title: 'On Time Inspections',
    description: 'Our certified inspector arrives on time with professional HD camera equipment.',
  },
  {
    icon: Video,
    step: '3',
    title: 'See Your Video in One Business Day',
    description: 'Get a link to your HD video inspection plus a written report explaining everything.',
  },
  {
    icon: CheckCircle,
    step: '4',
    title: 'Decide With Confidence',
    description: 'Armed with real evidence and honest recommendations, make informed decisions.',
  },
]

export default function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="psi alt" data-screen-label="How It Works">
      <div className="container">
        
        {/* Replaced old SectionHeading with the exact design system DOM structure */}
        <div className="section-head">
          <span className="eyebrow"><T>How It Works</T></span>
          <h2 className="psi"><span className="rule"></span><T>Simple, Fast, Transparent</T></h2>
          <p className="lede"><T>From booking to report delivery, we've streamlined every step so you can focus on what matters.</T></p>
        </div>

        <div ref={ref} className="steps-wrap">
          {/* Connector line exactly as specified in the CSS */}
          <div className="connector"></div>

          <div className="steps">
            {steps?.map((step, index) => {
              // Extracting icon to prevent unused variable warnings, though UI now uses typography lockup
              const IconComponent = step?.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.15 }}
                  className="step"
                >
                  <div className="num-block">
                    <span className="stepN">Step 0{step?.step ?? index + 1}</span>
                    {step?.step ?? index + 1}
                  </div>
                  
                  <h3><T>{step?.title ?? ''}</T></h3>
                  <p><T>{step?.description ?? ''}</T></p>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
