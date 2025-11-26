/**
 * Region Landing Page Template
 *
 * Dynamic region pages that enable local search rankings.
 * Each region page contains:
 * - 650-1000 words of unique, location-specific content
 * - Local keyword optimization
 * - Structured data (Breadcrumb + Service schemas)
 * - Animations and engaging UI
 *
 * URL Structure: /regions/[country]/[city]
 * Example: /regions/australia/brisbane
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRegionContent, getAllRegions, regionExists } from '@/lib/seo/regionCopy';
import { buildDynamicMetadata } from '@/lib/seo/buildPageMetadata';
import { BreadcrumbSchema, ServiceSchema } from '@/components/seo/JsonLd';
import { ScrollReveal, HoverLift, AnimatedCounter } from '@/components/AnimatedElements';
import { seoConfig } from '@/lib/seo/seoConfig';

type Props = {
  params: { country: string; city: string };
};

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, country } = params;

  // Check if region exists
  if (!regionExists(country, city)) {
    return {
      title: 'Region Not Found',
      description: 'This region page does not exist.',
    };
  }

  const content = getRegionContent(country, city);

  return buildDynamicMetadata(content.title, content.metaDescription, {
    keywords: content.keywords,
    image: '/og-region.png',
  });
}

/**
 * Generate static params for all regions (ISR)
 */
export function generateStaticParams() {
  return getAllRegions();
}

/**
 * Region Landing Page Component
 */
export default function RegionPage({ params }: Props) {
  const { city, country } = params;

  // Check if region exists
  if (!regionExists(country, city)) {
    notFound();
  }

  const content = getRegionContent(country, city);

  return (
    <>
      {/* Structured Data - Breadcrumbs */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Regions', url: '/regions' },
          { name: content.city, url: `/regions/${country.toLowerCase()}/${city.toLowerCase()}` },
        ]}
      />

      {/* Structured Data - Service Schema */}
      <ServiceSchema
        service={{
          name: `SEO Intelligence for ${content.city}`,
          description: content.metaDescription,
          serviceType: 'SEO Intelligence Services',
          areaServed: `${content.city}, ${content.region}, ${content.country}`,
        }}
      />

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-blue-50 to-emerald-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #347bf7 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4">
          <ScrollReveal delay={0}>
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Now serving {content.city}, {content.region}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {content.heroTitle}
            </h1>

            <p className="text-xl text-gray-600 mb-6 font-medium">
              {content.heroSubtitle}
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {content.heroBody}
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Start Free Audit
              </button>
              <button className="px-8 py-3 bg-white text-gray-700 rounded-lg font-semibold border border-gray-300 hover:border-blue-600 transition-all duration-300">
                View Pricing
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.stats.map((stat, idx) => (
                <HoverLift key={idx}>
                  <div className="text-center p-6 rounded-lg border border-blue-100 bg-gradient-to-br from-white to-blue-50">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {stat.value.includes('+') ? (
                        <>
                          <AnimatedCounter
                            end={parseInt(stat.value.replace(/[^\d]/g, ''))}
                            suffix={stat.value.includes('K') ? 'K+' : stat.value.includes('M') ? 'M+' : '+'}
                          />
                        </>
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-gray-600 font-medium">{stat.label}</p>
                  </div>
                </HoverLift>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal delay={300}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {content.mainSectionTitle}
            </h2>

            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {content.mainContent}
              </p>
            </div>

            {/* Why Choose Synthex */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-8 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why {content.city} Businesses Choose Synthex
              </h3>
              <ul className="space-y-4">
                {content.whyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 leading-relaxed flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Challenges Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Local SEO Challenges in {content.city}
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {content.challengesContent}
              </p>
            </div>

            {/* Solutions Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How Synthex Solves These Challenges
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {content.solutionsContent}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal delay={400}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Dominate Local Search in {content.city}?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Get your free SEO audit and see exactly what's blocking your rankings.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Start Free Audit
              </button>
              <button className="px-8 py-4 bg-transparent text-white rounded-lg font-bold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300">
                View Live Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer Breadcrumb */}
      <section className="py-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
            <span>/</span>
            <a href="/regions" className="hover:text-blue-600 transition-colors">Regions</a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{content.city}</span>
          </div>
        </div>
      </section>
    </>
  );
}
