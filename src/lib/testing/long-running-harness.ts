// src/lib/testing/long-running-harness.ts
// Synthex Overnight Test Harness - 200-Persona SMB Testing System

import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface SMBPersona {
  id: string;
  business_name: string;
  industry: string;
  location: string;
  employees: number;
  annual_revenue: string;
  pain_points: string[];
  goals: string[];
  current_marketing: string[];
  budget_range: string;
  decision_maker: {
    name: string;
    role: string;
    age_range: string;
    tech_savvy: 'low' | 'medium' | 'high';
  };
}

export interface TestResult {
  persona_id: string;
  test_type: string;
  timestamp: string;
  duration_ms: number;
  success: boolean;
  response?: string;
  error?: string;
  model_used?: string;
  tokens_used?: {
    input: number;
    output: number;
    total: number;
  };
  cost_usd?: number;
}

export interface TestProgress {
  started_at: string;
  current_persona: number;
  total_personas: number;
  completed: number;
  failed: number;
  skipped: number;
  estimated_completion: string;
  current_test: string;
}

export interface FinalReport {
  run_id: string;
  started_at: string;
  completed_at: string;
  duration_hours: number;
  total_personas: number;
  total_tests: number;
  passed: number;
  failed: number;
  success_rate: number;
  total_cost_usd: number;
  average_response_time_ms: number;
  industry_breakdown: Record<string, { passed: number; failed: number }>;
  swot_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: string[];
}

export interface HarnessConfig {
  openrouter_api_key: string;
  model?: string;
  max_personas?: number;
  max_runtime_hours?: number;
  output_dir?: string;
  resume_from?: string;
  batch_size?: number;
  delay_between_tests_ms?: number;
}

// ============================================
// INDUSTRY PRESETS (8 Industries, 25 each = 200 total)
// ============================================

const INDUSTRIES = [
  'trades',           // 25 personas
  'professional',     // 25 personas
  'health',           // 25 personas
  'hospitality',      // 25 personas
  'retail',           // 25 personas
  'automotive',       // 25 personas
  'home_services',    // 25 personas
  'tech_services',    // 25 personas
] as const;

const LOCATIONS = [
  'Sydney, NSW',
  'Melbourne, VIC',
  'Brisbane, QLD',
  'Perth, WA',
  'Adelaide, SA',
  'Gold Coast, QLD',
  'Newcastle, NSW',
  'Canberra, ACT',
  'Sunshine Coast, QLD',
  'Wollongong, NSW',
];

const EMPLOYEE_RANGES = [1, 2, 3, 5, 10, 15, 20, 30, 50];
const REVENUE_RANGES = [
  '$50K-$100K',
  '$100K-$250K',
  '$250K-$500K',
  '$500K-$1M',
  '$1M-$2.5M',
  '$2.5M-$5M',
  '$5M-$10M',
];

