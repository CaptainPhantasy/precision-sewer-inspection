'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'
import { useDiversity } from '@/components/diversity/diversity-provider'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/areas', label: 'Service Areas' },
  { href: '/locating', label: 'Utility Locating', highlight: true },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useDiversity()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 md:h-28">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-32 h-16 md:w-52 md:h-24 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Precision Sewer Inspection"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="font-heading font-bold text-primary-900 text-xl leading-tight">Precision Sewer</span>
              <span className="font-heading font-bold text-primary-900 text-xl leading-tight">Inspection</span>
              <span className="text-sm text-gray-600 mt-0.5">Central Indiana&apos;s Trusted Experts</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks?.map((link) => (
              <Link
                key={link?.href ?? ''}
                href={link?.href ?? '/'}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  (link as { highlight?: boolean })?.highlight 
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                    : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                }`}
              >
                {t(link?.label ?? '')}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
              className="hidden md:flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {COMPANY_INFO?.phone ?? ''}
            </a>
            <Link
              href="/contact"
              className="hidden sm:inline-flex btn-primary text-sm"
            >
              {t('Book Inspection')}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks?.map((link) => (
                <Link
                  key={link?.href ?? ''}
                  href={link?.href ?? '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 font-medium rounded-lg transition-colors ${
                    (link as { highlight?: boolean })?.highlight 
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                      : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                >
                  {t(link?.label ?? '')}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-2">
                <a
                  href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                  className="flex items-center gap-2 px-4 py-3 text-primary-700 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  {COMPANY_INFO?.phone ?? ''}
                </a>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full mt-2 justify-center"
                >
                  {t('Book Inspection')}
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
