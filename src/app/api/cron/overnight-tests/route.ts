// src/app/api/cron/overnight-tests/route.ts
// API endpoint to trigger overnight persona tests

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max per invocation (Vercel limit)

interface TestResult {
  persona_id: string;
  test_type: string;
  success: boolean;
  duration_ms: number;
  cost_usd?: number;
  error?: string;
}

const INDUSTRIES = ['trades', 'professional', 'health', 'hospitality', 'retail', 'automotive', 'home_services', 'tech_services'];
const LOCATIONS = ['Sydney, NSW', 'Melbourne, VIC', 'Brisbane, QLD', 'Perth, WA', 'Adelaide, SA'];
const TEST_TYPES = ['brand_analysis', 'content_generation', 'seo_audit', 'competitor_analysis', 'campaign_strategy', 'client_retention', 'stickiness', 'lost_direction', 'flow'];

const INDUSTRY_CONFIG: Record<string, { businesses: string[]; pain_points: string[]; goals: string[]; marketing: string[] }> = {
  trades: {
    businesses: ['Reliable Plumbing Co', 'Spark Electric Services', 'Cool Air HVAC'],
    pain_points: ['Finding quality leads', 'Managing job scheduling', 'Quote follow-ups'],
    goals: ['More consistent work', 'Higher margin jobs', 'Better reviews'],
    marketing: ['Word of mouth', 'Facebook page'],
  },
  professional: {
    businesses: ['Smith & Partners Accounting', 'Legal Eagles Law', 'Financial Planning Plus'],
    pain_points: ['Client retention', 'Lead generation', 'Online presence'],
    goals: ['Grow client base', 'Increase referrals', 'Build authority'],
    marketing: ['Referrals', 'LinkedIn'],
  },
  health: {
    businesses: ['Smile Dental Clinic', 'PhysioFit Studios', 'Mind Wellness Psychology'],
    pain_points: ['No-show appointments', 'Patient retention', 'Managing reviews'],
    goals: ['Fill appointment book', 'Reduce no-shows', 'Build reputation'],
    marketing: ['Google My Business', 'Facebook'],
  },
  hospitality: {
    businesses: ['Cafe Delights', 'The Local Pub', 'Fine Dining Experience'],
    pain_points: ['Seasonal fluctuations', 'Staff retention', 'Online ordering'],
    goals: ['Increase covers', 'Build loyal customers', 'Grow delivery sales'],
    marketing: ['Instagram', 'Google Maps'],
  },
  retail: {
    businesses: ['Fashion Forward Boutique', 'Home Decor Plus', 'Pet Supplies Direct'],
    pain_points: ['Online competition', 'Inventory management', 'Customer loyalty'],
    goals: ['Increase sales', 'Build online presence', 'Customer retention'],
    marketing: ['Facebook Shop', 'Instagram'],
  },
  automotive: {
    businesses: ['Quality Auto Repairs', 'Tyre & Wheel Experts', 'Auto Detailing Pro'],
    pain_points: ['Trust issues with customers', 'Price competition', 'Building reputation'],
    goals: ['Increase bookings', 'Build trust', 'Expand services'],
    marketing: ['Google Business', 'Facebook'],
  },
  home_services: {
    businesses: ['Sparkle Clean Services', 'Lawn Care Pros', 'Pest Control Experts'],
    pain_points: ['Seasonal demand', 'Pricing transparency', 'Building trust'],
    goals: ['Consistent bookings', 'Grow service area', 'Build reviews'],
    marketing: ['Google Ads', 'Facebook'],
  },
  tech_services: {
    businesses: ['IT Support Solutions', 'Web Design Studio', 'App Development Co'],
    pain_points: ['Explaining value to clients', 'Scope creep', 'Long sales cycles'],
    goals: ['Retainer clients', 'Higher value projects', 'Build authority'],
    marketing: ['LinkedIn', 'Content marketing'],
  },
};

function generateTestPersona(industry: string, index: number) {
  const config = INDUSTRY_CONFIG[industry];
  return {
    id: `${industry}-${String(index + 1).padStart(3, '0')}`,
    business_name: config.businesses[index % config.businesses.length],
    industry,
    location: LOCATIONS[index % LOCATIONS.length],
    employees: [1, 5, 10, 20, 50][index % 5],
    pain_points: config.pain_points,
    goals: config.goals,
    current_marketing: config.marketing,
    budget_range: `$${500 + (index * 100)}-$${1000 + (index * 200)}/month`,
    decision_maker: {
      role: index % 2 === 0 ? 'Owner' : 'Manager',
      tech_savvy: (['low', 'medium', 'high'] as const)[index % 3],
    },
  };
}