const INDUSTRY_CONFIG: Record<string, {
  businesses: string[];
  pain_points: string[];
  goals: string[];
  marketing: string[];
}> = {
  trades: {
    businesses: [
      'Reliable Plumbing Co', 'Spark Electric Services', 'Cool Air HVAC',
      'Pro Carpentry Solutions', 'Master Painters AU', 'Tiling Experts',
      'Roofing Specialists', 'Landscape Masters', 'Building Renovations',
      'Solar Installation Pros', 'Pool Builders Elite', 'Concreting Solutions',
    ],
    pain_points: [
      'Finding quality leads', 'Managing job scheduling', 'Quote follow-ups',
      'Getting online reviews', 'Competing with bigger companies',
    ],
    goals: [
      'More consistent work', 'Higher margin jobs', 'Better customer reviews',
      'Reduce admin time', 'Expand service area',
    ],
    marketing: ['Word of mouth', 'Facebook page', 'Google Business', 'Yellow Pages'],
  },
  professional: {
    businesses: [
      'Smith & Partners Accounting', 'Legal Eagles Law', 'Financial Planning Plus',
      'Tax Solutions AU', 'Business Consulting Group', 'HR Advisory Services',
      'Mortgage Brokers Direct', 'Insurance Advisors', 'Wealth Management Co',
    ],
    pain_points: [
      'Client retention', 'Compliance updates', 'Lead generation',
      'Differentiating from competitors', 'Online presence',
    ],
    goals: [
      'Grow client base', 'Increase referrals', 'Automate admin',
      'Build authority', 'Expand services',
    ],
    marketing: ['Referrals', 'LinkedIn', 'Professional networks', 'Seminars'],
  },
  health: {
    businesses: [
      'Smile Dental Clinic', 'PhysioFit Studios', 'Mind Wellness Psychology',
      'Chiro Care Centre', 'Optometry Plus', 'Skin Health Clinic',
      'Podiatry Experts', 'Speech Therapy Hub', 'Nutrition Consulting',
    ],
    pain_points: [
      'No-show appointments', 'Patient retention', 'Managing reviews',
      'AHPRA compliance', 'Standing out locally',
    ],
    goals: [
      'Fill appointment book', 'Reduce no-shows', 'Build reputation',
      'Attract new patients', 'Expand services',
    ],
    marketing: ['Google My Business', 'Facebook', 'Local directories', 'Referrals'],
  },
  hospitality: {
    businesses: [
      'Cafe Delights', 'The Local Pub', 'Fine Dining Experience',
      'Quick Bites Takeaway', 'Event Catering Co', 'Bakery Fresh',
      'Coffee House Central', 'Thai Kitchen', 'Pizza Palace',
    ],
    pain_points: [
      'Seasonal fluctuations', 'Staff retention', 'Online ordering',
      'Review management', 'Standing out from chains',
    ],
    goals: [
      'Increase covers', 'Build loyal customers', 'Grow delivery sales',
      'Event bookings', 'Social media presence',
    ],
    marketing: ['Instagram', 'Google Maps', 'UberEats', 'Local guides'],
  },
  retail: {
    businesses: [
      'Fashion Forward Boutique', 'Home Decor Plus', 'Pet Supplies Direct',
      'Sports Gear Outlet', 'Electronics Hub', 'Gift Shop Central',
      'Toy World Express', 'Beauty Products Store', 'Garden Supplies',
    ],
    pain_points: [
      'Online competition', 'Inventory management', 'Foot traffic',
      'Seasonal sales', 'Customer loyalty',
    ],
    goals: [
      'Increase sales', 'Build online presence', 'Customer retention',
      'Expand product range', 'Local brand awareness',
    ],
    marketing: ['Facebook Shop', 'Instagram', 'Google Shopping', 'Email lists'],
  },
  automotive: {
    businesses: [
      'Quality Auto Repairs', 'Tyre & Wheel Experts', 'Auto Detailing Pro',
      'Mobile Mechanic Services', 'Car Audio Specialists', 'Panel Beaters Co',
      'Used Car Sales', 'Fleet Services', 'Roadside Assist',
    ],
    pain_points: [
      'Trust issues with customers', 'Price competition', 'Finding mechanics',
      'Managing appointments', 'Building reputation',
    ],
    goals: [
      'Increase bookings', 'Build trust', 'Expand services',
      'Better reviews', 'Fleet contracts',
    ],
    marketing: ['Google Business', 'Facebook', 'Yellow Pages', 'Word of mouth'],
  },
  home_services: {
    businesses: [
      'Sparkle Clean Services', 'Lawn Care Pros', 'Pest Control Experts',
      'Security Systems AU', 'Moving Made Easy', 'Window Washing Co',
      'Handyman Solutions', 'Carpet Cleaning Plus', 'Junk Removal Fast',
    ],
    pain_points: [
      'Seasonal demand', 'Finding reliable staff', 'Pricing transparency',
      'Building trust', 'Getting repeat business',
    ],
    goals: [
      'Consistent bookings', 'Grow service area', 'Build reviews',
      'Recurring contracts', 'Automate scheduling',
    ],
    marketing: ['Google Ads', 'Facebook', 'Hipages', 'Referrals'],
  },
  tech_services: {
    businesses: [
      'IT Support Solutions', 'Web Design Studio', 'App Development Co',
      'Cloud Services Pro', 'Cybersecurity Experts', 'Digital Marketing AU',
      'SEO Specialists', 'Tech Training Hub', 'Software Consulting',
    ],
    pain_points: [
      'Explaining value to non-tech clients', 'Scope creep', 'Pricing projects',
      'Standing out from freelancers', 'Long sales cycles',
    ],
    goals: [
      'Retainer clients', 'Higher value projects', 'Build authority',
      'Expand team', 'Niche specialization',
    ],
    marketing: ['LinkedIn', 'Content marketing', 'Referrals', 'Google Ads'],
  },
};

// ============================================
// PERSONA GENERATOR
// ============================================

