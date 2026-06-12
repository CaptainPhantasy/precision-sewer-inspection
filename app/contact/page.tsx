import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import ContactForm from './contact-form'
import { Phone, Mail, MapPin, Clock, Shield, Video, CheckCircle } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { T } from '@/components/diversity/diversity-provider'

export const metadata: Metadata = {
  title: 'Book Sewer Inspection Indianapolis | Schedule Online in 60 Seconds',
  description: 'Book your sewer scope inspection in Indianapolis online. Same-day appointments available. Call (317) 620-3858 or fill out our quick form. Serving all Central Indiana.',
  openGraph: {
    title: 'Book Your Sewer Inspection | Precision Sewer Inspection Indianapolis',
    description: 'Schedule your sewer scope inspection online in 60 seconds. Same-day available. Serving Indianapolis and Central Indiana.',
  },
  alternates: {
    canonical: '/contact',
  },
}

const benefits = [
  { icon: Shield, text: 'InterNACHI Certified Inspectors' },
  { icon: Video, text: 'HD Video & Written Report' },
  { icon: Clock, text: 'One-Business-Day Delivery Guaranteed' },
  { icon: CheckCircle, text: 'No Upselling, Ever' },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                <T>Get Started</T>
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <T>Book Your Inspection</T>
              </h1>
              <p className="text-xl text-primary-200">
                <T>Schedule your professional sewer inspection online or contact us for immediate assistance.</T>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Form */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                  <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    <T>Request an Inspection</T>
                  </h2>
                  <p className="text-gray-600 mb-6">
                    <T>Fill out the form below and we&apos;ll get back to you within 24 hours to confirm your appointment.</T>
                  </p>
                  <ContactForm />
                </div>
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6"><T>Contact Information</T></h3>
                  <div className="space-y-4">
                    <a
                      href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                      className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500"><T>Call Us</T></p>
                        <p className="font-semibold text-gray-900">{COMPANY_INFO?.phone ?? ''}</p>
                      </div>
                    </a>
                    <a
                      href={`mailto:${COMPANY_INFO?.email ?? ''}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500"><T>Email Us</T></p>
                        <p className="font-semibold text-gray-900">{COMPANY_INFO?.email ?? ''}</p>
                      </div>
                    </a>
                    <a
                      href={COMPANY_INFO?.googleMapsUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500"><T>Service Area</T></p>
                        <p className="font-semibold text-gray-900 text-sm">{COMPANY_INFO?.serviceAreaDisplay ?? 'Indianapolis Metro & Surrounding Areas'}</p>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="bg-primary-900 text-white rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-bold mb-4"><T>Why Choose Us?</T></h3>
                  <ul className="space-y-3">
                    {benefits?.map((benefit, index) => {
                      const IconComponent = benefit?.icon
                      return (
                        <li key={index} className="flex items-center gap-3">
                          {IconComponent && <IconComponent className="w-5 h-5 text-primary-300" />}
                          <span className="text-primary-100"><T>{benefit?.text ?? ''}</T></span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-primary-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent-400" />
                      <span className="text-accent-400 font-semibold"><T>Available 7 Days a Week</T></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
