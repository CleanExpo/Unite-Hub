/**
 * Content Management System Types
 * Defines the base types for the content management system
 */

export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'blog' | 'case-study' | 'knowledge-base' | 'resource' | 'testimonial';
export type ContentVisibility = 'public' | 'private' | 'members-only';

/**
 * Base content interface that all content types extend
 */
export interface BaseContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  type: ContentType;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * Blog post content type
 */
export interface BlogPost extends BaseContent {
  type: 'blog';
  category: string;
  readingTime: number; // in minutes
  relatedPosts?: string[]; // IDs of related posts
  excerpt: string;
  isFeature?: boolean;
}

/**
 * Case study content type
 */
export interface CaseStudy extends BaseContent {
  type: 'case-study';
  client: string;
  industry: string;
  services: string[];
  challenge: string;
  solution: string;
  results: string;
  testimonial?: string;
  duration: string;
  galleryImages?: string[];
}

/**
 * Knowledge base article content type
 */
export interface KnowledgeBaseArticle extends BaseContent {
  type: 'knowledge-base';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedArticles?: string[];
  lastReviewed?: string;
  reviewSchedule?: 'monthly' | 'quarterly' | 'annually';
  contributors?: string[];
}

/**
 * Resource content type (PDFs, videos, etc.)
 */
export interface Resource extends BaseContent {
  type: 'resource';
  resourceType: 'pdf' | 'video' | 'audio' | 'presentation' | 'template' | 'other';
  fileUrl?: string;
  externalUrl?: string;
  downloadRequired: boolean;
  fileSize?: number; // in bytes
  duration?: number; // in seconds (for video/audio)
  format?: string;
  category: string;
}

/**
 * Testimonial content type
 */
export interface Testimonial extends BaseContent {
  type: 'testimonial';
  clientName: string;
  clientTitle?: string;
  clientCompany?: string;
  clientAvatar?: string;
  rating?: number; // 1-5 star rating
  project?: string; // ID of related project or case study
  featured: boolean;
  verification?: 'verified' | 'unverified';
}

/**
 * Union type of all content types
 */
export type Content = 
  | BlogPost 
  | CaseStudy 
  | KnowledgeBaseArticle 
  | Resource 
  | Testimonial;