function generatePersonas(count: number = 200): SMBPersona[] {
  const personas: SMBPersona[] = [];
  const personasPerIndustry = Math.ceil(count / INDUSTRIES.length);

  for (const industry of INDUSTRIES) {
    const config = INDUSTRY_CONFIG[industry];

    for (let i = 0; i < personasPerIndustry && personas.length < count; i++) {
      const businessIdx = i % config.businesses.length;
      const locationIdx = i % LOCATIONS.length;
      const employeeIdx = i % EMPLOYEE_RANGES.length;
      const revenueIdx = i % REVENUE_RANGES.length;

      personas.push({
        id: `${industry}-${String(i + 1).padStart(3, '0')}`,
        business_name: `${config.businesses[businessIdx]} ${i > config.businesses.length ? `#${Math.floor(i / config.businesses.length) + 1}` : ''}`.trim(),
        industry,
        location: LOCATIONS[locationIdx],
        employees: EMPLOYEE_RANGES[employeeIdx],
        annual_revenue: REVENUE_RANGES[revenueIdx],
        pain_points: config.pain_points.slice(0, 3),
        goals: config.goals.slice(0, 3),
        current_marketing: config.marketing.slice(0, 2),
        budget_range: `$${500 + (i * 100)}-$${1000 + (i * 200)}/month`,
        decision_maker: {
          name: `Decision Maker ${i + 1}`,
          role: i % 2 === 0 ? 'Owner' : 'Manager',
          age_range: ['35-44', '45-54', '55-64'][i % 3],
          tech_savvy: (['low', 'medium', 'high'] as const)[i % 3],
        },
      });
    }
  }

  return personas;
}

// ============================================
// TEST TYPES
// ============================================

const TEST_TYPES = [
  'brand_analysis',
  'content_generation',
  'seo_audit',
  'competitor_analysis',
  'campaign_strategy',
  'client_retention',
  'stickiness',
  'lost_direction',
  'flow',
] as const;

type TestType = typeof TEST_TYPES[number];

function getTestPrompt(testType: TestType, persona: SMBPersona): string {
  switch (testType) {
    case 'brand_analysis':
      return `Analyze the brand positioning for ${persona.business_name}, a ${persona.industry} business in ${persona.location} with ${persona.employees} employees. Their pain points are: ${persona.pain_points.join(', ')}. Their goals are: ${persona.goals.join(', ')}. Provide a brief brand analysis (2-3 sentences).`;

    case 'content_generation':
      return `Generate a compelling headline and 1-sentence value proposition for ${persona.business_name} targeting ${persona.decision_maker.role}s in the ${persona.industry} industry. Focus on addressing: ${persona.pain_points[0]}.`;

    case 'seo_audit':
      return `Provide 3 quick SEO recommendations for ${persona.business_name}, a local ${persona.industry} business in ${persona.location}. Consider their current marketing: ${persona.current_marketing.join(', ')}.`;

    case 'competitor_analysis':
      return `Identify 2 key differentiators ${persona.business_name} could leverage against larger competitors in the ${persona.industry} industry. Their budget is ${persona.budget_range}.`;

    case 'campaign_strategy':
      return `Suggest a simple 3-step marketing campaign for ${persona.business_name} to achieve: ${persona.goals[0]}. Budget: ${persona.budget_range}. Decision maker is ${persona.decision_maker.tech_savvy} tech-savvy.`;

    case 'client_retention':
      return `${persona.business_name} is a ${persona.industry} business in ${persona.location} with ${persona.employees} employees. Their current marketing includes: ${persona.current_marketing.join(', ')}. Suggest 3 specific client retention strategies to reduce churn and increase repeat business. Focus on practical tactics for a ${persona.budget_range} budget.`;

    case 'stickiness':
      return `How can ${persona.business_name} (${persona.industry}) create "stickiness" - making customers more likely to stay and less likely to switch to competitors? Consider their pain points: ${persona.pain_points.join(', ')}. Provide 2-3 specific stickiness mechanisms they could implement.`;

    case 'lost_direction':
      return `${persona.business_name} is a ${persona.industry} business that feels they've lost direction. Their original goals were: ${persona.goals.join(', ')}. Their current challenges: ${persona.pain_points.join(', ')}. Provide a brief diagnostic (2-3 sentences) identifying potential root causes and a suggested first step to regain clarity.`;

    case 'flow':
      return `Map the ideal customer flow for ${persona.business_name} (${persona.industry}) from first awareness to loyal repeat customer. Include 4-5 key touchpoints and what marketing action should happen at each stage. Their budget is ${persona.budget_range}.`;
  }
}

