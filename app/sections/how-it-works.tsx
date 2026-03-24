'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Calendar, Camera, Video, CheckCircle, ArrowRight } from 'lucide-react'
import SectionHeading from '@/components/section-heading'

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
    title: 'See Your Video in 24 Hours',
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
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="How It Works"
          title="Simple, Fast, Transparent"
          description="From booking to report delivery, we've streamlined every step so you can focus on what matters."
        />

        <div ref={ref} className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-primary-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps?.map((step, index) => {
              const IconComponent = step?.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <div className="relative z-10 w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
                    {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step?.step ?? ''}
                    </span>
                  </div>
                  
                  {/* Arrow (hidden on mobile) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 z-20">
                      <ArrowRight className="w-6 h-6 text-primary-400" />
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step?.title ?? ''}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step?.description ?? ''}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
