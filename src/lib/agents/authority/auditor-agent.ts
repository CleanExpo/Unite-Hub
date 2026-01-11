/**
 * Auditor Agent - Visual Gap Recording
 * Records browser sessions of search gaps using Playwright + Gemini Computer Use
 * Generates dual output: Loom-style video walkthrough + static diagnostic page
 */

import { BaseAgent, AgentTask } from '../base-agent';
import { getSupabaseServer } from '@/lib/supabase';
import { getGeminiComputerUse } from '@/lib/integrations/gemini/computer-use';
import playwright from 'playwright';
import type {
  AuditorTaskPayload,
  AuditorResult
} from './types';

export class AuditorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Auditor Agent',
      queueName: 'authority-auditor',
      concurrency: 1, // One browser session at a time
      prefetchCount: 1,
    });
  }

  /**
   * Process Auditor task - record visual gap evidence
   */
  protected async processTask(task: AgentTask): Promise<AuditorResult> {
    const payload = task.payload as AuditorTaskPayload;
    const startTime = Date.now();

    console.log(`[Auditor] Recording visual gap for "${payload.keyword}" in ${payload.suburb}, ${payload.state}`);

    try {
      // Step 1: Launch browser and record search session
      const browserSession = await this.recordSearchGapSession({
        keyword: payload.keyword,
        suburb: payload.suburb,
        state: payload.state,
        duration: 30000, // 30 seconds
      });

      // Step 2: Analyze with Gemini Computer Use
      const gapAnalysis = await this.analyzeSearchGap(browserSession.screenshots[0]);

      // Step 3: Generate outputs based on requested formats
      const outputs: AuditorResult = {
        informationVacuumId: payload.informationVacuumId,
        visualAuditId: '', // Will be set after DB insert
        searchGapScreenshots: browserSession.screenshots,
        recordingDurationMs: Date.now() - startTime,
        costUsd: gapAnalysis.costUsd,
      };

      // Video walkthrough (if requested)
      if (payload.outputFormats.includes('video')) {
        outputs.videoUrl = await this.generateVideoWalkthrough({
          screenshots: browserSession.screenshots,
          keyword: payload.keyword,
          suburb: payload.suburb,
          clientName: payload.clientName,
          clientProofPhotos: payload.clientProofPhotos,
          gapAnalysis: gapAnalysis.reasoning,
        });
      }

      // Static landing page (if requested)
      if (payload.outputFormats.includes('static')) {
        outputs.staticPageUrl = await this.generateStaticPage({
          keyword: payload.keyword,
          suburb: payload.suburb,
          state: payload.state,
          screenshots: browserSession.screenshots,
          clientName: payload.clientName,
          clientProofPhotos: payload.clientProofPhotos,
          competitorCount: gapAnalysis.competitorCount,
        });
      }

      // Step 4: Store in database
      const visualAuditId = await this.storeVisualAudit({
        workspaceId: task.workspace_id,
        clientId: payload.clientId,
        informationVacuumId: payload.informationVacuumId,
        keyword: payload.keyword,
        suburb: payload.suburb,
        state: payload.state,
        videoUrl: outputs.videoUrl,
        staticPageUrl: outputs.staticPageUrl,
        screenshots: browserSession.screenshots,
        metadata: {
          recording_duration_ms: browserSession.duration,
          competitor_count: gapAnalysis.competitorCount,
          local_pack_present: gapAnalysis.localPackPresent,
          client_proof_photos_used: payload.clientProofPhotos,
          gemini_analysis: gapAnalysis.reasoning,
        },
      });

      outputs.visualAuditId = visualAuditId;

      // Update information_vacuum with audit completion
      await this.supabase
        .from('information_vacuums')
        .update({
          visual_audit_id: visualAuditId,
          visual_audit_completed_at: new Date().toISOString(),
          status: 'audited',
        })
        .eq('id', payload.informationVacuumId);

      console.log(`[Auditor] Visual audit complete: ${visualAuditId}`);

      return outputs;
    } catch (error: any) {
      console.error('[Auditor] Recording failed:', error.message);
      throw error;
    }
  }

  /**
   * Record browser session of search gap (Playwright automation)
   */
  private async recordSearchGapSession(config: {
    keyword: string;
    suburb: string;
    state: string;
    duration: number;
  }): Promise<{
    screenshots: string[];
    videoPath?: string;
    duration: number;
  }> {
    const browser = await playwright.chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: './tmp/recordings',
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();
    const screenshots: string[] = [];
    const startTime = Date.now();

    try {
      // Navigate to Google Australia search
      const searchQuery = `${config.keyword} ${config.suburb} ${config.state}`;
      await page.goto(`https://www.google.com.au/search?q=${encodeURIComponent(searchQuery)}`);

      // Capture initial results
      const screenshot1 = await page.screenshot({ fullPage: false });
      const screenshot1Path = `./tmp/screenshots/gap-${config.suburb}-1.png`;
      await page.screenshot({ path: screenshot1Path, fullPage: false });
      screenshots.push(screenshot1Path);

      // Wait for results to load
      await page.waitForTimeout(2000);

      // Scroll to see more results
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);

      const screenshot2Path = `./tmp/screenshots/gap-${config.suburb}-2.png`;
      await page.screenshot({ path: screenshot2Path, fullPage: false });
      screenshots.push(screenshot2Path);

      // Click "More results" if available
      try {
        const moreButton = await page.locator('text=More results').first();
        if (await moreButton.isVisible()) {
          await moreButton.click();
          await page.waitForTimeout(2000);

          const screenshot3Path = `./tmp/screenshots/gap-${config.suburb}-3.png`;
          await page.screenshot({ path: screenshot3Path, fullPage: false });
          screenshots.push(screenshot3Path);
        }
      } catch (e) {
        // More button not found, that's fine
      }

      // Wait for configured duration
      const elapsed = Date.now() - startTime;
      if (elapsed < config.duration) {
        await page.waitForTimeout(config.duration - elapsed);
      }

      // Get video path
      const videoPath = await page.video()?.path();

      await browser.close();

      return {
        screenshots,
        videoPath,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Analyze search gap using Gemini Computer Use
   */
  private async analyzeSearchGap(screenshotPath: string): Promise<{
    competitorCount: number;
    localPackPresent: boolean;
    reasoning: string;
    costUsd: number;
  }> {
    const gemini = getGeminiComputerUse();

    // Read screenshot file
    const fs = await import('fs/promises');
    const screenshot = await fs.readFile(screenshotPath);

    const result = await gemini.countCompetitorsInSERP(screenshot);

    return result;
  }

  /**
   * Generate Loom-style video walkthrough
   * TODO: Implement with FFmpeg + ElevenLabs narration
   */
  private async generateVideoWalkthrough(config: {
    screenshots: string[];
    keyword: string;
    suburb: string;
    clientName: string;
    clientProofPhotos: string[];
    gapAnalysis: string;
  }): Promise<string> {
    console.log('[Auditor] Generating video walkthrough (PLACEHOLDER)...');

    // Placeholder: In production, this would:
    // 1. Use FFmpeg to create slideshow from screenshots
    // 2. Generate narration script
    // 3. Use ElevenLabs to create AU-accented voiceover
    // 4. Overlay client proof photos in split-screen
    // 5. Compile to MP4
    // 6. Upload to Supabase Storage
    // 7. Return public URL

    const videoUrl = `/visual-audits/placeholder-${config.suburb}-walkthrough.mp4`;

    console.log(`[Auditor] Video walkthrough generated (placeholder): ${videoUrl}`);

    return videoUrl;
  }

  /**
   * Generate static diagnostic page
   * Creates Next.js page at /suburbs/[state]/[suburb]/[keyword]
   */
  private async generateStaticPage(config: {
    keyword: string;
    suburb: string;
    state: string;
    screenshots: string[];
    clientName: string;
    clientProofPhotos: string[];
    competitorCount: number;
  }): Promise<string> {
    console.log('[Auditor] Generating static page...');

    // Upload screenshots to Supabase Storage
    const uploadedScreenshots: string[] = [];
    for (const screenshotPath of config.screenshots) {
      const url = await this.uploadScreenshot(screenshotPath, config.suburb);
      uploadedScreenshots.push(url);
    }

    // Store page data in database (to be rendered by Next.js dynamic route)
    const pageSlug = `${config.state.toLowerCase()}-${config.suburb.toLowerCase()}-${config.keyword.replace(/\s+/g, '-')}`;

    await this.supabase.from('synthex_diagnostic_pages').insert({
      slug: pageSlug,
      keyword: config.keyword,
      suburb: config.suburb,
      state: config.state,
      client_name: config.clientName,
      screenshots: uploadedScreenshots,
      client_proof_photos: config.clientProofPhotos,
      competitor_count: config.competitorCount,
      gap_description: `Only ${config.competitorCount} businesses found for "${config.keyword}" in ${config.suburb}`,
      cta_text: `See how ${config.clientName} can help`,
      created_at: new Date().toISOString(),
    });

    const pageUrl = `/suburbs/${pageSlug}`;

    console.log(`[Auditor] Static page created: ${pageUrl}`);

    return pageUrl;
  }

  /**
   * Upload screenshot to Supabase Storage
   */
  private async uploadScreenshot(screenshotPath: string, suburb: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const fileBuffer = await fs.readFile(screenshotPath);
    const fileName = `${suburb}-${Date.now()}-${path.basename(screenshotPath)}`;

    const { data, error } = await this.supabase.storage
      .from('visual-audits')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload screenshot: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('visual-audits')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Store visual audit in database
   */
  private async storeVisualAudit(data: {
    workspaceId: string;
    clientId: string;
    informationVacuumId: string;
    keyword: string;
    suburb: string;
    state: string;
    videoUrl?: string;
    staticPageUrl?: string;
    screenshots: string[];
    metadata: Record<string, any>;
  }): Promise<string> {
    const { data: insertedData, error } = await this.supabase
      .from('synthex_visual_audits')
      .insert({
        workspace_id: data.workspaceId,
        client_id: data.clientId,
        information_vacuum_id: data.informationVacuumId,
        keyword: data.keyword,
        suburb: data.suburb,
        state: data.state,
        video_url: data.videoUrl,
        static_page_url: data.staticPageUrl,
        search_gap_screenshots: data.screenshots,
        browser_session_metadata: data.metadata,
        generated_by: 'auditor_agent',
        generation_model: 'gemini-2.5-pro-experimental',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store visual audit: ${error.message}`);
    }

    return insertedData.id;
  }
}

/**
 * Create and export singleton instance
 */
let auditorAgentInstance: AuditorAgent | null = null;

export function getAuditorAgent(): AuditorAgent {
  if (!auditorAgentInstance) {
    auditorAgentInstance = new AuditorAgent();
  }
  return auditorAgentInstance;
}
