import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface CrawlerResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  summary?: {
    totalPages: number;
    totalErrors: number;
    performance: Record<string, unknown>;
    status: string;
  };
}

// POST /api/monitoring/site-crawler - Manually trigger site crawler
export async function POST(request: NextRequest) {
  try {
    // Validate request authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract any options from request body
    const body = await request.json().catch(() => ({}));
    const { 
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      fullScan = false,
      timeout = 30000,
      additionalOptions = {}
    } = body;

    console.log('Starting manual site crawler execution with options:', {
      baseUrl,
      fullScan,
      timeout,
      additionalOptions
    });

    // Execute the site crawler
    const result = await executeSiteCrawler(baseUrl, { 
      fullScan, 
      timeout,
      additionalOptions 
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Site crawler completed successfully',
        data: result.data,
        timestamp: result.timestamp
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: result.timestamp
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Site crawler API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/monitoring/site-crawler - Get crawler status and recent results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeDetails = searchParams.get('details') === 'true';
    const includePerformance = searchParams.get('performance') === 'true';

    // Read recent crawler results from logs directory
    const recentResults = await getRecentCrawlerResults(limit, includeDetails);

    // If performance metrics are requested, generate them
    let enhancedResults;
    if (includePerformance) {
      enhancedResults = await enrichWithPerformanceMetrics(recentResults);
    } else {
      enhancedResults = recentResults;
    }

    return NextResponse.json({
      success: true,
      results: enhancedResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get crawler status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve crawler status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function executeSiteCrawler(
  baseUrl: string, 
  options: { fullScan: boolean; timeout: number; additionalOptions?: Record<string, unknown> }
): Promise<CrawlerResult> {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString();
    
    try {
      const crawlerPath = path.join(process.cwd(), 'scripts', 'site-crawler.ts');
      
      // Prepare crawler arguments
      const args = ['tsx', crawlerPath];
      if (options.fullScan) args.push('--full');
      args.push('--base-url', baseUrl);

      // Add any additional options from the request body
      if (options.additionalOptions) {
        Object.entries(options.additionalOptions).forEach(([key, value]) => {
          args.push('--' + key, String(value));
        });
      }

      const child = spawn('npx', args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'production',
          CRAWLER_BASE_URL: baseUrl
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output
            const result = JSON.parse(stdout);
            resolve({
              success: true,
              data: result,
              timestamp
            });
          } catch {
            // If not JSON, treat as raw output
            resolve({
              success: true,
              data: { 
                rawOutput: stdout,
                message: 'Crawler completed but returned non-JSON output'
              },
              timestamp
            });
          }
        } else {
          resolve({
            success: false,
            error: `Crawler exited with code ${code}: ${stderr || 'Unknown error'}`,
            timestamp
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start crawler: ${error.message}`,
          timestamp
        });
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          error: `Crawler timeout after ${options.timeout}ms`,
          timestamp
        });
      }, options.timeout);

      child.on('close', () => {
        clearTimeout(timeoutId);
      });

    } catch (error) {
      resolve({
        success: false,
        error: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      });
    }
  });
}

async function getRecentCrawlerResults(limit: number, includeDetails: boolean) {
  const fs = await import('fs').then(m => m.promises);
  const logsDir = path.join(process.cwd(), 'logs');
  
  try {
    // Ensure logs directory exists
    await fs.access(logsDir);
  } catch {
    return [];
  }

  try {
    const files = await fs.readdir(logsDir);
    const crawlerFiles = files
      .filter(file => file.includes('crawler-report') && file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const results = [];
    
    for (const file of crawlerFiles) {
      try {
        const filePath = path.join(logsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (includeDetails) {
          results.push({
            file,
            timestamp: file.match(/(\d{4}-\d{2}-\d{2})/)?.[1],
            data
          });
        } else {
          // Return summary only
          results.push({
            file,
            timestamp: file.match(/(\d{4}-\d{2}-\d{2})/)?.[1],
            summary: {
              totalPages: data.pages?.length || 0,
              totalErrors: data.errors?.length || 0,
              performance: data.performance || {},
              status: data.errors?.length > 0 ? 'issues_found' : 'healthy'
            }
          });
        }
      } catch (parseError) {
        console.error(`Failed to parse crawler result file ${file}:`, parseError);
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to read crawler results:', error);
    return [];
  }
}

// Health check endpoint
export async function HEAD() {
  return new Response(null, { status: 200 });
}

async function enrichWithPerformanceMetrics(recentResults: any[]) {
  // Analyze performance trends
  const performanceTrends = await analyzeCrawlerPerformance(recentResults);
  
  // Calculate overall health score
  const healthScore = calculateHealthScore(recentResults);
  
  // Prepare enhanced results with performance metrics
  return recentResults.map((result) => {
    if (result.summary) {
      return {
        ...result,
        performanceMetrics: {
          healthScore,
          ...performanceTrends,
          timestamp: new Date().toISOString()
        }
      };
    }
    return result;
  });
}

async function analyzeCrawlerPerformance(results: any[]) {
  // This function would implement performance analysis logic
  // For now, returning mock data
  return {
    averageDuration: 12.3,
    successRate: 98.7,
    errorDistribution: {
      httpErrors: 2,
      timeoutErrors: 1,
      otherErrors: 0
    },
    improvementScore: 95.4
  };
}

function calculateHealthScore(results: any[]) {
  // Simple health score calculation based on recent results
  const totalErrors = results.reduce((sum, r) => {
    return sum + (r.summary?.totalErrors || 0);
  }, 0);
  
  // If no results, return 100
  if (results.length === 0) return 100;
  
  // Health score = 100 - (number of errors * 5) but capped at 0
  const score = Math.max(0, 100 - totalErrors * 5);
  return parseFloat(score.toFixed(1));
}
