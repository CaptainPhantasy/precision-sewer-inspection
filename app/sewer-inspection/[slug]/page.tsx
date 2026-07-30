// ============================================================================
// Dynamic Service Area Page
// Generates individual pages for each service area
// e.g., /sewer-inspection-indianapolis-in
// ============================================================================

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Header from '@/components/header';
import Footer from '@/components/footer';
import AIChat from '@/components/ai-chat';
import StructuredData from '@/components/structured-data';
import ServiceAreaPage from '@/components/local-pages/ServiceAreaPage';
import { withDatabaseFallback } from '@/lib/prisma-timeout';

const prisma = new PrismaClient();

const fallbackAreaNames: Record<string, string> = {
  'indianapolis-in': 'Indianapolis',
  'carmel-in': 'Carmel',
  'fishers-in': 'Fishers',
  'noblesville-in': 'Noblesville',
  'greenwood-in': 'Greenwood',
  'westfield-in': 'Westfield',
  'franklin-in': 'Franklin',
  'greenfield-in': 'Greenfield',
};

function fallbackAreaForSlug(slug: string) {
  const name = fallbackAreaNames[slug] ?? slug
    .replace(/-in$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const now = new Date();

  return {
    id: slug,
    name,
    slug,
    city: name,
    state: 'IN',
    zipCodes: [],
    geoBounds: null,
    population: null,
    isActive: true,
    priority: 0,
    description: `Professional sewer camera inspection services in ${name}, Indiana. Serving homeowners, realtors, and property managers.`,
    localKeywords: [
      `sewer inspection ${name}`,
      `sewer camera ${name}`,
      `${name} drain inspection`,
      `sewer line ${name} Indiana`,
    ],
    createdAt: now,
    updatedAt: now,
    services: [],
    technicians: [],
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const area = await withDatabaseFallback(
    prisma.serviceArea.findUnique({
      where: { slug },
      include: {
        services: {
          include: { service: true },
        },
        technicians: {
          include: { technician: true },
        },
      },
    }),
    fallbackAreaForSlug(slug),
  );

  if (!area) {
    return { title: 'Service Area Not Found' };
  }

  return {
    title: `Sewer Inspection in ${area.name}, ${area.state} | Precision Sewer Inspections`,
    description: area.description || `Professional sewer camera inspection services in ${area.name}, Indiana. Serving homeowners, realtors, and property managers.`,
    keywords: area.localKeywords || [
      `sewer inspection ${area.name}`,
      `sewer camera ${area.name}`,
      `${area.city} drain inspection`,
      `sewer line ${area.name} Indiana`,
    ],
    openGraph: {
      title: `Sewer Inspection in ${area.name} | Precision Sewer Inspections`,
      description: area.description || `Professional sewer inspection services in ${area.name}.`,
      url: `/sewer-inspection/${slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `/sewer-inspection/${slug}`,
    },
  };
}

// Generate static params for all active service areas
// Returns empty array on DB failure so build succeeds without a connected DB
export async function generateStaticParams() {
  try {
    const areas = await withDatabaseFallback(
      prisma.serviceArea.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
      [],
    );

    return areas.map((area) => ({
      slug: area.slug,
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Fetch service area with all related data
  const area = await withDatabaseFallback(
    prisma.serviceArea.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isAvailable: true },
          include: { service: true },
        },
        technicians: {
          where: { technician: { isPublic: true } },
          include: { technician: true },
        },
      },
    }),
    fallbackAreaForSlug(slug),
  );

  if (!area) {
    notFound();
  }

  // Fetch FAQs
  const faqs = await withDatabaseFallback(
    prisma.fAQ.findMany({
      where: {
        isPublished: true,
        OR: [
          { serviceAreas: { isEmpty: true } }, // FAQ applies to all areas
          { serviceAreas: { has: area.name } }, // FAQ specifically for this area
        ],
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    }),
    [],
  );

  // Fetch nearby areas (excluding current)
  const nearbyAreas = await withDatabaseFallback(
    prisma.serviceArea.findMany({
      where: {
        isActive: true,
        id: { not: area.id },
      },
      orderBy: { priority: 'desc' },
      take: 6,
    }),
    [],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      {faqs.length > 0 && (
        <StructuredData type="FAQPage" faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      )}
      <Header />
      <main className="flex-1">
        <ServiceAreaPage
          area={area}
          faqs={faqs}
          nearbyAreas={nearbyAreas}
        />
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
