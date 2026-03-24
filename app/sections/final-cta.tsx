import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

export default function FinalCTA() {
  return (
    <section className="section-padding bg-gradient-to-br from-accent-500 to-accent-600 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Don&apos;t Guess. Know What&apos;s In Your Pipes.
        </h2>
        <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
          Book your professional sewer inspection today and get the evidence you need to make confident decisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-accent-600 font-bold text-lg rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Book Your Inspection
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-orange-100">
          <Phone className="w-5 h-5" />
          <a href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`} className="font-semibold text-lg hover:text-white">
            {COMPANY_INFO?.phone ?? ''}
          </a>
          <span className="mx-2">|</span>
          <span>Available 7 Days a Week</span>
        </div>
      </div>
    </section>
  )
}
