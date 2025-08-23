'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, User, Calendar, Download, Share2, BookOpen } from 'lucide-react';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface RelatedPage {
  title: string;
  description: string;
  href: string;
  type: 'guide' | 'tool' | 'resource' | 'case-study';
}

interface SubPillarTemplateProps {
  // Page Meta
  title: string;
  subtitle?: string;
  description: string;
  author?: string;
  authorInfo?: ReactNode;
  publishDate?: string;
  readTime?: string;
  
  // Navigation
  breadcrumbs: BreadcrumbItem[];
  parentPage?: { name: string; href: string };
  
  // Content
  heroSection?: ReactNode;
  mainContent: ReactNode;
  sidebarContent?: ReactNode;
  
  // Related Content
  relatedPages?: RelatedPage[];
  
  // CTAs
  primaryCTA?: {
    text: string;
    href: string;
    icon?: ReactNode;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    icon?: ReactNode;
  };
  
  // Features
  showTableOfContents?: boolean;
  showSocialShare?: boolean;
  showDownloadButton?: boolean;
  downloadUrl?: string;
}

export default function SubPillarTemplate({
  title,
  subtitle,
  description,
  author,
  authorInfo,
  publishDate,
  readTime,
  breadcrumbs,
  parentPage,
  heroSection,
  mainContent,
  sidebarContent,
  relatedPages,
  primaryCTA,
  secondaryCTA,
  showTableOfContents = true,
  showSocialShare = true,
  showDownloadButton = false,
  downloadUrl
}: SubPillarTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Breadcrumbs */}
      <nav className="bg-slate-950/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-500 mx-2" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-400">{item.name}</span>
                ) : (
                  <Link href={item.href as any} className="text-purple-400 hover:text-purple-300 transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-cyan-900/20" />
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {parentPage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <Link
                href={parentPage.href as any}
                className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                ← Back to {parentPage.name}
              </Link>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-purple-300 mb-6"
            >
              {subtitle}
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-300 max-w-3xl mb-8"
          >
            {description}
          </motion.p>

          {/* Meta Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8"
          >
            {author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{author}</span>
              </div>
            )}
            {publishDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{publishDate}</span>
              </div>
            )}
            {readTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{readTime} read</span>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            {primaryCTA && (
              <Link
                href={primaryCTA.href as any}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                {primaryCTA.text}
                {primaryCTA.icon || <ArrowRight className="ml-2 w-5 h-5" />}
              </Link>
            )}
            
            {secondaryCTA && (
              <Link
                href={secondaryCTA.href as any}
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                {secondaryCTA.text}
                {secondaryCTA.icon}
              </Link>
            )}

            {showDownloadButton && downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                <Download className="mr-2 w-5 h-5" />
                Download Resource
              </a>
            )}

            {showSocialShare && (
              <button className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
                <Share2 className="mr-2 w-5 h-5" />
                Share
              </button>
            )}
          </motion.div>

          {heroSection}
        </div>
      </header>

      {/* Author Info Section */}
      {authorInfo && (
        <section className="bg-slate-900/30 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {authorInfo}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
              {mainContent}
            </div>
          </motion.main>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="lg:col-span-1"
          >
            {showTableOfContents && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 mb-6 sticky top-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {/* TOC items would be dynamically generated */}
                  <a href="#section-1" className="block text-gray-400 hover:text-purple-400 transition-colors py-1">
                    1. Introduction
                  </a>
                  <a href="#section-2" className="block text-gray-400 hover:text-purple-400 transition-colors py-1">
                    2. Key Concepts
                  </a>
                  <a href="#section-3" className="block text-gray-400 hover:text-purple-400 transition-colors py-1">
                    3. Implementation
                  </a>
                  <a href="#section-4" className="block text-gray-400 hover:text-purple-400 transition-colors py-1">
                    4. Best Practices
                  </a>
                </nav>
              </div>
            )}

            {sidebarContent}
          </motion.aside>
        </div>
      </div>

      {/* Related Content */}
      {relatedPages && relatedPages.length > 0 && (
        <section className="py-16 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPages.map((page, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link
                    href={page.href as any}
                    className="block bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        page.type === 'guide' ? 'bg-purple-500/20 text-purple-300' :
                        page.type === 'tool' ? 'bg-cyan-500/20 text-cyan-300' :
                        page.type === 'resource' ? 'bg-green-500/20 text-green-300' :
                        'bg-pink-500/20 text-pink-300'
                      }`}>
                        {page.type}
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{page.title}</h3>
                    <p className="text-gray-400">{page.description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}