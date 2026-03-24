import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import PromoBanner from '@/components/promo-banner'
import GoogleAnalytics from '@/components/google-analytics'
import SiteTracker from '@/components/site-tracker'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'Sewer Scope Indianapolis from $159 | Precision Sewer',
      template: '%s | Precision Sewer',
    },
    description: 'Indianapolis sewer scope from $159. InterNACHI certified, 24-hour HD video reports. Serving Central Indiana. No upselling.',
    keywords: [
      'sewer scope Indianapolis',
      'sewer inspection Indianapolis',
      'sewer camera inspection Indiana',
      'sewer line inspection cost Indianapolis',
      'home inspection sewer scope',
      'real estate sewer inspection',
      'sewer scope Carmel IN',
      'sewer scope Fishers IN',
      'sewer inspection near me',
      'pipe inspection Indianapolis',
      'drain camera inspection',
      'sewer lateral inspection',
      'pre-purchase sewer inspection',
      'clay pipe inspection Indiana',
    ],
    authors: [{ name: 'Precision Sewer Inspection' }],
    creator: 'Precision Sewer Inspection',
    publisher: 'Precision Sewer Inspection',
    formatDetection: {
      telephone: true,
      email: true,
      address: true,
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/logo.png',
    },
    manifest: '/manifest.json',
    openGraph: {
      title: 'Sewer Scope Indianapolis from $159 | Precision Sewer',
      description: "See what's really in your pipes. HD video sewer inspection with 24-hour delivery. InterNACHI certified. Central Indiana.",
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Precision Sewer Inspection - Central Indiana Sewer Scope Experts',
        },
      ],
      type: 'website',
      locale: 'en_US',
      siteName: 'Precision Sewer Inspection',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Indianapolis Sewer Scope from $159 | Precision Sewer',
      description: "Central Indiana's trusted sewer inspection. InterNACHI certified, 24-hour HD reports.",
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://precisionsewerinspections.com',
    },
    verification: {
      // Add these when you have them
      // google: 'your-google-verification-code',
      // bing: 'your-bing-verification-code',
    },
    category: 'Home Services',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <PromoBanner />
        {children}
        <Toaster position="bottom-right" />
        <GoogleAnalytics />
        <SiteTracker />
      </body>
    </html>
  )
}
