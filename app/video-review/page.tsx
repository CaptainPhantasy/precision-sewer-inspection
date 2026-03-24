'use client'

import { useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Video, Link2, FileText, Send, CheckCircle, Loader2 } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import toast, { Toaster } from 'react-hot-toast'
import { useLeadCapture } from '@/hooks/use-lead-capture'

export default function VideoReviewPage() {
  const { captureField, markConverted } = useLeadCapture('video-review')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    videoLink: '',
    reportLink: '',
    additionalNotes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleLeadBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!value.trim()) return
    const fieldMap: Record<string, string> = { email: 'email', name: 'name', phone: 'phone' }
    const key = fieldMap[name]
    if (key) {
      captureField({ [key]: value.trim() })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.videoLink) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `VIDEO REVIEW REQUEST\n\nVideo Link: ${formData.videoLink}\n\nReport Link: ${formData.reportLink || 'Not provided'}\n\nAdditional Notes: ${formData.additionalNotes || 'None'}`,
          source: 'video-review',
        }),
      })

      if (response.ok) {
        markConverted()
        setIsSubmitted(true)
        toast.success('Video review request submitted!')
      } else {
        toast.error('Failed to submit. Please try again.')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50 py-16">
          <div className="max-w-md mx-auto text-center px-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Submitted for Review</h1>
            <p className="text-gray-600 mb-6">
              Thank you! We&apos;ve received your video review request. You&apos;ll receive our independent assessment within 24 hours.
            </p>
            <p className="text-sm text-gray-500">
              Questions? Call us at{' '}
              <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 hover:underline">
                {COMPANY_INFO.phone}
              </a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-primary-300" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Independent Video Review
              </h1>
              <p className="text-lg text-primary-200">
                Already have a sewer scope video from another company? Submit it for a free, unbiased review of the findings.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-12 bg-white">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Your Video</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="review-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={handleLeadBlur}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="review-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="review-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={handleLeadBlur}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="review-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="review-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handleLeadBlur}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoComplete="tel"
                  />
                </div>

                {/* Video Link */}
                <div>
                  <label htmlFor="review-videoLink" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Video Link <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    id="review-videoLink"
                    type="url"
                    value={formData.videoLink}
                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                    placeholder="https://drive.google.com/... or Dropbox, YouTube, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share via Google Drive, Dropbox, YouTube (unlisted), or any file sharing service
                  </p>
                </div>

                {/* Report Link */}
                <div>
                  <label htmlFor="review-reportLink" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Report/Document Link (Optional)
                    </span>
                  </label>
                  <input
                    id="review-reportLink"
                    type="url"
                    value={formData.reportLink}
                    onChange={(e) => setFormData({ ...formData, reportLink: e.target.value })}
                    placeholder="https://... (if you have a written report to include)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you received a written report with the video, share it here for review
                  </p>
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="review-additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="review-additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    rows={3}
                    placeholder="Any specific concerns or questions about the video?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* What to Expect */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary-900 mb-2">What to Expect</h3>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• We&apos;ll review your video within 24 hours</li>
                    <li>• You&apos;ll receive a no-jargon explanation of findings</li>
                    <li>• This is an informational review only — no repair recommendations</li>
                    <li>• We do not provide contractor referrals</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Video for Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
