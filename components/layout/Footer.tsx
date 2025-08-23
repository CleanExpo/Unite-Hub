'use client';

import Link from 'next/link';
import { ArrowUp, FileText, Calendar, Phone, Mail, MapPin } from 'lucide-react';

const footerNavigation = {
  services: [
    { name: 'Growth Hacking', href: '/growth-hacking' },
    { name: 'Agile Marketing', href: '/agile-marketing' },
    { name: 'Social Advertising', href: '/social-advertising' },
    { name: 'Competitive Analysis', href: '/competitive-analysis' },
    { name: 'Market Research', href: '/market-research' }
  ],
  tools: [
    { name: 'SEO Synthesizer', href: '/seo-synthesizer' },
    { name: 'Growth Calculator', href: '/growth-hacking/calculator' },
    { name: 'ROI Calculator', href: '/social-advertising/roi-calculator' },
    { name: 'SEO Audit', href: '/competitive-analysis/seo-audit' },
    { name: 'Competitor Tracker', href: '/competitive-analysis/tracker' },
    { name: 'Survey Tools', href: '/market-research/surveys' }
  ],
  resources: [
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'All Guides', href: '/resources/guides' },
    { name: 'Site Map', href: '/sitemap' },
    { name: 'All Pages', href: '/all-pages' }
  ],
  company: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Book Consultation', href: '/consultation' },
    { name: 'About Unite Group', href: '/about' }
  ]
};

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link href="/" className="text-2xl font-bold text-white">
                Unite Group Agency
              </Link>
              <p className="mt-4 text-gray-400 text-sm leading-6">
                Transform your business with data-driven growth strategies, agile marketing frameworks, 
                and comprehensive competitive analysis. Based in Brisbane, serving clients worldwide.
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Brisbane, Queensland, Australia
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-purple-400" />
                  contact@unite-group.com
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="w-4 h-4 text-purple-400" />
                  Available for consultation
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-white">Services</h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.services.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href as any}
                      className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h3 className="text-sm font-semibold text-white">Tools</h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.tools.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href as any}
                      className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources & Company */}
            <div>
              <h3 className="text-sm font-semibold text-white">Resources</h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href as any}
                      className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <h3 className="text-sm font-semibold text-white mt-8">Company</h3>
              <ul className="mt-4 space-y-3">
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href as any}
                      className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="border-t border-slate-800 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={"/consultation" as any}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              <Calendar className="w-4 h-4" />
              Book Free Consultation
            </Link>
            <Link
              href={"/case-studies" as any}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <FileText className="w-4 h-4" />
              View Case Studies
            </Link>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-gray-300 font-semibold rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-300"
            >
              <ArrowUp className="w-4 h-4" />
              Back to Top
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400">
              © 2025 Unite Group Agency. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href={"/privacy" as any} className="text-xs text-gray-400 hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href={"/terms" as any} className="text-xs text-gray-400 hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
              <Link href={"/sitemap" as any} className="text-xs text-gray-400 hover:text-purple-400 transition-colors">
                Site Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}