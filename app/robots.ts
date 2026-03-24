import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use canonical non-www domain for consistent SEO
  const baseUrl = 'https://precisionsewerinspections.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
