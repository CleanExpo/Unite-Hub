// src/lib/content/page-loader.ts
// Loads page specifications from site architecture

import type { PageSpec, PageType } from './pipeline';

// ============================================
// SITE ARCHITECTURE INTERFACE
// ============================================

export interface SiteArchitecture {
  brands: {
    synthex: BrandConfig;
    unite_hub: BrandConfig;
  };
  site_architecture: {
    synthex: {
      landing_pages: LandingPageConfig[];
      pillar_pages: PillarPageConfig[];
      subpillar_pages: Record<string, SubpillarPageConfig[]>;
      service_pages: ServicePageConfig[];
      location_pages: LocationPageTemplate;
    };
  };
}

export interface BrandConfig {
  name: string;
  tagline: string;
  domain: string;
  primary_colour: string;
}

export interface LandingPageConfig {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  cta_primary: string;
  cta_secondary: string;
  sections: string[];
  schema_types: string[];
}

export interface PillarPageConfig {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  subpillar_pages: string[];
  schema_types: string[];
  internal_links_required: number;
  external_authority_links: number;
}

export interface SubpillarPageConfig {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  parent_pillar: string;
  schema_types: string[];
  faq_questions: string[];
  location_variants: string[];
}

export interface ServicePageConfig {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  word_count_target: number;
  schema_types: string[];
}

export interface LocationPageTemplate {
  template: {
    url_pattern: string;
    title_pattern: string;
    h1_pattern: string;
    meta_description_pattern: string;
    word_count_target: number;
    schema_types: string[];
  };
  priority_locations: Array<{
    city: string;
    suburbs: string[];
  }>;
}

// ============================================
// PAGE LOADER CLASS
// ============================================

export class PageLoader {
  private architecture: SiteArchitecture;
  private brand: 'synthex' | 'unite_hub';

  constructor(architecture: SiteArchitecture, brand: 'synthex' | 'unite_hub' = 'synthex') {
    this.architecture = architecture;
    this.brand = brand;
  }

  /**
   * Get the current brand
   */
  getBrand(): 'synthex' | 'unite_hub' {
    return this.brand;
  }

  /**
   * Get all landing page specs
   */
  getLandingPages(): PageSpec[] {
    const pages = this.architecture.site_architecture.synthex.landing_pages;
    return pages.map((p) => this.toLandingPageSpec(p));
  }

  /**
   * Get all pillar page specs
   */
  getPillarPages(): PageSpec[] {
    const pages = this.architecture.site_architecture.synthex.pillar_pages;
    return pages.map((p) => this.toPillarPageSpec(p));
  }

  /**
   * Get subpillar pages for a specific pillar
   */
  getSubpillarPages(pillarId: string): PageSpec[] {
    const pages = this.architecture.site_architecture.synthex.subpillar_pages[pillarId] || [];
    return pages.map((p) => this.toSubpillarPageSpec(p));
  }

  /**
   * Get all subpillar pages across all pillars
   */
  getAllSubpillarPages(): PageSpec[] {
    const allPages: PageSpec[] = [];
    const subpillars = this.architecture.site_architecture.synthex.subpillar_pages;

    for (const pillarId of Object.keys(subpillars)) {
      allPages.push(...this.getSubpillarPages(pillarId));
    }

    return allPages;
  }

  /**
   * Get all service page specs
   */
  getServicePages(): PageSpec[] {
    const pages = this.architecture.site_architecture.synthex.service_pages;
    return pages.map((p) => this.toServicePageSpec(p));
  }

  /**
   * Generate location page specs from template
   */
  getLocationPages(industry: string, locations?: string[]): PageSpec[] {
    const template = this.architecture.site_architecture.synthex.location_pages;
    const specs: PageSpec[] = [];

    const targetLocations = locations || template.priority_locations.map((l) => l.city);

    for (const location of targetLocations) {
      specs.push(this.toLocationPageSpec(template.template, industry, location));
    }

    return specs;
  }

  /**
   * Get a specific page by ID
   */
  getPageById(pageId: string): PageSpec | null {
    // Check landing pages
    const landing = this.architecture.site_architecture.synthex.landing_pages.find((p) => p.id === pageId);
    if (landing) {
      return this.toLandingPageSpec(landing);
    }

    // Check pillar pages
    const pillar = this.architecture.site_architecture.synthex.pillar_pages.find((p) => p.id === pageId);
    if (pillar) {
      return this.toPillarPageSpec(pillar);
    }

    // Check subpillar pages
    for (const pillarId of Object.keys(this.architecture.site_architecture.synthex.subpillar_pages)) {
      const subpillar = this.architecture.site_architecture.synthex.subpillar_pages[pillarId].find(
        (p) => p.id === pageId
      );
      if (subpillar) {
        return this.toSubpillarPageSpec(subpillar);
      }
    }

    // Check service pages
    const service = this.architecture.site_architecture.synthex.service_pages.find((p) => p.id === pageId);
    if (service) {
      return this.toServicePageSpec(service);
    }

    return null;
  }

