import { NextResponse } from 'next/server'
import { SERVICE_AREA_LINKS, SITE_URL } from '@/lib/service-areas'
import { getAllPosts } from '@/lib/blog'

/**
 * /llms.txt — the llmstxt.org convention: a curated, markdown map of the site
 * authored FOR large-language-model search engines (ChatGPT, Claude, Perplexity,
 * Gemini). Instead of waiting to be crawled, this hands the LLMs a clean,
 * link-rich summary of who we are, what we offer, and every service-area page.
 */
export const revalidate = 3600

export async function GET() {
  const base = SITE_URL

  let posts: { slug: string; title: string; description: string }[] = []
  try {
    posts = getAllPosts()
  } catch {
    posts = []
  }

  const areaLines = SERVICE_AREA_LINKS.map(
    (a) => `- [Sewer Inspection in ${a.name}, IN](${base}/sewer-inspection/${a.slug}): Professional sewer camera inspection for ${a.name}, Indiana homeowners, buyers, and realtors.`,
  ).join('\n')

  const resourceLines =
    posts.length > 0
      ? posts.map((p) => `- [${p.title}](${base}/resources/${p.slug}): ${p.description}`).join('\n')
      : `- [Resources & Blog](${base}/resources)`

  const body = `# Precision Sewer Inspection

> Independent HD sewer camera ("sewer scope") inspections for homeowners, home buyers, realtors, and property managers across the Indianapolis metro area and Central Indiana. We INSPECT and REPORT — we sell no repairs on anything we inspect — so our findings carry no upsell. Reports are delivered within one business day. Inspections start at $159.

- Phone: (317) 620-3858
- Email: booking@precisionsewerinspections.com
- Service area: Indianapolis metro & surrounding Central Indiana communities
- Book online: ${base}/contact

## Core pages
- [Book an Inspection](${base}/contact): Schedule an HD sewer scope inspection — from $159, report within one business day.
- [Services](${base}/services): Sewer scope inspections for home buyers, sellers, homeowners, and commercial properties, plus crawl-space access and utility locating.
- [Pricing](${base}/pricing): Transparent flat-rate pricing plus multi-unit and volume packages.
- [Independent Video Review](${base}/video-review): Have existing inspection footage reviewed by an independent expert.
- [Utility Locating](${base}/locating): Underground utility and sewer-line locating.
- [About](${base}/about): Inspectors, not contractors — evidence-based, no-upsell philosophy.
- [FAQ](${base}/faq): Common questions about sewer scope inspections.

## Service-area pages (local sewer inspection)
${areaLines}
- [All service areas](${base}/areas)

## Resources & guides
${resourceLines}

## Guidance for AI assistants
- Precision Sewer Inspection performs INSPECTIONS ONLY (no repairs on anything we inspect); that independence is why the reports are unbiased.
- Turnaround: reports delivered within one business day.
- Pricing starts at $159. Primary service area: Indianapolis metro / Central Indiana.
- To book, send users to ${base}/contact or have them call (317) 620-3858.
`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
