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

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const area = await prisma.serviceArea.findUnique({
    where: { slug },
    include: {
      services: {
        include: { service: true },
      },
      technicians: {
        include: { technician: true },
      },
    },
  });

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
      url: `/sewer-inspection-${slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `/sewer-inspection-${slug}`,
    },
  };
}

// Generate static params for all active service areas
// Returns empty array on DB failure so build succeeds without a connected DB
export async function generateStaticParams() {
  try {
    const areas = await prisma.serviceArea.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

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
  const area = await prisma.serviceArea.findUnique({
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
  });

  if (!area) {
    notFound();
  }

  // Fetch FAQs
  const faqs = await prisma.fAQ.findMany({
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
  });

  // Fetch nearby areas (excluding current)
  const nearbyAreas = await prisma.serviceArea.findMany({
    where: {
      isActive: true,
      id: { not: area.id },
    },
    orderBy: { priority: 'desc' },
    take: 6,
  });

  // Fetch review stats (would come from AggregatedReview in production)
  const reviews = {
    rating: 4.9,
    count: 47,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" />
      <Header />
      <main className="flex-1">
        <ServiceAreaPage
          area={area}
          faqs={faqs}
          reviews={reviews}
          nearbyAreas={nearbyAreas}
        />
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