// ============================================
// OPENROUTER CLIENT
// ============================================

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
        {
          role: 'system',
          content: 'You are a marketing strategist helping Australian SMBs. Keep responses concise and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const latency = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

  // DeepSeek pricing: $0.14/M input, $0.28/M output
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.14;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.28;

  return {
    content: choice?.message?.content || '',
    tokens: {
      input: usage.prompt_tokens,
      output: usage.completion_tokens,
    },
    cost: inputCost + outputCost,
    latency,
  };
}

// ============================================
// MAIN HARNESS CLASS
// ============================================

export class OvernightTestHarness {
  private config: Required<HarnessConfig>;
  private personas: SMBPersona[];
  private results: TestResult[] = [];
  private startTime: Date;
  private outputDir: string;

  constructor(config: HarnessConfig) {
    this.config = {
      openrouter_api_key: config.openrouter_api_key,
      model: config.model || 'deepseek/deepseek-chat',
      max_personas: config.max_personas || 200,
      max_runtime_hours: config.max_runtime_hours || 12,
      output_dir: config.output_dir || './test-results',
      resume_from: config.resume_from || '',
      batch_size: config.batch_size || 10,
      delay_between_tests_ms: config.delay_between_tests_ms || 1000,
    };

    this.personas = generatePersonas(this.config.max_personas);
    this.startTime = new Date();
    this.outputDir = this.config.output_dir;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private saveProgress(): void {
    const progress: TestProgress = {
      started_at: this.startTime.toISOString(),
      current_persona: this.results.length,
      total_personas: this.personas.length * TEST_TYPES.length,
      completed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      skipped: 0,
      estimated_completion: this.getEstimatedCompletion(),
      current_test: this.results[this.results.length - 1]?.test_type || 'starting',
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'progress.json'),
      JSON.stringify(progress, null, 2)
    );
  }

  private getEstimatedCompletion(): string {
    const elapsed = Date.now() - this.startTime.getTime();
    const testsCompleted = this.results.length;
    const totalTests = this.personas.length * TEST_TYPES.length;

    if (testsCompleted === 0) {
return 'calculating...';
}

    const avgTimePerTest = elapsed / testsCompleted;
    const remainingTests = totalTests - testsCompleted;
    const remainingMs = avgTimePerTest * remainingTests;

    return new Date(Date.now() + remainingMs).toISOString();
  }

