import { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Shield, Database, Share2, Lock, Clock, UserCheck, Mail } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy | Precision Sewer Inspection',
  description: 'Privacy policy for Precision Sewer Inspection. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-600">
                How we collect, use, and protect your information
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 mb-8">
                <strong>Effective Date:</strong> March 2026<br />
                <strong>Last Updated:</strong> March 2026
              </p>

              <p className="text-gray-700 mb-8">
                Precision Sewer Inspection ("we," "us," or "our") operates the website precisionsewerinspections.com and provides sewer inspection services in Central Indiana. This Privacy Policy explains what information we collect, how we use it, and your choices regarding that information.
              </p>

              {/* Section 1 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary-600" />
                  1. Information We Collect
                </h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Information You Provide</h3>
                <p className="text-gray-700 mb-3">When you book an inspection or contact us, we collect:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Contact information:</strong> Name, email address, phone number</li>
                  <li><strong>Property information:</strong> Service address, access details, property type</li>
                  <li><strong>Payment information:</strong> When you pay online, your payment is processed by Stripe. We do not store your full credit card number. Stripe handles payment processing and may retain payment details per their privacy policy.</li>
                  <li><strong>Communications:</strong> Messages you send us via our contact form, email, or phone</li>
                  <li><strong>Service preferences:</strong> Scheduling preferences, special instructions, access notes</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Information Collected During Service</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Inspection data:</strong> Video recordings, photographs, and written observations of the sewer line</li>
                  <li><strong>Digital signatures:</strong> If you sign digitally to acknowledge service completion</li>
                  <li><strong>Location data:</strong> Our technicians may log GPS coordinates during service for operational purposes</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Automatically Collected Information</h3>
                <p className="text-gray-700 mb-3">When you visit our website, we may collect:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Device information:</strong> Browser type, operating system, device type</li>
                  <li><strong>Usage data:</strong> Pages visited, time spent on site, referring website</li>
                  <li><strong>IP address:</strong> Used for security and general geographic analytics</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary-600" />
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-700 mb-3">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Provide our services:</strong> Schedule inspections, perform the inspection, deliver reports and videos</li>
                  <li><strong>Process payments:</strong> Complete transactions you initiate</li>
                  <li><strong>Communicate with you:</strong> Confirm appointments, send reports, respond to inquiries, provide service updates</li>
                  <li><strong>Improve our services:</strong> Understand how our website is used, identify issues, enhance user experience</li>
                  <li><strong>Maintain records:</strong> Keep inspection records for quality assurance and in case of future questions about your property</li>
                  <li><strong>Comply with legal obligations:</strong> Respond to legal requests, enforce our terms, protect our rights</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary-600" />
                  3. How We Share Your Information
                </h2>
                <p className="text-gray-700 mb-4">We do not sell your personal information. We may share information with:</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-3">Service Providers</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Payment processing:</strong> Stripe processes payments on our behalf. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Stripe's Privacy Policy</a>.</li>
                  <li><strong>Email services:</strong> We use third-party services to send transactional emails (confirmations, reports)</li>
                  <li><strong>Cloud storage:</strong> Inspection videos and reports are stored with secure cloud providers</li>
                  <li><strong>Website hosting:</strong> Our website is hosted by third-party infrastructure providers</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-3">Other Disclosures</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>With your consent:</strong> If you ask us to share your report with a real estate agent, contractor, or other party</li>
                  <li><strong>Legal requirements:</strong> If required by law, court order, or government request</li>
                  <li><strong>Business transfers:</strong> If our business is sold or merged, your information may transfer to the new owner</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-primary-600" />
                  4. How We Protect Your Information
                </h2>
                <p className="text-gray-700 mb-3">We use reasonable measures to protect your information, including:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Secure connections (HTTPS) for data transmission</li>
                  <li>Encrypted payment processing through Stripe (we never see or store your full card number)</li>
                  <li>Access controls limiting who can view customer data</li>
                  <li>Secure cloud storage for inspection files</li>
                </ul>
                <p className="text-gray-700">
                  No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>

              {/* Section 5 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary-600" />
                  5. Data Retention
                </h2>
                <p className="text-gray-700 mb-3">We retain your information as follows:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Contact and booking information:</strong> Retained for as long as needed to provide services and maintain customer relationships</li>
                  <li><strong>Inspection reports and videos:</strong> Retained for a reasonable period to allow you access and for our records. If you need a copy after your download link expires, contact us.</li>
                  <li><strong>Payment records:</strong> Retained as required for accounting and tax purposes</li>
                  <li><strong>Website analytics:</strong> Aggregated data may be retained indefinitely; individual session data is typically retained for limited periods</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-primary-600" />
                  6. Your Choices and Rights
                </h2>
                <p className="text-gray-700 mb-3">You have the following choices regarding your information:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Access:</strong> You can request a copy of the information we have about you</li>
                  <li><strong>Correction:</strong> You can ask us to correct inaccurate information</li>
                  <li><strong>Deletion:</strong> You can ask us to delete your information, subject to our legal and business retention needs</li>
                  <li><strong>Communications:</strong> You can opt out of promotional emails by following unsubscribe instructions (note: you'll still receive transactional emails related to your service)</li>
                </ul>
                <p className="text-gray-700">
                  To exercise these rights, contact us at <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a>.
                </p>
              </div>

              {/* Section 7 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Cookies and Tracking
                </h2>
                <p className="text-gray-700 mb-3">
                  Our website may use cookies and similar technologies for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Essential functionality:</strong> Keeping you logged in, remembering your preferences</li>
                  <li><strong>Analytics:</strong> Understanding how visitors use our site to improve it</li>
                </ul>
                <p className="text-gray-700">
                  Most browsers allow you to control cookies through settings. Disabling cookies may affect site functionality.
                </p>
              </div>

              {/* Section 8 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Third-Party Links
                </h2>
                <p className="text-gray-700">
                  Our website may contain links to third-party sites (e.g., Google Maps for directions). We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.
                </p>
              </div>

              {/* Section 9 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Children's Privacy
                </h2>
                <p className="text-gray-700">
                  Our services are not directed at children under 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us.
                </p>
              </div>

              {/* Section 10 */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Changes to This Policy
                </h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. The current version will always be posted on this page with the effective date. Continued use of our services after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              {/* Section 11 - Contact */}
              <div className="bg-gray-50 rounded-xl p-6 mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  Contact Us
                </h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about this Privacy Policy or our data practices, contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Precision Sewer Inspection</strong></p>
                  <p>{COMPANY_INFO.serviceAreaDisplay}</p>
                  <p>Email: <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a></p>
                  <p>Phone: <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">{COMPANY_INFO.phone}</a></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