function getTestPrompt(testType: string, persona: ReturnType<typeof generateTestPersona>): string {
  switch (testType) {
    case 'brand_analysis':
      return `Analyze the brand positioning for ${persona.business_name}, a ${persona.industry} business in ${persona.location}. Their pain points: ${persona.pain_points.join(', ')}. Goals: ${persona.goals.join(', ')}. Brief analysis (2-3 sentences).`;
    case 'content_generation':
      return `Generate a compelling headline and 1-sentence value proposition for ${persona.business_name} targeting ${persona.decision_maker.role}s in the ${persona.industry} industry.`;
    case 'seo_audit':
      return `Provide 3 quick SEO recommendations for ${persona.business_name}, a local ${persona.industry} business in ${persona.location}.`;
    case 'competitor_analysis':
      return `Identify 2 key differentiators ${persona.business_name} could leverage against larger competitors. Budget: ${persona.budget_range}.`;
    case 'campaign_strategy':
      return `Suggest a simple 3-step marketing campaign for ${persona.business_name} to achieve: ${persona.goals[0]}. Budget: ${persona.budget_range}.`;
    case 'client_retention':
      return `${persona.business_name} is a ${persona.industry} business in ${persona.location}. Suggest 3 specific client retention strategies to reduce churn. Budget: ${persona.budget_range}.`;
    case 'stickiness':
      return `How can ${persona.business_name} (${persona.industry}) create "stickiness" - making customers less likely to switch? Pain points: ${persona.pain_points.join(', ')}. Provide 2-3 stickiness mechanisms.`;
    case 'lost_direction':
      return `${persona.business_name} (${persona.industry}) feels they've lost direction. Goals: ${persona.goals.join(', ')}. Challenges: ${persona.pain_points.join(', ')}. Provide a brief diagnostic and first step to regain clarity.`;
    case 'flow':
      return `Map the ideal customer flow for ${persona.business_name} (${persona.industry}) from awareness to loyal customer. Include 4-5 key touchpoints. Budget: ${persona.budget_range}.`;
    default:
      return `Help ${persona.business_name} with their marketing needs.`;
  }
}

async function callOpenRouter(
  apiKey: string,
  prompt: string,
  model: string = 'deepseek/deepseek-chat'
): Promise<{ content: string; tokens: { input: number; output: number }; cost: number; latency: number }> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://synthex.com.au',
      'X-Title': 'Synthex Overnight Tests',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a marketing strategist helping Australian SMBs. Keep responses concise.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const latency = Date.now() - startTime;

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

  // DeepSeek pricing
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.14;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.28;

  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: { input: usage.prompt_tokens, output: usage.completion_tokens },
    cost: inputCost + outputCost,
    latency,
  };
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
  }

  // Get batch params
  const searchParams = request.nextUrl.searchParams;
  const batchIndex = parseInt(searchParams.get('batch') || '0', 10);
  const batchSize = parseInt(searchParams.get('size') || '5', 10);

  const results: TestResult[] = [];
  const startTime = Date.now();

  // Run tests for this batch
  for (let i = 0; i < batchSize; i++) {
    const globalIndex = batchIndex * batchSize + i;
    const industryIndex = globalIndex % INDUSTRIES.length;
    const personaIndex = Math.floor(globalIndex / INDUSTRIES.length);

    const industry = INDUSTRIES[industryIndex];
    const persona = generateTestPersona(industry, personaIndex);

    for (const testType of TEST_TYPES) {
      const prompt = getTestPrompt(testType, persona);

      try {
        const result = await callOpenRouter(apiKey, prompt);

        results.push({
          persona_id: persona.id,
          test_type: testType,
          success: true,
          duration_ms: result.latency,
          cost_usd: result.cost,
        });
      } catch (error) {
        results.push({
          persona_id: persona.id,
          test_type: testType,
          success: false,
          duration_ms: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const elapsed = Date.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalCost = results.reduce((sum, r) => sum + (r.cost_usd || 0), 0);

  return NextResponse.json({
    success: true,
    batch_index: batchIndex,
    batch_size: batchSize,
    results_count: results.length,
    passed,
    failed,
    total_cost_usd: Math.round(totalCost * 10000) / 10000,
    elapsed_ms: elapsed,
    next_batch: batchIndex + 1,
  });
}

export async function POST(request: NextRequest) {
  // Same auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // POST triggers a full run status check
  return NextResponse.json({
    status: 'overnight_tests_available',
    endpoint: '/api/cron/overnight-tests?batch=0&size=5',
    description: 'Call GET with batch parameter to run tests incrementally',
    total_personas: 200,
    tests_per_persona: TEST_TYPES.length,
    total_tests: 200 * TEST_TYPES.length,
    recommended_batches: 40,
    model: 'deepseek/deepseek-chat',
    estimated_cost: '$0.03',
  });
}
