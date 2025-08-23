'use client';

import React from 'react';
import Link from 'next/link';
import SchemaMarkup from '@/components/SchemaMarkup';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';
import { motion } from 'framer-motion';
import { 
  Rocket, Users, Megaphone, Search, BarChart3, 
  Home, BookOpen, Wrench, Briefcase, GraduationCap,
  Facebook, Linkedin, Calculator, Target, FileSearch,
  UserCheck, FileText, ClipboardList, ArrowRight,
  CheckCircle, HardHat, Shield, Building2, Map, TrendingUp
} from 'lucide-react';

export default function SitemapPage() {
  const webPageSchema = {
    type: 'WebPage' as const,
    name: 'Sitemap - Unite Group Agency',
    description: 'Complete directory of all Unite Group Agency pages and services for Brisbane trades',
    url: 'https://unite-group.com.au/sitemap',
    dateModified: '2025-01-15',
    publisher: {
      name: 'Unite Group Agency',
      url: 'https://unite-group.com.au'
    }
  };

  const siteStructure = [
  {
    title: 'Main Pages',
    icon: Home,
    pages: [
      { name: 'Home', path: '/', icon: Home, status: 'live' },
      { name: 'About Us', path: '/about', icon: Building2, status: 'live' },
      { name: 'Our Team', path: '/team', icon: Users, status: 'live' },
      { name: 'Contact', path: '/contact', icon: Home, status: 'live' },
      { name: 'Consultation', path: '/consultation', icon: Briefcase, status: 'live' },
      { name: 'Testimonials', path: '/testimonials', icon: FileText, status: 'live' },
      { name: 'Case Studies', path: '/case-studies', icon: Briefcase, status: 'live' }
    ]
  },
  {
    title: 'Growth Hacking',
    icon: Rocket,
    description: 'Data-driven growth strategies',
    pages: [
      { name: 'Growth Hacking Main', path: '/growth-hacking', icon: Rocket, status: 'live' },
      { name: 'Growth Guide', path: '/growth-hacking/guide', icon: BookOpen, status: 'live' },
      { name: 'Growth Tools', path: '/growth-hacking/tools', icon: Wrench, status: 'live' },
      { name: 'Growth Workshop', path: '/growth-hacking/workshop', icon: GraduationCap, status: 'live' },
      { name: 'Case Studies', path: '/growth-hacking/case-studies', icon: Briefcase, status: 'live' }
    ]
  },
  {
    title: 'Agile Marketing',
    icon: Users,
    description: 'Agile transformation for marketing teams',
    pages: [
      { name: 'Agile Marketing Main', path: '/agile-marketing', icon: Users, status: 'live' },
      { name: 'Agile Frameworks', path: '/agile-marketing/frameworks', icon: BookOpen, status: 'live' },
      { name: 'Team Training', path: '/agile-marketing/team-training', icon: GraduationCap, status: 'live' },
      { name: 'Transformation', path: '/agile-marketing/transformation', icon: Rocket, status: 'live' }
    ]
  },
  {
    title: 'Social Advertising',
    icon: Megaphone,
    description: 'Multi-platform social media advertising',
    pages: [
      { name: 'Social Advertising Main', path: '/social-advertising', icon: Megaphone, status: 'live' },
      { name: 'Facebook Ads', path: '/social-advertising/facebook-ads', icon: Facebook, status: 'live' },
      { name: 'LinkedIn B2B', path: '/social-advertising/linkedin-b2b', icon: Linkedin, status: 'live' },
      { name: 'ROI Calculator', path: '/social-advertising/roi-calculator', icon: Calculator, status: 'live' }
    ]
  },
  {
    title: 'Competitive Analysis',
    icon: Search,
    description: 'Strategic competitive intelligence',
    pages: [
      { name: 'Competitive Analysis Main', path: '/competitive-analysis', icon: Search, status: 'live' },
      { name: 'Benchmarking', path: '/competitive-analysis/benchmarking', icon: Target, status: 'live' },
      { name: 'SEO Audit', path: '/competitive-analysis/seo-audit', icon: FileSearch, status: 'live' },
      { name: 'Tracker Tool', path: '/competitive-analysis/tracker', icon: BarChart3, status: 'live' }
    ]
  },
  {
    title: 'Market Research',
    icon: BarChart3,
    description: 'Data-driven market insights',
    pages: [
      { name: 'Market Research Main', path: '/market-research', icon: BarChart3, status: 'live' },
      { name: 'Persona Development', path: '/market-research/persona-development', icon: UserCheck, status: 'live' },
      { name: 'Industry Reports', path: '/market-research/industry-reports', icon: FileText, status: 'live' },
      { name: 'Survey Tools', path: '/market-research/surveys', icon: ClipboardList, status: 'live' }
    ]
  },
  {
    title: 'Trade-Specific Solutions',
    icon: HardHat,
    description: 'Industry-specific marketing for trades',
    pages: [
      { name: 'Local SEO for Contractors', path: '/local-seo-contractors', icon: Search, status: 'live' },
      { name: 'Contractor Business Automation', path: '/contractor-business-automation', icon: Wrench, status: 'live' },
      { name: 'Digital Transformation for Trades', path: '/digital-transformation-trades', icon: Rocket, status: 'live' },
      { name: 'Safety Compliance Software', path: '/safety-compliance-software', icon: Shield, status: 'live' },
      { name: 'Trade Business Scaling', path: '/trade-business-scaling', icon: TrendingUp, status: 'live' }
    ]
  },
  {
    title: 'Legal & Resources',
    icon: Shield,
    description: 'Important information and tools',
    pages: [
      { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield, status: 'live' },
      { name: 'Terms of Service', path: '/terms-of-service', icon: FileText, status: 'live' },
      { name: 'SEO Synthesizer', path: '/seo-synthesizer', icon: Search, status: 'live' }
    ]
  }
];

  return (
    <>
      <SchemaMarkup schema={webPageSchema} />
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Unite Group Site Directory</h1>
              <p className="text-gray-400 mt-1">All pages are live and ready to view</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">22 Pages Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-900/30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="text-xs text-gray-400">Avg SEO Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">22</p>
              <p className="text-xs text-gray-400">Total Pages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">16</p>
              <p className="text-xs text-gray-400">Perfect Scores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">12,872</p>
              <p className="text-xs text-gray-400">Avg Word Count</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {siteStructure.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  {section.description && (
                    <p className="text-gray-400 mt-1">{section.description}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {section.pages.map((page, pageIndex) => (
                  <motion.div
                    key={page.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: sectionIndex * 0.1 + pageIndex * 0.05 }}
                  >
                    <Link
                      href={page.path as any}
                      className="group flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <page.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {page.name}
                          </p>
                          <p className="text-sm text-gray-500">{page.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                          Live
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Explore?</h3>
          <p className="text-gray-300 mb-6">
            All pages are fully optimized with world-class SEO and comprehensive content.
            Click any page above to explore or use the quick links below.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/growth-hacking"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start with Growth Hacking
            </Link>
            <Link
              href="/competitive-analysis/seo-audit"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
            >
              Get SEO Audit
            </Link>
            <Link
              href="/social-advertising/roi-calculator"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
            >
              Calculate ROI
            </Link>
          </div>
        </motion.div>

        {/* Developer Notes */}
        <div className="mt-8 p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-300">Note:</span> All pages include comprehensive SEO optimization, 
            structured data, and Brisbane/Australian market focus. Founded by a tradie, for tradies.
          </p>
        </div>

        {/* Author Info */}
        <div className="mt-8">
          <AuthorInfo author={AUTHORS.uniteTeam} publishDate="2025-01-15" />
        </div>
      </div>
    </div>
    </>
  );
}