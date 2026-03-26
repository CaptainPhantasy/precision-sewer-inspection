// ============================================================================
// FAQ Page
// Displays all FAQs with Schema.org markup
// ============================================================================

import { PrismaClient } from '@prisma/client';
import Header from '@/components/header';
import Footer from '@/components/footer';
import AIChat from '@/components/ai-chat';
import StructuredData from '@/components/structured-data';
import FAQAccordion from '@/components/local-pages/FAQAccordion';
import { generateFAQSchema, getJsonLdScript } from '@/lib/schema/markup';

const prisma = new PrismaClient();

export const metadata = {
  title: 'Frequently Asked Questions | Precision Sewer Inspections',
  description: 'Common questions about sewer inspections, pricing, scheduling, and our services. Expert answers to help you understand our inspection process.',
};

export default async function FAQPage() {
  const faqs = await prisma.fAQ.findMany({
    where: { isPublished: true },
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
    ],
  });

  const faqSchema = generateFAQSchema(faqs);

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Everything you need to know about sewer inspections, our services, and the inspection process.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <FAQAccordion faqs={faqs} categories={true} />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              We're here to help. Contact us and we'll get you answers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="tel:3176203858"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Call (317) 620-3858
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