  /**
   * Get all pages (flat list)
   */
  getAllPages(): PageSpec[] {
    return [
      ...this.getLandingPages(),
      ...this.getPillarPages(),
      ...this.getAllSubpillarPages(),
      ...this.getServicePages(),
    ];
  }

  /**
   * Get pages by type
   */
  getPagesByType(type: PageType): PageSpec[] {
    switch (type) {
      case 'landing':
        return this.getLandingPages();
      case 'pillar':
        return this.getPillarPages();
      case 'subpillar':
        return this.getAllSubpillarPages();
      case 'service':
        return this.getServicePages();
      default:
        return [];
    }
  }

  /**
   * Get content generation priority order
   */
  getPriorityOrder(): PageSpec[] {
    // Priority: landing > pillars > high-value subpillars > services > location pages
    const pages: PageSpec[] = [];

    // 1. Landing page first
    pages.push(...this.getLandingPages());

    // 2. Pillar pages
    pages.push(...this.getPillarPages());

    // 3. Subpillar pages (sorted by parent pillar priority)
    const pillarPriority = ['trades', 'professional-services', 'health-wellness', 'hospitality-retail'];
    for (const pillarId of pillarPriority) {
      pages.push(...this.getSubpillarPages(pillarId));
    }

    // 4. Service pages
    pages.push(...this.getServicePages());

    return pages;
  }

  // ============================================
  // CONVERSION HELPERS
  // ============================================

  private toLandingPageSpec(config: LandingPageConfig): PageSpec {
    return {
      id: config.id,
      url: config.url,
      type: 'landing',
      title: config.title,
      h1: config.h1,
      meta_description: config.meta_description,
      primary_keyword: config.primary_keyword,
      secondary_keywords: config.secondary_keywords,
      word_count_target: config.word_count_target,
      sections: config.sections,
      schema_types: config.schema_types,
    };
  }

  private toPillarPageSpec(config: PillarPageConfig): PageSpec {
    // Extract industry from URL
    const industry = config.url.replace('/', '').replace(/-/g, ' ');

    return {
      id: config.id,
      url: config.url,
      type: 'pillar',
      title: config.title,
      h1: config.h1,
      meta_description: config.meta_description,
      primary_keyword: config.primary_keyword,
      secondary_keywords: config.secondary_keywords,
      word_count_target: config.word_count_target,
      sections: ['hero', 'industry_intro', 'features', 'process', 'testimonials', 'faq', 'cta'],
      schema_types: config.schema_types,
      industry: industry,
    };
  }

  private toSubpillarPageSpec(config: SubpillarPageConfig): PageSpec {
    return {
      id: config.id,
      url: config.url,
      type: 'subpillar',
      title: config.title,
      h1: config.h1,
      meta_description: config.meta_description,
      primary_keyword: config.primary_keyword,
      secondary_keywords: config.secondary_keywords,
      word_count_target: config.word_count_target,
      sections: ['hero', 'service_detail', 'features', 'faq', 'testimonials', 'cta'],
      schema_types: config.schema_types,
      parent_pillar: config.parent_pillar,
      faq_questions: config.faq_questions,
    };
  }

  private toServicePageSpec(config: ServicePageConfig): PageSpec {
    return {
      id: config.id,
      url: config.url,
      type: 'service',
      title: config.title,
      h1: config.h1,
      meta_description: config.meta_description,
      primary_keyword: config.primary_keyword,
      secondary_keywords: [],
      word_count_target: config.word_count_target,
      sections: ['hero', 'service_detail', 'features', 'process', 'faq', 'cta'],
      schema_types: config.schema_types,
    };
  }

  private toLocationPageSpec(
    template: LocationPageTemplate['template'],
    industry: string,
    location: string
  ): PageSpec {
    const industryCapitalised = industry.charAt(0).toUpperCase() + industry.slice(1);

    return {
      id: `${industry}-${location.toLowerCase().replace(/\s+/g, '-')}`,
      url: template.url_pattern.replace('{industry}', industry).replace('{location}', location.toLowerCase()),
      type: 'location',
      title: template.title_pattern.replace('{Industry}', industryCapitalised).replace('{Location}', location),
      h1: template.h1_pattern.replace('{Industry}', industryCapitalised).replace('{Location}', location),
      meta_description: template.meta_description_pattern
        .replace('{industry}', industry)
        .replace('{Location}', location),
      primary_keyword: `${industry} marketing ${location.toLowerCase()}`,
      secondary_keywords: [`${industry} seo ${location.toLowerCase()}`, `${industry} ${location.toLowerCase()}`],
      word_count_target: template.word_count_target,
      sections: ['hero', 'industry_intro', 'features', 'testimonials', 'cta'],
      schema_types: template.schema_types,
      industry: industry,
      location: location,
    };
  }
}

// ============================================
// BATCH PROCESSOR
// ============================================

export interface BatchConfig {
  concurrent_pages: number;
  delay_between_pages_ms: number;
  stop_on_error: boolean;
  save_intermediate: boolean;
  output_dir: string;
}

export interface BatchResult {
  total_pages: number;
  successful: number;
  failed: number;
  total_cost_usd: number;
  total_tokens: number;
  total_time_ms: number;
  pages: Array<{
    page_id: string;
    url: string;
    success: boolean;
    cost_usd: number;
    errors: string[];
  }>;
}