  private async runSingleTest(
    persona: SMBPersona,
    testType: TestType
  ): Promise<TestResult> {
    const prompt = getTestPrompt(testType, persona);
    const timestamp = new Date().toISOString();

    try {
      const result = await callOpenRouter(
        this.config.openrouter_api_key,
        prompt,
        this.config.model
      );

      return {
        persona_id: persona.id,
        test_type: testType,
        timestamp,
        duration_ms: result.latency,
        success: true,
        response: result.content,
        model_used: this.config.model,
        tokens_used: {
          input: result.tokens.input,
          output: result.tokens.output,
          total: result.tokens.input + result.tokens.output,
        },
        cost_usd: result.cost,
      };
    } catch (error) {
      return {
        persona_id: persona.id,
        test_type: testType,
        timestamp,
        duration_ms: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private generateSWOTAnalysis(): FinalReport['swot_analysis'] {
    const successRate = this.results.filter(r => r.success).length / this.results.length;
    const avgLatency = this.results.reduce((sum, r) => sum + r.duration_ms, 0) / this.results.length;
    // Total cost available: this.results.reduce((sum, r) => sum + (r.cost_usd || 0), 0)

    return {
      strengths: [
        successRate > 0.95 ? 'Excellent API reliability (>95% success rate)' : 'Good API stability',
        avgLatency < 2000 ? 'Fast response times (<2s average)' : 'Acceptable response times',
        'Comprehensive industry coverage (8 industries)',
        'Cost-effective testing with DeepSeek model',
      ],
      weaknesses: [
        successRate < 0.9 ? `Some API failures (${(1 - successRate) * 100}% failure rate)` : '',
        avgLatency > 3000 ? 'Response times could be optimized' : '',
        'Limited to English language personas',
      ].filter(Boolean),
      opportunities: [
        'Expand to international markets (UK, NZ, Canada)',
        'Add more industry verticals',
        'Implement A/B testing for prompts',
        'Create industry-specific model fine-tuning',
      ],
      threats: [
        'API rate limiting under heavy load',
        'Cost increases from model providers',
        'Competitor platforms with similar offerings',
      ],
    };
  }

  private generateRecommendations(): string[] {
    const industryResults: Record<string, { passed: number; failed: number }> = {};

    for (const result of this.results) {
      const industry = result.persona_id.split('-')[0];
      if (!industryResults[industry]) {
        industryResults[industry] = { passed: 0, failed: 0 };
      }
      if (result.success) {
        industryResults[industry].passed++;
      } else {
        industryResults[industry].failed++;
      }
    }

    const recommendations: string[] = [];

    // Find struggling industries
    for (const [industry, stats] of Object.entries(industryResults)) {
      const rate = stats.passed / (stats.passed + stats.failed);
      if (rate < 0.9) {
        recommendations.push(`Review prompts for ${industry} industry - ${Math.round(rate * 100)}% success rate`);
      }
    }

    // General recommendations
    recommendations.push(
      'Consider caching common responses to reduce API costs',
      'Implement progressive complexity in test prompts',
      'Add sentiment analysis to response quality checks'
    );

    return recommendations;
  }

  private generateFinalReport(): FinalReport {
    const completedAt = new Date();
    const durationHours = (completedAt.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);

    const industryBreakdown: Record<string, { passed: number; failed: number }> = {};
    for (const result of this.results) {
      const industry = result.persona_id.split('-')[0];
      if (!industryBreakdown[industry]) {
        industryBreakdown[industry] = { passed: 0, failed: 0 };
      }
      if (result.success) {
        industryBreakdown[industry].passed++;
      } else {
        industryBreakdown[industry].failed++;
      }
    }

    return {
      run_id: `overnight-${this.startTime.toISOString().split('T')[0]}`,
      started_at: this.startTime.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_hours: Math.round(durationHours * 100) / 100,
      total_personas: this.personas.length,
      total_tests: this.results.length,
      passed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      success_rate: Math.round((this.results.filter(r => r.success).length / this.results.length) * 10000) / 100,
      total_cost_usd: Math.round(this.results.reduce((sum, r) => sum + (r.cost_usd || 0), 0) * 10000) / 10000,
      average_response_time_ms: Math.round(this.results.reduce((sum, r) => sum + r.duration_ms, 0) / this.results.length),
      industry_breakdown: industryBreakdown,
      swot_analysis: this.generateSWOTAnalysis(),
      recommendations: this.generateRecommendations(),
    };
  }

  async run(): Promise<FinalReport> {
    console.log('🌙 Starting Synthex Overnight Test Harness');
    console.log(`📊 Testing ${this.personas.length} personas across ${INDUSTRIES.length} industries`);
    console.log(`🤖 Model: ${this.config.model}`);
    console.log(`⏱️  Max runtime: ${this.config.max_runtime_hours} hours`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log('');

    const maxRuntime = this.config.max_runtime_hours * 60 * 60 * 1000; // Convert to ms

    for (const persona of this.personas) {
      // Check runtime limit
      if (Date.now() - this.startTime.getTime() > maxRuntime) {
        console.log('⏰ Maximum runtime reached. Stopping tests.');
        break;
      }

      console.log(`\n👤 Testing persona: ${persona.business_name} (${persona.industry})`);

      for (const testType of TEST_TYPES) {
        console.log(`  📝 Running ${testType}...`);

        const result = await this.runSingleTest(persona, testType);
        this.results.push(result);

        if (result.success) {
          console.log(`  ✅ Passed (${result.duration_ms}ms, $${result.cost_usd?.toFixed(6)})`);
        } else {
          console.log(`  ❌ Failed: ${result.error}`);
        }

        // Save progress after each test
        this.saveProgress();

        // Delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, this.config.delay_between_tests_ms));
      }
    }

    // Generate and save final report
    const report = this.generateFinalReport();

    fs.writeFileSync(
      path.join(this.outputDir, 'final-report.json'),
      JSON.stringify(report, null, 2)
    );

    fs.writeFileSync(
      path.join(this.outputDir, 'all-results.json'),
      JSON.stringify(this.results, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log('🎉 OVERNIGHT TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total tests: ${report.total_tests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`📈 Success rate: ${report.success_rate}%`);
    console.log(`💰 Total cost: $${report.total_cost_usd}`);
    console.log(`⏱️  Duration: ${report.duration_hours} hours`);
    console.log(`📁 Report saved to: ${this.outputDir}/final-report.json`);

    return report;
  }
}

// ============================================
// EXPORTS
// ============================================

export { generatePersonas, TEST_TYPES, INDUSTRIES };
