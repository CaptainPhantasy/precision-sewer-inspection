'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Video, HandCoins, Clock, BadgeCheck } from 'lucide-react'
import SectionHeading from '@/components/section-heading'

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
    <section className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="Why Choose Us"
          title="The Difference is in the Details"
          description="We built Precision Sewer Inspection around one simple principle: give people the truth, and they'll make smart decisions."
        />

        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features?.map((feature, index) => {
            const IconComponent = feature?.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-service"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  {IconComponent && <IconComponent className="w-6 h-6 text-primary-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature?.title ?? ''}
                </h3>
                <p className="text-gray-600">
                  {feature?.description ?? ''}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
