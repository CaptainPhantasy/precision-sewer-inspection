import type { Metadata } from 'next'
import StructuredData from '@/components/structured-data'

export const metadata: Metadata = {
  title: 'Sewer Scope FAQ Indianapolis | Common Questions Answered',
  description: 'Answers to frequently asked questions about sewer scope inspections in Indianapolis. Cost, process, timing, equipment, and more. Get answers before you book.',
  openGraph: {
    title: 'Sewer Inspection FAQ | Precision Sewer Inspection Indianapolis',
    description: 'Common questions about sewer scope inspections answered. Pricing, process, what to expect, and more.',
  },
  alternates: {
    canonical: '/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData type="FAQPage" />
      {children}
    </>
  )
}
