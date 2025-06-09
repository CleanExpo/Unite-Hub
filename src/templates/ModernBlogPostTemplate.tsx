/**
 * Modern Blog Post Template
 * 
 * A comprehensive, SEO-optimized blog post template with:
 * - Responsive design (TailwindCSS)
 * - Advanced SEO (Meta tags, Open Graph, JSON-LD)
 * - LLM SEO optimization
 * - Rich content features (charts, images, callouts, code blocks)
 * - Modern typography and layout
 */

'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Share2, 
  BookOpen,
  Eye,
  Heart,
  MessageCircle,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface BlogPostMeta {
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    social: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  publishDate: string;
  updatedDate?: string;
  readingTime: number;
  category: string;
  tags: string[];
  featuredImage: {
    url: string;
    alt: string;
    caption?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    canonicalUrl?: string;
  };
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type: 'article' | 'website';
  };
  jsonLd: {
    type: 'BlogPosting' | 'Article';
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image: string[];
  };
}

interface CalloutProps {
  type: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
  children: React.ReactNode;
}

interface CodeBlockProps {
  language: string;
  children: string;
  title?: string;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie';
  data: any;
  options?: any;
  title?: string;
  description?: string;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const Callout: React.FC<CalloutProps> = ({ type, title, children }) => {
  const iconMap = {
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    tip: <Lightbulb className="h-5 w-5" />
  };

  const styleMap = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    tip: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 my-6 ${styleMap[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {iconMap[type]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-2">{title}</h4>
          )}
          <div className="text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-800">
      {title && (
        <div className="px-4 py-2 bg-gray-800 dark:bg-gray-700 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">{title}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">{language}</span>
          </div>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-300" />
          )}
        </button>
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="text-gray-100 font-mono leading-relaxed">
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

const BlogChart: React.FC<ChartData> = ({ type, data, options, title, description }) => {
  const ChartComponent = type === 'line' ? Line : type === 'bar' ? Bar : Pie;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      ...options?.plugins
    },
    ...options
  };

  return (
    <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {description}
        </p>
      )}
      <div className="h-64 md:h-80">
        <ChartComponent data={data} options={defaultOptions} />
      </div>
    </div>
  );
};

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

// ============================================================================
// SEO COMPONENTS
// ============================================================================

