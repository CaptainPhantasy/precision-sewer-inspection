import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://precisionsewerinspection.com').replace(/\/$/, '')
  const isStaging = process.env.PSI_STAGING_MODE === 'true'

  return {
    rules: {
      userAgent: '*',
      allow: isStaging ? [] : ['/'],
      disallow: isStaging ? ['/'] : ['/api/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
