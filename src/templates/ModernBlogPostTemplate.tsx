/**
 * Modern Blog Post Template
 * Unite Group - Reusable blog post components
 */

import React from 'react';

// Blog post metadata interface
export interface BlogPostMeta {
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    social?: {
      linkedin?: string;
      twitter?: string;
    };
  };
  publishDate: string;
  readingTime: number;
  category: string;
  tags: string[];
  featuredImage: {
    url: string;
    alt: string;
    caption?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
  };
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
  };
  jsonLd: {
    type: string;
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    image: string[];
  };
}

// Callout component for highlighting important information
export const Callout: React.FC<{
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  children: React.ReactNode;
}> = ({ type, title, children }) => {
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
  };

  return (
    <div className={`border-l-4 p-6 my-8 ${typeStyles[type]}`}>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
};

// Code block component for displaying code snippets
export const CodeBlock: React.FC<{
  language: string;
  title?: string;
  children: React.ReactNode;
}> = ({ language, title, children }) => {
  return (
    <div className="my-8">
      {title && (
        <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium rounded-t-lg">
          {title}
        </div>
      )}
      <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${title ? 'rounded-b-lg' : 'rounded-lg'}`}>
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
};

// Chart component placeholder (would integrate with Chart.js or similar)
export const BlogChart: React.FC<{
  type: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  data: any;
  options?: any;
}> = ({ type, title, description, data, options }) => {
  return (
    <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {description && <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>}
      <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-gray-500 dark:text-gray-400">Chart: {type} - {title}</p>
      </div>
    </div>
  );
};

// Main blog post template component
const ModernBlogPostTemplate: React.FC<{
  meta: BlogPostMeta;
  children: React.ReactNode;
  relatedPosts?: Array<{
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    readingTime: number;
  }>;
}> = ({ meta, children, relatedPosts }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg dark:prose-invert max-w-none">
        {/* Article Header */}
        <header className="mb-12">
          <div className="mb-4">
            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              {meta.category}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {meta.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {meta.description}
          </p>

          {/* Featured Image */}
          <div className="mb-8">
            <img
              src={meta.featuredImage.url}
              alt={meta.featuredImage.alt}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
            {meta.featuredImage.caption && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                {meta.featuredImage.caption}
              </p>
            )}
          </div>

          {/* Author and Meta Info */}
          <div className="flex items-center space-x-4 py-6 border-t border-b border-gray-200 dark:border-gray-700">
            <img
              src={meta.author.avatar}
              alt={meta.author.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {meta.author.name}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <time dateTime={meta.publishDate}>
                  {new Date(meta.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span>•</span>
                <span>{meta.readingTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="mb-12">
          {children}
        </div>

        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <img
              src={meta.author.avatar}
              alt={meta.author.name}
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{meta.author.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{meta.author.bio}</p>
              {meta.author.social && (
                <div className="flex space-x-4">
                  {meta.author.social.linkedin && (
                    <a
                      href={meta.author.social.linkedin}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  )}
                  {meta.author.social.twitter && (
                    <a
                      href={`https://twitter.com/${meta.author.social.twitter}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((post, index) => (
                <article key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2">
                      <a href={post.slug} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {post.title}
                      </a>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {post.readingTime} min read
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default ModernBlogPostTemplate;