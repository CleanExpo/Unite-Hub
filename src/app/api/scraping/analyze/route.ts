/**
 * API Route: Web Scraping and Competitor Analysis
 * Endpoint: POST /api/scraping/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { spawn } from 'child_process';
import path from 'path';

export const maxDuration = 300; // 5 minutes for scraping operations

interface ScrapeRequest {
  url: string;
  analysisType: 'basic' | 'seo' | 'full' | 'competitor';
  saveToDatabase?: boolean;
}

interface ScrapeResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute Python scraping script
 */
function runPythonScript(scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: ScrapeRequest = await req.json();
    const { url, analysisType, saveToDatabase = false } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Determine which Python script to run
    let scriptPath: string;
    let scriptArgs: string[] = [url];

    switch (analysisType) {
      case 'basic':
        scriptPath = path.join(process.cwd(), 'src', 'lib', 'scraping', 'web-scraper.py');
        break;
      case 'seo':
        scriptPath = path.join(process.cwd(), 'src', 'lib', 'scraping', 'advanced-scraper.py');
        break;
      case 'full':
      case 'competitor':
        scriptPath = path.join(process.cwd(), 'src', 'lib', 'scraping', 'competitor-intelligence.py');
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    console.log(`Running scraper for ${url} (type: ${analysisType})`);

    // Execute Python script
    const result = await runPythonScript(scriptPath, scriptArgs);

    // Parse result
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = { raw_output: result };
    }

    // Save to database if requested
    if (saveToDatabase) {
      const supabase = await getSupabaseServer();

      const { error: insertError } = await supabase
        .from('competitor_analysis')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          url,
          analysis_type: analysisType,
          data: parsedResult,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error saving analysis:', insertError);
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      analysisType,
      url,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Scraping error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scrape website',
      },
      { status: 500 }
    );
  }
}
