import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Sewer Inspection Resources & Education',
  description: 'Learn about sewer inspections, common pipe problems, maintenance tips, and what to expect during a professional sewer scope. Expert guides from Precision Sewer Inspection.',
  openGraph: {
    title: 'Sewer Inspection Resources | Precision Sewer Inspection',
    description: 'Expert guides on sewer inspections, common problems, and maintenance tips for Central Indiana homeowners.',
  },
  alternates: {
    canonical: '/resources',
  },
}

export default function ResourcesPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1 bg-primary-700 text-primary-200 text-sm font-semibold rounded-full mb-6">
                Resources
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Sewer Inspection Education
              </h1>
              <p className="text-xl text-primary-200">
                Expert guides, tips, and insights to help you understand your sewer system and make informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            {posts?.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Coming Soon</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  We&apos;re working on educational content to help you understand sewer inspections. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts?.map((post) => (
                  <Link
                    key={post?.slug}
                    href={`/resources/${post?.slug}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                          {post?.category ?? 'General'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post?.readTime ?? '5 min read'}
                        </span>
                      </div>
                      <h2 className="text-lg font-heading font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                        {post?.title ?? ''}
                      </h2>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post?.description ?? ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post?.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                        <span className="text-primary-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Have Questions?</h2>
            <p className="text-gray-600 mb-8">
              Our AI assistant is available 24/7 to answer your sewer inspection questions, or contact us directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary"
              >
                Call {COMPANY_INFO?.phone ?? ''}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
