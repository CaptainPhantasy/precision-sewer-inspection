import { COMPANY_INFO, FAQ_ITEMS, SERVICE_AREAS } from '@/lib/constants'

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Service' | 'FAQPage' | 'WebPage' | 'BreadcrumbList'
  pageTitle?: string
  pageDescription?: string
  breadcrumbs?: { name: string; url: string }[]
  /**
   * The exact FAQ items rendered on the page. FAQPage structured data must
   * describe only what the page actually shows, so callers pass their rendered
   * list; defaults to the full homepage set for backwards compatibility.
   */
  faqs?: { question: string; answer: string }[]
}

export default function StructuredData({ type, pageTitle, pageDescription, breadcrumbs, faqs }: StructuredDataProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://precisionsewerinspections.com'

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#organization`,
    name: COMPANY_INFO.name,
    description: 'Independent sewer inspection company serving Central Indiana. Inspection only, no repairs, so every finding is unbiased. HD video sewer scope inspections, one-business-day report delivery, InterNACHI certified inspectors.',
    url: baseUrl,
    telephone: COMPANY_INFO.phone,
    email: COMPANY_INFO.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.7684,
      longitude: -86.1581,
    },
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': 'City',
      name: `${area}, Indiana`,
    })),
    priceRange: '$159-$450',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '14:00',
      },
    ],
    image: `${baseUrl}/logo.png`,
    logo: `${baseUrl}/logo.png`,
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sewer Inspection Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Early Adopter Sewer Scope Inspection',
            description: 'Limited time launch pricing. HD video inspection with premium written report delivered within one business day.',
          },
          price: '159.00',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Standard Sewer Scope Inspection',
            description: 'HD video inspection of your main sewer line with premium written report delivered within one business day.',
          },
          price: '159.00',
          priceCurrency: 'USD',
        },
      ],
    },
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Sewer Scope Inspection',
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY_INFO.name,
      telephone: COMPANY_INFO.phone,
    },
    additionalType: [
      'sewer camera inspection',
      'sanitary lateral camera inspection',
      'pre-purchase sewer scope',
      'non-invasive sewer line inspection',
    ],
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': 'City',
      name: `${area}, Indiana`,
    })),
    description: 'Unbiased sewer camera surveys for home buyers, homeowners, and real estate professionals in Central Indiana. Certified sewer scope inspector, HD footage, premium reporting with transparent pricing.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '159',
      highPrice: '450',
      priceCurrency: 'USD',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faqs ?? FAQ_ITEMS).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle || COMPANY_INFO.name,
    description: pageDescription || 'Professional sewer scope inspections in Central Indiana.',
    url: baseUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY_INFO.name,
      url: baseUrl,
    },
  }

  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      }
    : null

  const getSchema = () => {
    switch (type) {
      case 'LocalBusiness':
        return localBusinessSchema
      case 'Service':
        return serviceSchema
      case 'FAQPage':
        return faqSchema
      case 'WebPage':
        return webPageSchema
      case 'BreadcrumbList':
        return breadcrumbSchema
      default:
        return localBusinessSchema
    }
  }

  const schema = getSchema()
  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
