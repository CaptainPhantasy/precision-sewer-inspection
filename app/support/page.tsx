import { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Mail, Phone, Clock, FileText, Shield, AlertTriangle, CreditCard, Camera, CheckCircle } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Support & Terms of Service | Precision Sewer Inspection',
  description: 'Get help with your sewer inspection or review our terms of service. Contact support@precisionsewerinspections.com for assistance.',
  alternates: {
    canonical: '/support',
  },
}

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Support & Terms of Service
              </h1>
              <p className="text-xl text-gray-600">
                Questions? We're here to help. Review our terms below or reach out directly.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-primary-50 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  Contact Support
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Email:</span>{' '}
                      <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">
                        support@precisionsewerinspections.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Phone:</span>{' '}
                      <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">
                        {COMPANY_INFO.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Response Time:</span>{' '}
                      <span className="text-gray-600">Within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms of Service */}
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary-600" />
                  Terms of Service
                </h2>
                <p className="text-gray-600 mb-8">
                  Last updated: March 2026. By booking an inspection with Precision Sewer Inspection, you agree to these terms.
                </p>

                {/* Section 1 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary-600" />
                    1. Scope of Services
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Precision Sewer Inspection provides video camera inspection services for residential and commercial sewer lines. Our services include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>HD video recording of sewer line interior</li>
                    <li>Visual identification of observable conditions (cracks, roots, blockages, etc.)</li>
                    <li>Written summary report with findings</li>
                    <li>Digital delivery of video and report within 24 hours (standard) or same-day (if selected)</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <strong>We are inspectors, not contractors.</strong> We do not perform repairs, cleaning, or any remediation work. Our role is to document and report what we observe.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    2. Access Requirements
                  </h3>
                  <p className="text-gray-700 mb-3">
                    The customer is responsible for ensuring access to the sewer line at the scheduled appointment time. Acceptable access points include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Exterior cleanout (preferred)</li>
                    <li>Interior cleanout</li>
                    <li>Roof vent (additional fee applies)</li>
                    <li>Toilet removal (additional fee applies)</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <strong>Trip Fee:</strong> A $79 trip fee applies if access is unavailable at the scheduled time due to circumstances within the customer's control (locked property, no cleanout access, etc.).
                  </p>
                </div>

                {/* Section 3 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    3. Pricing & Payment
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Standard inspection (cleanout access): $159</li>
                    <li>Additional units (multi-family): $129 each</li>
                    <li>Same-day report delivery: +$39</li>
                    <li>Roof vent access: +$50</li>
                    <li>Toilet pull & reset: +$65</li>
                    <li>Crawl space access: +$30</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    Payment is due at the time of service or upon online booking. We accept all major credit cards. Prices are subject to change; the price quoted at booking is the price you pay.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary-600" />
                    4. Limitations & Disclaimers
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Visual inspection only:</strong> Our cameras document what is visible. We cannot see through walls, soil, or obstructions.</li>
                    <li><strong>Obstructions:</strong> Standing water, debris, or severe blockages may limit visibility. We report what we can see.</li>
                    <li><strong>No guarantees:</strong> Our inspection documents conditions at the time of service. We cannot predict future problems or guarantee the absence of issues not visible during inspection.</li>
                    <li><strong>Pre-existing conditions:</strong> We are not liable for pre-existing damage to sewer lines discovered during inspection.</li>
                    <li><strong>Third-party reliance:</strong> Reports are prepared for the customer who ordered the inspection. We are not responsible for decisions made by third parties based on our reports.</li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                    5. Cancellation & Rescheduling
                  </h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Cancel or reschedule at least 24 hours before your appointment at no charge.</li>
                    <li>Cancellations with less than 24 hours notice may be subject to a $50 cancellation fee.</li>
                    <li>No-shows are subject to the full trip fee ($79).</li>
                    <li>We reserve the right to reschedule due to weather or equipment issues. You will be notified promptly and given priority rebooking.</li>
                  </ul>
                </div>

                {/* Section 6 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    6. Liability
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Precision Sewer Inspection carries general liability insurance. Our liability is limited to the cost of the inspection service. We are not liable for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Decisions made based on our findings (repair costs, purchase decisions, etc.)</li>
                    <li>Conditions not visible or accessible during inspection</li>
                    <li>Consequential or incidental damages</li>
                  </ul>
                </div>

                {/* Section 7 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    7. Privacy & Data
                  </h3>
                  <p className="text-gray-700">
                    We collect contact information and property addresses solely to perform and deliver our services. Video recordings and reports are provided to the customer and retained for our records. We do not sell or share your information with third parties except as required to deliver our services or comply with legal obligations.
                  </p>
                </div>

                {/* Section 8 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    8. Disputes
                  </h3>
                  <p className="text-gray-700">
                    If you have concerns about your inspection or report, please contact us at <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline">support@precisionsewerinspections.com</a>. We are committed to addressing any issues promptly. Any disputes not resolved informally shall be governed by the laws of the State of Indiana.
                  </p>
                </div>

                {/* Section 9 */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    9. Changes to Terms
                  </h3>
                  <p className="text-gray-700">
                    We may update these terms from time to time. The current version will always be available on this page. Continued use of our services after changes constitutes acceptance of the updated terms.
                  </p>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 rounded-xl p-6 mt-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Questions?</h3>
                  <p className="text-gray-700">
                    If you have any questions about these terms, please contact us at{' '}
                    <a href="mailto:support@precisionsewerinspections.com" className="text-primary-600 hover:underline font-medium">
                      support@precisionsewerinspections.com
                    </a>{' '}
                    or call{' '}
                    <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline font-medium">
                      {COMPANY_INFO.phone}
                    </a>.
                  </p>
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
