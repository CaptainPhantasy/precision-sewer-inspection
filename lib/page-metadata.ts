import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/service-areas'
import { SERVICE_OPTIONS } from '@/lib/checkout-pricing'

export const SITE_DESCRIPTION = `Sewer camera inspections in Indianapolis and Central Indiana from $${SERVICE_OPTIONS[0].amountCents / 100} with cleanout access. HD video, written findings and online booking.`
export const SITE_TITLE = 'Indianapolis Sewer Camera Inspections'

export function serviceAreaDescription(name: string) {
  return `Sewer camera inspections in ${name}, IN from $${SERVICE_OPTIONS[0].amountCents / 100} with cleanout access. HD video and written findings. Confirm your address and book with PSI.`
}

/** Use the production page's URL even when reviewing a separate editing copy. */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const brandedTitle = `${title} | Precision Sewer Inspections`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      type: 'website',
      locale: 'en_US',
      siteName: 'Precision Sewer Inspections',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Precision Sewer Inspections' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}
