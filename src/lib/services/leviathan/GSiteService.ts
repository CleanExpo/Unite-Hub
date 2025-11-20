/**
 * GSiteService - Google Sites Page Creation with Playwright Stealth
 * Phase 13 Week 5-6: Social stack integration
 *
 * Handles:
 * - Google Sites page creation via Playwright
 * - Stealth mode to avoid detection
 * - Blogger post embedding
 * - Content wrapper generation
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as crypto from 'crypto';

export interface GSiteConfig {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

export interface GSitePageContent {
  siteName: string;
  pageTitle: string;
  wrapperContent: string;
  embeddedUrls: string[];
  targetUrl: string;
}

export interface GSiteResult {
  success: boolean;
  siteUrl?: string;
  pageUrl?: string;
  editUrl?: string;
  externalSiteId?: string;
  externalPageId?: string;
  error?: string;
}

export class GSiteService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: GSiteConfig;

  constructor(config?: GSiteConfig) {
    this.config = {
      headless: config?.headless ?? true,
      slowMo: config?.slowMo ?? 50,
      timeout: config?.timeout ?? 30000,
    };
  }

  /**
   * Initialize browser with stealth settings
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
    });

    // Create context with stealth settings
    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation'],
    });

    // Add stealth scripts
    await this.context.addInitScript(() => {
      // Override webdriver detection
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override Chrome runtime
      (window as any).chrome = {
        runtime: {},
      };
    });
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Create a new Google Sites page
   */
  async createPage(content: GSitePageContent): Promise<GSiteResult> {
    if (!this.context) {
      await this.initialize();
    }

    const page = await this.context!.newPage();

    try {
      // Navigate to Google Sites
      await page.goto('https://sites.google.com/new', {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      });

      // Check if login is required
      if (page.url().includes('accounts.google.com')) {
        await page.close();
        return {
          success: false,
          error: 'Google authentication required. Please log in manually first.',
        };
      }

      // Create new site
      const result = await this.createNewSite(page, content);

      await page.close();
      return result;

    } catch (error) {
      await page.close();
      const errorMessage = error instanceof Error ? error.message : 'Unknown GSite error';
      console.error('GSite creation failed:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create new site and add content
   */
  private async createNewSite(
    page: Page,
    content: GSitePageContent
  ): Promise<GSiteResult> {
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click "Blank" template
    const blankTemplate = page.locator('[data-template-id="blank"]').first();
    if (await blankTemplate.isVisible()) {
      await blankTemplate.click();
      await page.waitForTimeout(1000);
    }

    // Set site name
    const titleInput = page.locator('[aria-label="Enter site name"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(content.siteName);
    }

    // Set page title
    const pageTitleInput = page.locator('[data-placeholder="Page title"]').first();
    if (await pageTitleInput.isVisible()) {
      await pageTitleInput.fill(content.pageTitle);
      await page.keyboard.press('Enter');
    }

    // Add text content
    await this.addTextContent(page, content.wrapperContent);

    // Embed URLs
    for (const url of content.embeddedUrls) {
      await this.embedUrl(page, url);
    }

    // Add link to target
    await this.addLink(page, content.targetUrl, 'Learn More');

    // Publish the site
    const publishResult = await this.publishSite(page, content.siteName);

    return publishResult;
  }

  /**
   * Add text content to page
   */
  private async addTextContent(page: Page, content: string): Promise<void> {
    // Click to add content
    const contentArea = page.locator('[data-placeholder="Click to add text"]').first();
    if (await contentArea.isVisible()) {
      await contentArea.click();
      await page.keyboard.type(content, { delay: 10 });
      await page.keyboard.press('Escape');
    }
  }

  /**
   * Embed a URL (Blogger post, etc.)
   */
  private async embedUrl(page: Page, url: string): Promise<void> {
    // Click Insert menu
    const insertMenu = page.locator('[aria-label="Insert"]').first();
    if (await insertMenu.isVisible()) {
      await insertMenu.click();
      await page.waitForTimeout(500);

      // Click Embed
      const embedOption = page.locator('text=Embed').first();
      if (await embedOption.isVisible()) {
        await embedOption.click();
        await page.waitForTimeout(500);

        // Enter URL
        const urlInput = page.locator('input[type="url"]').first();
        if (await urlInput.isVisible()) {
          await urlInput.fill(url);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    }
  }

  /**
   * Add a link to the page
   */
  private async addLink(page: Page, url: string, text: string): Promise<void> {
    // Type link text
    await page.keyboard.type(text, { delay: 10 });

    // Select the text
    await page.keyboard.down('Shift');
    for (let i = 0; i < text.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // Add link
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const linkInput = page.locator('input[placeholder*="link"]').first();
    if (await linkInput.isVisible()) {
      await linkInput.fill(url);
      await page.keyboard.press('Enter');
    }
  }

  /**
   * Publish the site
   */
  private async publishSite(page: Page, siteName: string): Promise<GSiteResult> {
    // Click Publish button
    const publishButton = page.locator('[aria-label="Publish"]').first();
    if (await publishButton.isVisible()) {
      await publishButton.click();
      await page.waitForTimeout(1000);

      // Enter web address
      const addressInput = page.locator('input[aria-label*="web address"]').first();
      if (await addressInput.isVisible()) {
        const siteSlug = this.generateSiteSlug(siteName);
        await addressInput.fill(siteSlug);
      }

      // Click Publish in dialog
      const confirmPublish = page.locator('button:has-text("Publish")').last();
      if (await confirmPublish.isVisible()) {
        await confirmPublish.click();
        await page.waitForTimeout(3000);
      }

      // Get published URL
      const currentUrl = page.url();
      const siteId = this.extractSiteId(currentUrl);

      return {
        success: true,
        siteUrl: `https://sites.google.com/view/${this.generateSiteSlug(siteName)}`,
        pageUrl: `https://sites.google.com/view/${this.generateSiteSlug(siteName)}`,
        editUrl: currentUrl,
        externalSiteId: siteId,
      };
    }

    return {
      success: false,
      error: 'Publish button not found',
    };
  }

  /**
   * Generate site slug from name
   */
  private generateSiteSlug(name: string): string {
    const hash = crypto.createHash('md5').update(name + Date.now()).digest('hex').substring(0, 6);
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) + '-' + hash;
  }

  /**
   * Extract site ID from URL
   */
  private extractSiteId(url: string): string {
    const match = url.match(/\/d\/([^/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Generate tracking ID
   */
  generateTrackingId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

export default GSiteService;
