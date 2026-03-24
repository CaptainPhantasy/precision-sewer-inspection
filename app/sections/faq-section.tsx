'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import SectionHeading from '@/components/section-heading'
import { FAQ_ITEMS } from '@/lib/constants'
import Link from 'next/link'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="section-padding bg-white">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          label="FAQ"
          title="Frequently Asked Questions"
          description="Get quick answers to common questions about sewer inspections."
          icon={HelpCircle}
        />

        <div className="space-y-4">
          {FAQ_ITEMS?.slice(0, 5)?.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{item?.question ?? ''}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 py-4 bg-white border-t border-gray-100">
                      <p className="text-gray-600">{item?.answer ?? ''}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/faq" className="text-primary-600 font-semibold hover:text-primary-700">
            View All FAQs →
          </Link>
        </div>
      </div>
    </section>
  )
}
