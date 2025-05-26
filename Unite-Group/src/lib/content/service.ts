/**
 * Content Management Service
 * Provides methods for loading, saving, and managing content
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import matter from 'gray-matter';
import { nanoid } from 'nanoid';
import { 
  BaseContent, 
  Content, 
  BlogPost, 
  CaseStudy, 
  KnowledgeBaseArticle,
  Resource,
  Testimonial,
  ContentType,
  ContentStatus 
} from './types';
import { 
  parseMarkdown, 
  calculateReadingTime, 
  extractMarkdownExcerpt 
} from './markdown';

// Promisify file system operations
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

/**
 * Content storage configuration
 */
interface ContentConfig {
  contentDir: string;
  assetsDir: string;
}

/**
 * Default configuration
 */
const defaultConfig: ContentConfig = {
  contentDir: path.join(process.cwd(), 'content'),
  assetsDir: path.join(process.cwd(), 'public', 'assets'),
};

/**
 * Content service for managing CMS content
 */
export class ContentService {
  private config: ContentConfig;
  
  constructor(config: Partial<ContentConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Initialize content directories
   */
  public async initialize(): Promise<void> {
    // Create content directory if it doesn't exist
    if (!fs.existsSync(this.config.contentDir)) {
      await mkdir(this.config.contentDir, { recursive: true });
    }
    
    // Create content type directories
    const contentTypes: ContentType[] = ['blog', 'case-study', 'knowledge-base', 'resource', 'testimonial'];
    
    for (const type of contentTypes) {
      const dir = path.join(this.config.contentDir, type);
      if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
    
    // Create assets directory if it doesn't exist
    if (!fs.existsSync(this.config.assetsDir)) {
      await mkdir(this.config.assetsDir, { recursive: true });
    }
  }
  
  /**
   * Get content of a specific type
   * @param type Content type
   * @param options Filter options
   * @returns Array of content items
   */
  public async getContent<T extends Content>(
    type: ContentType,
    options: {
      status?: ContentStatus;
      limit?: number;
      offset?: number;
      sortBy?: keyof BaseContent;
      sortDirection?: 'asc' | 'desc';
      tag?: string;
    } = {}
  ): Promise<T[]> {
    const {
      status,
      limit,
      offset = 0,
      sortBy = 'publishedAt',
      sortDirection = 'desc',
      tag,
    } = options;
    
    const contentDir = path.join(this.config.contentDir, type);
    
    // Read directory
    let files: string[];
    try {
      files = await readDir(contentDir);
    } catch (err) {
      console.error(`Error reading directory: ${contentDir}`, err);
      return [];
    }
    
    // Filter for markdown files
    files = files.filter(file => file.endsWith('.md'));
    
    // Load content files
    const contentItems: T[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(contentDir, file);
        const content = await this.getContentItem<T>(type, path.parse(file).name);
        
        // Apply filters
        if (status && content.status !== status) {
          continue;
        }
        
        if (tag && !content.tags.includes(tag)) {
          continue;
        }
        
        contentItems.push(content);
      } catch (err) {
        console.error(`Error loading content file: ${file}`, err);
      }
    }
    
    // Sort content
    contentItems.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply pagination
    if (limit) {
      return contentItems.slice(offset, offset + limit) as T[];
    }
    
    return contentItems as T[];
  }
  
  /**
   * Get a specific content item
   * @param type Content type
   * @param slug Content slug
   * @returns Content item
   */
  public async getContentItem<T extends Content>(
    type: ContentType,
    slug: string
  ): Promise<T> {
    const filePath = path.join(this.config.contentDir, type, `${slug}.md`);
    
    // Read file
    let fileContent: string;
    try {
      fileContent = await readFile(filePath, 'utf-8');
    } catch (err) {
      throw new Error(`Content not found: ${type}/${slug}`);
    }
    
    // Parse frontmatter
    const { data, content } = matter(fileContent);
    
    // Parse HTML content
    const htmlContent = await parseMarkdown(content);
    
    // Prepare base content
    const baseContent: BaseContent = {
      id: data.id || slug,
      slug,
      title: data.title || '',
      description: data.description || '',
      content: htmlContent,
      status: data.status || 'draft',
      visibility: data.visibility || 'public',
      type: type,
      author: data.author || 'Unknown',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      publishedAt: data.publishedAt || undefined,
      featuredImage: data.featuredImage || undefined,
      seoTitle: data.seoTitle || data.title || '',
      seoDescription: data.seoDescription || data.description || '',
      tags: data.tags || [],
      metadata: data.metadata || {},
    };
    
    // Create specific content type
    let contentItem: Content;
    
    switch (type) {
      case 'blog':
        const blogPost: BlogPost = {
          ...baseContent,
          type: 'blog',
          category: data.category || 'Uncategorized',
          readingTime: data.readingTime || calculateReadingTime(content),
          relatedPosts: data.relatedPosts || undefined,
          excerpt: data.excerpt || await extractMarkdownExcerpt(content),
          isFeature: data.isFeature || false,
        };
        contentItem = blogPost;
        break;
        
      case 'case-study':
        const caseStudy: CaseStudy = {
          ...baseContent,
          type: 'case-study',
          client: data.client || '',
          industry: data.industry || '',
          services: data.services || [],
          challenge: data.challenge || '',
          solution: data.solution || '',
          results: data.results || '',
          testimonial: data.testimonial || undefined,
          duration: data.duration || '',
          galleryImages: data.galleryImages || undefined,
        };
        contentItem = caseStudy;
        break;
        
      case 'knowledge-base':
        const knowledgeBaseArticle: KnowledgeBaseArticle = {
          ...baseContent,
          type: 'knowledge-base',
          category: data.category || 'General',
          difficulty: data.difficulty || 'beginner',
          relatedArticles: data.relatedArticles || undefined,
          lastReviewed: data.lastReviewed || undefined,
          reviewSchedule: data.reviewSchedule || undefined,
          contributors: data.contributors || undefined,
        };
        contentItem = knowledgeBaseArticle;
        break;
        
      case 'resource':
        const resource: Resource = {
          ...baseContent,
          type: 'resource',
          resourceType: data.resourceType || 'other',
          fileUrl: data.fileUrl || undefined,
          externalUrl: data.externalUrl || undefined,
          downloadRequired: data.downloadRequired || false,
          fileSize: data.fileSize || undefined,
          duration: data.duration || undefined,
          format: data.format || undefined,
          category: data.category || 'General',
        };
        contentItem = resource;
        break;
        
      case 'testimonial':
        const testimonial: Testimonial = {
          ...baseContent,
          type: 'testimonial',
          clientName: data.clientName || '',
          clientTitle: data.clientTitle || undefined,
          clientCompany: data.clientCompany || undefined,
          clientAvatar: data.clientAvatar || undefined,
          rating: data.rating || undefined,
          project: data.project || undefined,
          featured: data.featured || false,
          verification: data.verification || undefined,
        };
        contentItem = testimonial;
        break;
        
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
    
    return contentItem as T;
  }
  
  /**
   * Save a content item
   * @param content Content item to save
   * @returns Saved content item
   */
  public async saveContent<T extends Content>(content: T): Promise<T> {
    // Ensure content has an ID and slug
    if (!content.id) {
      content.id = nanoid();
    }
    
    if (!content.slug) {
      content.slug = this.slugify(content.title);
    }
    
    // Update timestamps
    content.updatedAt = new Date().toISOString();
    
    if (content.status === 'published' && !content.publishedAt) {
      content.publishedAt = new Date().toISOString();
    }
    
    // Prepare directory
    const contentDir = path.join(this.config.contentDir, content.type);
    if (!fs.existsSync(contentDir)) {
      await mkdir(contentDir, { recursive: true });
    }
    
    // Prepare frontmatter
    const frontmatterData: Record<string, any> = { ...content };
    
    // Remove HTML content, as it will be stored as markdown
    delete frontmatterData.content;
    
    // Extract markdown content (assuming HTML content was converted from markdown)
    // In a real implementation, you would need to convert HTML back to markdown or store original markdown
    const markdownContent = content.content;
    
    // Create frontmatter and content
    const fileContent = matter.stringify(markdownContent, frontmatterData);
    
    // Save file
    const filePath = path.join(contentDir, `${content.slug}.md`);
    await writeFile(filePath, fileContent, 'utf-8');
    
    return content;
  }
  
  /**
   * Delete a content item
   * @param type Content type
   * @param slug Content slug
   * @returns Whether the deletion was successful
   */
  public async deleteContent(
    type: ContentType,
    slug: string
  ): Promise<boolean> {
    const filePath = path.join(this.config.contentDir, type, `${slug}.md`);
    
    try {
      await promisify(fs.unlink)(filePath);
      return true;
    } catch (err) {
      console.error(`Error deleting content: ${filePath}`, err);
      return false;
    }
  }
  
  /**
   * Get content statistics
   * @returns Content statistics by type
   */
  public async getContentStats(): Promise<Record<ContentType, number>> {
    const contentTypes: ContentType[] = ['blog', 'case-study', 'knowledge-base', 'resource', 'testimonial'];
    
    const stats: Record<ContentType, number> = {
      blog: 0,
      'case-study': 0,
      'knowledge-base': 0,
      resource: 0,
      testimonial: 0,
    };
    
    for (const type of contentTypes) {
      const contentDir = path.join(this.config.contentDir, type);
      
      try {
        if (fs.existsSync(contentDir)) {
          const files = await readDir(contentDir);
          stats[type] = files.filter(file => file.endsWith('.md')).length;
        }
      } catch (err) {
        console.error(`Error reading directory: ${contentDir}`, err);
      }
    }
    
    return stats;
  }
  
  /**
   * Convert a string to a slug
   * @param text Text to convert
   * @returns Slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

// Export a singleton instance
export const contentService = new ContentService();