interface PipelineInterface {
  generatePage(spec: PageSpec): Promise<{
    success: boolean;
    page?: {
      generation: {
        total_cost_usd: number;
        total_tokens: number;
      };
    };
    errors: string[];
  }>;
}

export class BatchProcessor {
  private pipeline: PipelineInterface;
  private config: BatchConfig;

  constructor(pipeline: PipelineInterface, config: Partial<BatchConfig> = {}) {
    this.pipeline = pipeline;
    this.config = {
      concurrent_pages: config.concurrent_pages || 1, // Sequential by default
      delay_between_pages_ms: config.delay_between_pages_ms || 1000,
      stop_on_error: config.stop_on_error || false,
      save_intermediate: config.save_intermediate !== false,
      output_dir: config.output_dir || './generated-content',
    };
  }

  /**
   * Process a batch of pages
   */
  async processBatch(pages: PageSpec[]): Promise<BatchResult> {
    const startTime = Date.now();
    const results: BatchResult['pages'] = [];
    let totalCost = 0;
    let totalTokens = 0;

     
    console.log(`[Batch] Starting generation of ${pages.length} pages`);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
       
      console.log(`[Batch] [${i + 1}/${pages.length}] Generating: ${page.url}`);

      try {
        const result = await this.pipeline.generatePage(page);

        results.push({
          page_id: page.id,
          url: page.url,
          success: result.success,
          cost_usd: result.page?.generation.total_cost_usd || 0,
          errors: result.errors,
        });

        if (result.page) {
          totalCost += result.page.generation.total_cost_usd;
          totalTokens += result.page.generation.total_tokens;
        }

        if (!result.success && this.config.stop_on_error) {
           
          console.log(`[Batch] Stopping due to error on ${page.url}`);
          break;
        }

        // Delay between pages
        if (i < pages.length - 1 && this.config.delay_between_pages_ms > 0) {
          await this.delay(this.config.delay_between_pages_ms);
        }
      } catch (error) {
        results.push({
          page_id: page.id,
          url: page.url,
          success: false,
          cost_usd: 0,
          errors: [String(error)],
        });

        if (this.config.stop_on_error) {
          break;
        }
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

     
    console.log(`[Batch] Complete: ${successful}/${pages.length} successful, $${totalCost.toFixed(4)} total cost`);

    return {
      total_pages: pages.length,
      successful,
      failed,
      total_cost_usd: totalCost,
      total_tokens: totalTokens,
      total_time_ms: Date.now() - startTime,
      pages: results,
    };
  }

  /**
   * Process pages by type
   */
  async processPageType(loader: PageLoader, type: PageType): Promise<BatchResult> {
    const pages = loader.getPagesByType(type);
    return this.processBatch(pages);
  }

  /**
   * Process all pages in priority order
   */
  async processAllInPriority(loader: PageLoader): Promise<BatchResult> {
    const pages = loader.getPriorityOrder();
    return this.processBatch(pages);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// CONTENT QUEUE
// ============================================

export interface QueuedPage {
  spec: PageSpec;
  priority: number;
  added_at: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    success: boolean;
    errors?: string[];
  };
}

export class ContentQueue {
  private queue: QueuedPage[] = [];
  private processing = false;
  private pipeline: PipelineInterface;

  constructor(pipeline: PipelineInterface) {
    this.pipeline = pipeline;
  }

  /**
   * Add a page to the queue
   */
  add(spec: PageSpec, priority: number = 5): void {
    this.queue.push({
      spec,
      priority,
      added_at: new Date(),
      status: 'pending',
    });

    // Sort by priority (lower = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add multiple pages
   */
  addMany(specs: PageSpec[], priority: number = 5): void {
    for (const spec of specs) {
      this.add(spec, priority);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.queue.filter((p) => p.status === 'pending').length,
      processing: this.queue.filter((p) => p.status === 'processing').length,
      completed: this.queue.filter((p) => p.status === 'completed').length,
      failed: this.queue.filter((p) => p.status === 'failed').length,
      total: this.queue.length,
    };
  }

  /**
   * Process the next item in the queue
   */
  async processNext(): Promise<QueuedPage | null> {
    const next = this.queue.find((p) => p.status === 'pending');
    if (!next) {
      return null;
    }

    next.status = 'processing';

    try {
      const result = await this.pipeline.generatePage(next.spec);
      next.status = result.success ? 'completed' : 'failed';
      next.result = result;
      return next;
    } catch (error) {
      next.status = 'failed';
      next.result = { success: false, errors: [String(error)] };
      return next;
    }
  }

  /**
   * Process all pending items
   */
  async processAll(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.some((p) => p.status === 'pending')) {
      await this.processNext();
    }

    this.processing = false;
  }

  /**
   * Clear completed/failed items
   */
  clear(status?: 'completed' | 'failed'): void {
    if (status) {
      this.queue = this.queue.filter((p) => p.status !== status);
    } else {
      this.queue = this.queue.filter((p) => p.status === 'pending' || p.status === 'processing');
    }
  }
}