const BlogSEO: React.FC<{ meta: BlogPostMeta }> = ({ meta }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": meta.jsonLd.type,
    "headline": meta.jsonLd.headline,
    "description": meta.jsonLd.description,
    "image": meta.jsonLd.image,
    "author": {
      "@type": "Person",
      "name": meta.jsonLd.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Your Blog Name"
    },
    "datePublished": meta.jsonLd.datePublished,
    "dateModified": meta.jsonLd.dateModified || meta.jsonLd.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": typeof window !== 'undefined' ? window.location.href : ''
    }
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{meta.seo.metaTitle || meta.title}</title>
      <meta name="description" content={meta.seo.metaDescription || meta.description} />
      <meta name="keywords" content={meta.seo.keywords.join(', ')} />
      <meta name="author" content={meta.author.name} />
      <meta name="robots" content="index, follow" />
      
      {/* Canonical URL */}
      {meta.seo.canonicalUrl && (
        <link rel="canonical" href={meta.seo.canonicalUrl} />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={meta.openGraph.type} />
      <meta property="og:title" content={meta.openGraph.title || meta.title} />
      <meta property="og:description" content={meta.openGraph.description || meta.description} />
      <meta property="og:image" content={meta.openGraph.image || meta.featuredImage.url} />
      <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
      <meta property="og:site_name" content="Your Blog Name" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.openGraph.title || meta.title} />
      <meta name="twitter:description" content={meta.openGraph.description || meta.description} />
      <meta name="twitter:image" content={meta.openGraph.image || meta.featuredImage.url} />
      {meta.author.social?.twitter && (
        <meta name="twitter:creator" content={`@${meta.author.social.twitter}`} />
      )}

      {/* Article-specific meta */}
      <meta property="article:published_time" content={meta.publishDate} />
      {meta.updatedDate && (
        <meta property="article:modified_time" content={meta.updatedDate} />
      )}
      <meta property="article:author" content={meta.author.name} />
      <meta property="article:section" content={meta.category} />
      {meta.tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
};

// ============================================================================
// MAIN TEMPLATE COMPONENT
// ============================================================================

interface ModernBlogPostTemplateProps {
  meta: BlogPostMeta;
  content: React.ReactNode;
  charts?: ChartData[];
  relatedPosts?: {
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    readingTime: number;
  }[];
}

const ModernBlogPostTemplate: React.FC<ModernBlogPostTemplateProps> = ({
  meta,
  content,
  charts = [],
  relatedPosts = []
}) => {
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Simulate loading engagement data
    setViews(Math.floor(Math.random() * 1000) + 100);
    setLikes(Math.floor(Math.random() * 50) + 10);
  }, []);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meta.title,
          text: meta.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <BlogSEO meta={meta} />
      
      <article className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <header className="relative">
          <div className="aspect-w-16 aspect-h-9 lg:aspect-h-6">
            <Image
              src={meta.featuredImage.url}
              alt={meta.featuredImage.alt}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    {meta.category}
                  </span>
                  {meta.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {meta.title}
                </h1>
                
                <p className="text-xl text-gray-200 mb-6 max-w-3xl leading-relaxed">
                  {meta.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>{meta.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <time dateTime={meta.publishDate}>
                      {new Date(meta.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{meta.readingTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Content Body */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {content}
          </div>

          {/* Charts Section */}
          {charts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Data & Analytics
              </h2>
              {charts.map((chart, index) => (
                <BlogChart key={index} {...chart} />
              ))}
            </section>
          )}

          {/* Engagement Actions */}
          <div className="flex items-center justify-between py-8 border-t border-gray-200 dark:border-gray-700 mt-12">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <MessageCircle className="h-5 w-5" />
              <span>Join the discussion</span>
            </div>
          </div>

          {/* Author Bio */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 mt-12">
            <div className="flex items-start gap-6">
              <Image
                src={meta.author.avatar}
                alt={meta.author.name}
                width={80}
                height={80}
                className="rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  About {meta.author.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {meta.author.bio}
                </p>
                <div className="flex gap-4">
                  {meta.author.social?.twitter && (
                    <a
                      href={`https://twitter.com/${meta.author.social.twitter}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  )}
                  {meta.author.social?.linkedin && (
                    <a
                      href={meta.author.social.linkedin}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  )}
                  {meta.author.social?.github && (
                    <a
                      href={`https://github.com/${meta.author.social.github}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Related Articles
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((post, index) => (
                  <article
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-w-16 aspect-h-9">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {post.readingTime} min read
                        </span>
                        <a
                          href={post.slug}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        <ScrollToTop />
      </article>
    </>
  );
};

// ============================================================================
// EXPORT & UTILITY FUNCTIONS
// ============================================================================

export default ModernBlogPostTemplate;

// Export utility components for use in blog content
export { Callout, CodeBlock, BlogChart };

// Example usage function
export const createBlogPost = (
  meta: BlogPostMeta,
  contentJSX: React.ReactNode,
  charts?: ChartData[],
  relatedPosts?: any[]
) => {
  return (
    <ModernBlogPostTemplate
      meta={meta}
      content={contentJSX}
      charts={charts}
      relatedPosts={relatedPosts}
    />
  );
};

// LLM SEO Optimization helpers
export const optimizeContentForSEO = (content: string, targetKeywords: string[]) => {
  // LLM-powered SEO optimization suggestions
  const suggestions = {
    keywordDensity: targetKeywords.map(keyword => ({
      keyword,
      density: (content.toLowerCase().split(keyword.toLowerCase()).length - 1) / content.split(' ').length * 100,
      optimal: 1.5 // Target 1.5% density
    })),
    readabilityScore: calculateReadabilityScore(content),
    headingStructure: analyzeHeadingStructure(content),
    recommendations: generateSEORecommendations(content, targetKeywords)
  };

  return suggestions;
};

const calculateReadabilityScore = (content: string): number => {
  // Simplified Flesch Reading Ease calculation
  const sentences = content.split(/[.!?]+/).length - 1;
  const words = content.split(/\s+/).length;
  const syllables = content.split(/[aeiouAEIOU]/).length - 1;
  
  const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  return Math.max(0, Math.min(100, score));
};

const analyzeHeadingStructure = (content: string) => {
  const headings: string[] = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  return {
    total: headings.length,
    distribution: headings.reduce((acc: Record<string, number>, heading: string) => {
      const level = heading.match(/<h([1-6])/)?.[1] || '1';
      acc[`h${level}`] = (acc[`h${level}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recommendations: headings.length < 3 ? ['Add more subheadings for better structure'] : []
  };
};

const generateSEORecommendations = (content: string, keywords: string[]): string[] => {
  const recommendations: string[] = [];
  
  if (content.length < 1000) {
    recommendations.push('Consider expanding content to at least 1000 words for better SEO');
  }
  
  if (!content.toLowerCase().includes('table of contents')) {
    recommendations.push('Add a table of contents for longer articles');
  }
  
  keywords.forEach(keyword => {
    if (!content.toLowerCase().includes(keyword.toLowerCase())) {
      recommendations.push(`Consider including the keyword "${keyword}" in your content`);
    }
  });
  
  return recommendations;
};
