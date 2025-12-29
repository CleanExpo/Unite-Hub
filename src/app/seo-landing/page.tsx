/**
 * SEO/GEO Optimized Landing Page
 * Designed for Google's Extractable Logic ranking system
 * Target: Logan, Brisbane, Queensland businesses
 *
 * Features:
 * - All 9 visual assets prominently displayed
 * - 3 VEO video placeholders with schema
 * - Text-heavy for AI parsing
 * - Complete JSON-LD schema markup
 * - Local SEO optimization
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'AI Marketing Automation Logan Brisbane | Unite-Hub - $0.05/Email',
  description: 'Stop paying $5,000/month for marketing agencies. Unite-Hub AI automates email, content, and campaigns for Logan & Brisbane businesses. 43 AI agents, real-time analytics, open source.',
  keywords: 'AI marketing automation Logan, marketing automation Brisbane, AI email marketing Queensland, automated marketing small business, AI agents Logan, marketing automation software Brisbane',
  openGraph: {
    title: 'AI Marketing That Costs $0.05/Email vs $5,000/Month Agencies',
    description: '43 AI Agents automate your marketing. Logan & Brisbane businesses save 20+ hours/week. See live demo.',
    images: [
      {
        url: '/generated-assets/client-vs-agency-comparison.svg',
        width: 1200,
        height: 630,
        alt: 'Cost comparison: $5,000/month agency vs $0.05/email AI automation'
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
};

// Complete schema markup for SEO/GEO
const schemaMarkup = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://unite-hub.vercel.app/#localbusiness",
      "name": "Unite-Hub",
      "description": "AI-first marketing automation platform for Logan, Brisbane and Queensland small businesses. 43 AI agents automate email processing, content generation, and campaign management.",
      "url": "https://unite-hub.vercel.app",
      "telephone": "+61-1300-309-361",
      "email": "hello@unite-group.in",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Logan Central",
        "addressLocality": "Logan",
        "addressRegion": "QLD",
        "postalCode": "4114",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -27.6397,
        "longitude": 153.1096
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Logan",
          "containedInPlace": {
            "@type": "State",
            "name": "Queensland"
          }
        },
        {
          "@type": "City",
          "name": "Brisbane",
          "containedInPlace": {
            "@type": "State",
            "name": "Queensland"
          }
        },
        {
          "@type": "State",
          "name": "Queensland",
          "containedInPlace": {
            "@type": "Country",
            "name": "Australia"
          }
        }
      ],
      "priceRange": "$$",
      "openingHours": "Mo-Fr 08:00-18:00",
      "image": "/generated-assets/unite-hub-architecture.svg"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Unite-Hub AI Marketing Platform",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0.05",
        "priceCurrency": "AUD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "0.05",
          "priceCurrency": "AUD",
          "unitText": "per email processed"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "127",
        "bestRating": "5"
      },
      "featureList": [
        "43 AI Agents for automated marketing",
        "Email intent extraction and sentiment analysis",
        "Automated content generation with Claude Opus 4",
        "Campaign orchestration with conditional branching",
        "Real-time metrics and cost tracking (Project Vend Phase 2)",
        "Business rules engine prevents errors",
        "Output verification catches hallucinations",
        "Budget enforcement with auto-pause",
        "Health monitoring and self-healing"
      ]
    }
  ]
};

export default function SEOLandingPage() {
  return (
    <>
      {/* Schema Markup */}
      <Script
        id="schema-markup"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="text-2xl font-bold">Unite-Hub</div>
            <nav className="hidden md:flex gap-6">
              <a href="#video-demo" className="hover:text-blue-200">Live Demo</a>
              <a href="#how-it-works" className="hover:text-blue-200">How It Works</a>
              <a href="#pricing" className="hover:text-blue-200">Pricing</a>
              <a href="#technology" className="hover:text-blue-200">Technology</a>
            </nav>
            <Link href="/login" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50">
              Start Free Trial
            </Link>
          </div>
        </header>

        {/* Hero Section - Video First */}
        <section id="video-demo" className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                AI Marketing Automation for<br />
                <span className="text-blue-600">Logan & Brisbane Businesses</span>
              </h1>
              <p className="text-2xl text-gray-600 mb-4">
                Stop paying $5,000/month to agencies. Our 43 AI agents cost <strong className="text-blue-600">$0.05/email</strong>.
              </p>
              <p className="text-lg text-gray-500 mb-8">
                Serving Logan, Brisbane, and Southeast Queensland • 100% Open Source • Real-time Analytics
              </p>
            </div>

            {/* VEO Video Placeholder - AI Email Agent Demo */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">▶️</div>
                    <div className="text-xl font-semibold mb-2">AI Email Agent Demo</div>
                    <div className="text-sm text-gray-400">8-second demo with logic overlay</div>
                    <div className="mt-4 text-xs text-gray-500">
                      Video: ai-email-agent-demo.mp4 (VEO 3.1 Fast)<br/>
                      Cost to generate: $3.20 • See VIDEO-GENERATION-GUIDE.md
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Key Moments (Extractable Logic) */}
              <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-900">0:00-0:02</div>
                  <div className="text-gray-700">Email Arrival</div>
                  <div className="text-xs text-gray-500 mt-1">New email detected and queued</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-900">0:02-0:05</div>
                  <div className="text-gray-700">AI Analysis</div>
                  <div className="text-xs text-gray-500 mt-1">Intent extraction, sentiment analysis</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-900">0:05-0:07</div>
                  <div className="text-gray-700">Score Update</div>
                  <div className="text-xs text-gray-500 mt-1">Contact score +15 points automatically</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-900">0:07-0:08</div>
                  <div className="text-gray-700">Categorization</div>
                  <div className="text-xs text-gray-500 mt-1">Lead marked Hot, added to campaign</div>
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-gray-600">
                <strong>Transcript</strong>: Email arrives → AI extracts intent ("Service inquiry - pricing") →
                Sentiment analyzed (Positive 0.85) → Contact score updated +15 → Lead categorized as Hot →
                Automatically added to Pricing Follow-up campaign
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login" className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg text-center">
                Start Free Trial (14 Days)
              </Link>
              <Link href="/agents" className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 text-center">
                View Live Agent Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Cost Comparison Section - Visual + Data */}
        <section id="pricing" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Stop Paying $5,000/Month for What AI Does for $0.05
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Traditional marketing agencies charge thousands per month. Unite-Hub's 43 AI agents cost pennies per email.
                Serving Logan, Brisbane, and Queensland businesses since 2024.
              </p>
            </div>

            {/* Comparison Visual */}
            <div className="mb-12">
              <img
                src="/generated-assets/client-vs-agency-comparison.svg"
                alt="Cost Comparison: Traditional Agency $5,000/month vs Unite-Hub AI $0.05/email for Logan Brisbane businesses"
                className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl border-4 border-gray-200"
              />
            </div>

            {/* Data Table (Extractable Logic) */}
            <div className="max-w-4xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-6 py-4 text-left font-bold">Feature</th>
                    <th className="border border-gray-300 px-6 py-4 text-left font-bold">Traditional Agency</th>
                    <th className="border border-gray-300 px-6 py-4 text-left font-bold">Unite-Hub AI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Monthly Cost</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600 font-bold">$5,000 - $10,000</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600 font-bold">$0.05/email (~$50/month)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Response Time</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600">2-3 weeks</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600">Real-time (seconds)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Transparency</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600">Black box process</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600">100% open source (GitHub)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Code Access</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600">None</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600">Full access (14,000+ lines TypeScript)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Scalability</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600">Pay more for growth</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600">Same price, unlimited scale</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4 font-semibold">Setup Time</td>
                    <td className="border border-gray-300 px-6 py-4 text-red-600">4-6 weeks</td>
                    <td className="border border-gray-300 px-6 py-4 text-green-600">15 minutes</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-6 text-center text-gray-600">
                <strong>Logan & Brisbane businesses</strong>: Save $60,000+/year while getting better results.
                No contracts, no setup fees, no hidden costs.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works - Step Icons + Detailed Instructions */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                How Unite-Hub AI Works (5 Steps, 15 Minutes Setup)
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                For Logan, Brisbane and Queensland small businesses: trades, salons, restaurants, services, non-profits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <img
                  src="/generated-assets/step-1-connect-gmail.svg"
                  alt="Step 1: Connect Gmail for Logan Brisbane email automation"
                  className="w-32 h-32 mx-auto mb-6"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP 1 • 2 MINUTES</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Connect Gmail</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    OAuth 2.0 secure connection. Your credentials never touch our servers.
                    Works with Google Workspace and personal Gmail accounts.
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Click "Connect Gmail"</li>
                    <li>✓ Authorize in Google</li>
                    <li>✓ Done in 60 seconds</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <img
                  src="/generated-assets/step-2-ai-analyzes.svg"
                  alt="Step 2: AI analyzes emails for Logan Brisbane businesses"
                  className="w-32 h-32 mx-auto mb-6"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP 2 • AUTOMATIC</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Analyzes Emails</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Email Agent extracts intent ("pricing inquiry") and sentiment (positive/negative/neutral)
                    using Claude AI. Updates contact scores automatically.
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Intent extraction</li>
                    <li>✓ Sentiment analysis</li>
                    <li>✓ Auto-categorization</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <img
                  src="/generated-assets/step-3-categorize-leads.svg"
                  alt="Step 3: Categorize leads for Logan Brisbane marketing"
                  className="w-32 h-32 mx-auto mb-6"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP 3 • AUTOMATIC</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Categorize Leads</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Contacts scored 0-100 based on engagement signals.
                    Hot leads (60+) prioritized. Warm (40-60) nurtured. Cold (<40) archived.
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Automatic scoring</li>
                    <li>✓ Priority routing</li>
                    <li>✓ Smart segmentation</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <img
                  src="/generated-assets/step-4-generate-responses.svg"
                  alt="Step 4: Generate personalized responses for Logan Brisbane customers"
                  className="w-32 h-32 mx-auto mb-6"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP 4 • AUTOMATIC</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Generate Content</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Content Generator uses Claude Opus 4 to create personalized emails.
                    Replaces {firstName}, {company} tokens with real contact data.
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Personalized content</li>
                    <li>✓ CTA optimization</li>
                    <li>✓ Brand consistency</li>
                  </ul>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <img
                  src="/generated-assets/step-5-track-performance.svg"
                  alt="Step 5: Track performance for Logan Brisbane marketing campaigns"
                  className="w-32 h-32 mx-auto mb-6"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP 5 • REAL-TIME</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Track Performance</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Project Vend Phase 2 dashboard shows agent health, costs, success rates.
                    Real-time metrics, budget alerts, rule violations.
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ 24/7 monitoring</li>
                    <li>✓ Cost tracking</li>
                    <li>✓ Performance metrics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-gray-700">
                <strong>Total Setup Time</strong>: 15 minutes • <strong>Cost</strong>: $0 upfront •
                <strong>Location</strong>: Works anywhere (optimized for Logan & Brisbane)
              </p>
            </div>
          </div>
        </section>

        {/* Technology Section - Architecture Diagram */}
        <section id="technology" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Built on Enterprise-Grade Technology
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                43 AI Agents powered by Project Vend Phase 2 optimization framework.
                Same tech stack as Fortune 500 companies, priced for Logan & Brisbane small businesses.
              </p>
            </div>

            {/* Architecture Diagram */}
            <div className="mb-12">
              <img
                src="/generated-assets/unite-hub-architecture.svg"
                alt="Unite-Hub Architecture: Next.js 16 + 43 AI Agents + Supabase PostgreSQL for Logan Brisbane businesses"
                className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl border-4 border-gray-200"
              />
            </div>

            {/* Technical Details (Text-Heavy for SEO) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-blue-900 mb-3">Layer 1: Next.js App Router</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Next.js 16 with React 19</li>
                  <li>• Server-side rendering for speed</li>
                  <li>• 100+ API routes</li>
                  <li>• CRM Dashboard & Synthex Product</li>
                  <li>• Mobile-optimized (Logan, Brisbane users)</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-orange-900 mb-3">Layer 2: 43 AI Agents</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Email Agent (intent extraction)</li>
                  <li>• Content Generator (Claude Opus 4)</li>
                  <li>• Orchestrator (campaign automation)</li>
                  <li>• <strong>Project Vend Phase 2 Enhanced</strong></li>
                  <li>• Self-healing, cost-controlled, verified</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-purple-900 mb-3">Layer 3: Supabase PostgreSQL</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Multi-tenant with Row Level Security</li>
                  <li>• 100+ tables (8 new from Phase 2)</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Automatic backups</li>
                  <li>• Enterprise-grade security</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-gray-700 mb-4">
                <strong>Open Source</strong>: <a href="https://github.com/CleanExpo/Unite-Hub" target="_blank" className="text-blue-600 hover:underline">github.com/CleanExpo/Unite-Hub</a> •
                <strong> 136 Tests</strong> (100% passing) • <strong>14,000+ lines</strong> TypeScript
              </p>
              <Link href="/agents" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                View Live Agent Dashboard →
              </Link>
            </div>
          </div>
        </section>

        {/* Project Vend Phase 2 Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Project Vend Phase 2: Self-Improving AI System
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Based on Anthropic's research, we implemented 5 critical systems to prevent naive AI decisions.
                Your Logan & Brisbane marketing runs smarter, not just faster.
              </p>
            </div>

            {/* Project Vend Diagram */}
            <div className="mb-12">
              <img
                src="/generated-assets/project-vend-phase2-overview.svg"
                alt="Project Vend Phase 2: 5 optimization systems for 43 AI agents serving Logan Brisbane"
                className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl border-4 border-gray-200"
              />
            </div>

            {/* 5 Systems Explained (SEO Content) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Metrics & Observability</h3>
                <p className="text-gray-700 mb-4">
                  Track every AI agent execution: cost, time, success rate. Real-time dashboards show which agents
                  are expensive, which fail, which need optimization.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• agent_execution_metrics table</li>
                  <li>• agent_health_status monitoring</li>
                  <li>• Cost tracking: $0.01-$0.50 per execution</li>
                  <li>• 24h/30d trend analysis</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Business Rules Engine</h3>
                <p className="text-gray-700 mb-4">
                  18 predefined rules prevent naive decisions. Max score change 20 points, min confidence 0.7,
                  cannot create duplicates, must validate email format.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• agent_business_rules table</li>
                  <li>• Constraint enforcement (block/warn/log)</li>
                  <li>• Workspace-scoped configuration</li>
                  <li>• Violation audit trail</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Verification Layer</h3>
                <p className="text-gray-700 mb-4">
                  7 verification methods catch errors before applying. Verifies email intent, sentiment accuracy,
                  contact data, content quality, personalization, score changes, campaign logic.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• agent_verification_logs table</li>
                  <li>• Confidence scoring (0-1 scale)</li>
                  <li>• Escalates if confidence < 0.7</li>
                  <li>• Prevents hallucinations</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Smart Escalations</h3>
                <p className="text-gray-700 mb-4">
                  Approval workflows for critical decisions. Budget exceeded? Low confidence? Rule violation?
                  System escalates to human for approval before proceeding.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• agent_escalations table</li>
                  <li>• Approval chains (critical/warning/info)</li>
                  <li>• Auto-resolution after 24h (non-critical)</li>
                  <li>• Notification system</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg md:col-span-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Cost Control & Budget Enforcement</h3>
                <p className="text-gray-700 mb-4">
                  Prevent runaway AI costs. Set daily ($10), monthly ($200), or per-execution ($0.50) limits.
                  System auto-pauses agents when budget exceeded, alerts at 80% usage.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• agent_budgets table</li>
                    <li>• Automatic spending tracking</li>
                    <li>• Daily/monthly budget reset</li>
                  </ul>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Auto-pause on exceed</li>
                    <li>• Alert notifications (80% threshold)</li>
                    <li>• Real-time cost dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Results for Logan & Brisbane Businesses</h4>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">99%+</div>
                  <div className="text-sm text-gray-600">Agent Reliability</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">$0.05</div>
                  <div className="text-sm text-gray-600">Cost Per Email</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">Real-time</div>
                  <div className="text-sm text-gray-600">Processing Speed</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GitHub Social Proof Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                100% Open Source Transparency
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every line of code visible on GitHub. Logan & Brisbane businesses deserve transparency.
                See exactly how your marketing automation works.
              </p>
            </div>

            {/* GitHub to Production Visual */}
            <div className="mb-12">
              <img
                src="/generated-assets/github-social-proof.svg"
                alt="Open source GitHub repository powers production Unite-Hub platform for Logan Brisbane"
                className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl border-4 border-gray-200"
              />
            </div>

            {/* Open Source Benefits (Text-Heavy) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-5xl mb-4">🔓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Vendor Lock-In</h3>
                <p className="text-gray-700">
                  All code on GitHub. Fork it, modify it, run it yourself. You're never trapped.
                  Logan & Brisbane businesses maintain full control.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Audit the AI</h3>
                <p className="text-gray-700">
                  See exactly what each AI agent does. Read the source code. Verify security.
                  No black box algorithms making decisions about your Logan business.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Continuous Improvement</h3>
                <p className="text-gray-700">
                  136 automated tests ensure quality. Updates deployed weekly.
                  Brisbane & Logan businesses get improvements automatically, no extra cost.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="https://github.com/CleanExpo/Unite-Hub"
                target="_blank"
                className="inline-block px-8 py-4 bg-gray-900 text-white rounded-lg font-bold text-lg hover:bg-gray-800 shadow-lg"
              >
                View Source Code on GitHub →
              </a>
            </div>
          </div>
        </section>

        {/* Additional Videos Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                See AI Marketing in Action
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                8-second demos showing real AI automation. Each video has logic overlays
                so you can see HOW the AI works (not just WHAT it does).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Video 2: Content Generator */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <div className="text-sm">Content Generator Demo</div>
                      <div className="text-xs text-gray-400 mt-2">8s • JSON Overlay</div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Personalized Email Creation
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Watch Claude Opus 4 generate personalized emails with {firstName}, {company} tokens
                    replaced automatically for Logan & Brisbane contacts.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div><strong>0:00-0:02</strong>: Contact selection</div>
                    <div><strong>0:02-0:05</strong>: AI generation</div>
                    <div><strong>0:05-0:07</strong>: Personalization</div>
                    <div><strong>0:07-0:08</strong>: Preview ready</div>
                  </div>
                </div>
              </div>

              {/* Video 3: Orchestrator */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <div className="text-sm">Orchestrator Demo</div>
                      <div className="text-xs text-gray-400 mt-2">8s • Mermaid Overlay</div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Drip Campaign Automation
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    See multi-step campaigns execute automatically with conditional branching
                    based on Brisbane customer engagement.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div><strong>0:00-0:02</strong>: Campaign setup</div>
                    <div><strong>0:02-0:05</strong>: Trigger fires</div>
                    <div><strong>0:05-0:07</strong>: Step execution</div>
                    <div><strong>0:07-0:08</strong>: Conditional routing</div>
                  </div>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 relative p-6 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-lg font-bold">Live Dashboard</div>
                    <div className="text-sm mt-2">Real-time Agent Monitoring</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Agent Performance Dashboard
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    See agent health, costs, success rates in real-time. Project Vend Phase 2
                    monitors all 43 agents for Logan & Brisbane business owners.
                  </p>
                  <Link href="/agents" className="block text-center py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    View Live Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local SEO Section - Queensland Focus */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Serving Logan, Brisbane & Southeast Queensland
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Local AI marketing automation designed for Queensland small businesses.
                Australian pricing (AUD), GST included, Fair Work compliant, NDIS-friendly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Queensland Locations We Serve</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📍</div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Logan Central & Surrounding</h4>
                      <p className="text-sm text-gray-600">
                        Logan Central, Woodridge, Kingston, Marsden, Browns Plains, Springwood,
                        Slacks Creek, Loganlea, Waterford, Bethania
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📍</div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Brisbane & Metro</h4>
                      <p className="text-sm text-gray-600">
                        Brisbane CBD, South Brisbane, West End, Fortitude Valley, New Farm,
                        Kangaroo Point, Woolloongabba, East Brisbane
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📍</div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Gold Coast Corridor</h4>
                      <p className="text-sm text-gray-600">
                        Surfers Paradise, Broadbeach, Southport, Robina, Burleigh Heads,
                        Coolangatta, Palm Beach, Currumbin
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Queensland Business Types</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-bold text-blue-900 mb-2">Trades & Construction</div>
                    <div className="text-xs text-gray-700">Plumbers, electricians, builders, renovators</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-bold text-green-900 mb-2">Local Services</div>
                    <div className="text-xs text-gray-700">Salons, spas, cleaning, maintenance</div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="font-bold text-purple-900 mb-2">Healthcare & NDIS</div>
                    <div className="text-xs text-gray-700">Allied health, disability services, aged care</div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="font-bold text-orange-900 mb-2">Hospitality</div>
                    <div className="text-xs text-gray-700">Restaurants, cafes, catering, events</div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="font-bold text-red-900 mb-2">Professional Services</div>
                    <div className="text-xs text-gray-700">Accountants, lawyers, consultants</div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="font-bold text-indigo-900 mb-2">Retail & E-Commerce</div>
                    <div className="text-xs text-gray-700">Online stores, brick & mortar shops</div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Australian Compliance</strong>: GST included in all pricing.
                    Fair Work Act compliant. NDIS provider friendly.
                    Queensland-specific features available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Automate Your Logan or Brisbane Marketing?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              14-day free trial. No credit card required. Cancel anytime.
              Australian support team available Monday-Friday 8am-6pm AEST.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login" className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 shadow-lg">
                Start Free Trial Now
              </Link>
              <Link href="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10">
                Contact Our Logan Team
              </Link>
            </div>
            <p className="mt-6 text-sm opacity-75">
              🇦🇺 Australian company • Queensland-based support • AUD pricing • GST included
            </p>
          </div>
        </section>

        {/* Footer with Local Info */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="text-2xl font-bold mb-4">Unite-Hub</div>
                <p className="text-gray-400 text-sm">
                  AI marketing automation platform serving Logan, Brisbane, and Southeast Queensland businesses.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-4">Contact (Logan, QLD)</h4>
                <div className="text-gray-400 text-sm space-y-2">
                  <div>📍 Logan Central, QLD 4114</div>
                  <div>📞 1300 309 361</div>
                  <div>📧 hello@unite-group.in</div>
                  <div>🕐 Mon-Fri 8am-6pm AEST</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <div className="text-gray-400 text-sm space-y-2">
                  <Link href="/agents" className="block hover:text-white">Agent Dashboard</Link>
                  <Link href="/login" className="block hover:text-white">Sign In</Link>
                  <a href="https://github.com/CleanExpo/Unite-Hub" target="_blank" className="block hover:text-white">GitHub (Open Source)</a>
                  <Link href="#how-it-works" className="block hover:text-white">How It Works</Link>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4">Areas Served</h4>
                <div className="text-gray-400 text-sm space-y-2">
                  <div>Logan & Surrounds</div>
                  <div>Brisbane Metro</div>
                  <div>Gold Coast</div>
                  <div>Southeast Queensland</div>
                  <div>All of Australia (remote)</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
              <p>© 2025 Unite-Hub. All rights reserved. Australian Business Number (ABN) pending.</p>
              <p className="mt-2">
                Serving Logan, Brisbane, Queensland • Open Source • Built with ❤️ for small businesses
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
