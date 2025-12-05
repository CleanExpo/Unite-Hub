#!/usr/bin/env node
// scripts/run-overnight-tests.mjs
// CLI Runner for Synthex Overnight Test Harness

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env.local') });

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  openrouter_api_key: process.env.OPENROUTER_API_KEY,
  model: process.env.OVERNIGHT_MODEL || 'deepseek/deepseek-chat',
  max_personas: parseInt(process.env.OVERNIGHT_PERSONAS || '200', 10),
  max_runtime_hours: parseInt(process.env.OVERNIGHT_HOURS || '12', 10),
  output_dir: process.env.OVERNIGHT_OUTPUT || path.join(projectRoot, 'test-results', `run-${Date.now()}`),
  batch_size: parseInt(process.env.OVERNIGHT_BATCH_SIZE || '10', 10),
  delay_between_tests_ms: parseInt(process.env.OVERNIGHT_DELAY_MS || '1000', 10),
};

// ============================================
// INDUSTRY PRESETS (8 Industries, 25 each = 200 total)
// ============================================

const INDUSTRIES = [
  'trades',
  'professional',
  'health',
  'hospitality',
  'retail',
  'automotive',
  'home_services',
  'tech_services',
];

const LOCATIONS = [
  'Sydney, NSW', 'Melbourne, VIC', 'Brisbane, QLD', 'Perth, WA', 'Adelaide, SA',
  'Gold Coast, QLD', 'Newcastle, NSW', 'Canberra, ACT', 'Sunshine Coast, QLD', 'Wollongong, NSW',
];

const EMPLOYEE_RANGES = [1, 2, 3, 5, 10, 15, 20, 30, 50];
const REVENUE_RANGES = ['$50K-$100K', '$100K-$250K', '$250K-$500K', '$500K-$1M', '$1M-$2.5M', '$2.5M-$5M', '$5M-$10M'];

const INDUSTRY_CONFIG = {
  trades: {
    businesses: ['Reliable Plumbing Co', 'Spark Electric Services', 'Cool Air HVAC', 'Pro Carpentry Solutions', 'Master Painters AU', 'Tiling Experts', 'Roofing Specialists', 'Landscape Masters', 'Building Renovations', 'Solar Installation Pros', 'Pool Builders Elite', 'Concreting Solutions'],
    pain_points: ['Finding quality leads', 'Managing job scheduling', 'Quote follow-ups', 'Getting online reviews', 'Competing with bigger companies'],
    goals: ['More consistent work', 'Higher margin jobs', 'Better customer reviews', 'Reduce admin time', 'Expand service area'],
    marketing: ['Word of mouth', 'Facebook page', 'Google Business', 'Yellow Pages'],
  },
  professional: {
    businesses: ['Smith & Partners Accounting', 'Legal Eagles Law', 'Financial Planning Plus', 'Tax Solutions AU', 'Business Consulting Group', 'HR Advisory Services', 'Mortgage Brokers Direct', 'Insurance Advisors', 'Wealth Management Co'],
    pain_points: ['Client retention', 'Compliance updates', 'Lead generation', 'Differentiating from competitors', 'Online presence'],
    goals: ['Grow client base', 'Increase referrals', 'Automate admin', 'Build authority', 'Expand services'],
    marketing: ['Referrals', 'LinkedIn', 'Professional networks', 'Seminars'],
  },
  health: {
    businesses: ['Smile Dental Clinic', 'PhysioFit Studios', 'Mind Wellness Psychology', 'Chiro Care Centre', 'Optometry Plus', 'Skin Health Clinic', 'Podiatry Experts', 'Speech Therapy Hub', 'Nutrition Consulting'],
    pain_points: ['No-show appointments', 'Patient retention', 'Managing reviews', 'AHPRA compliance', 'Standing out locally'],
    goals: ['Fill appointment book', 'Reduce no-shows', 'Build reputation', 'Attract new patients', 'Expand services'],
    marketing: ['Google My Business', 'Facebook', 'Local directories', 'Referrals'],
  },
  hospitality: {
    businesses: ['Cafe Delights', 'The Local Pub', 'Fine Dining Experience', 'Quick Bites Takeaway', 'Event Catering Co', 'Bakery Fresh', 'Coffee House Central', 'Thai Kitchen', 'Pizza Palace'],
    pain_points: ['Seasonal fluctuations', 'Staff retention', 'Online ordering', 'Review management', 'Standing out from chains'],
    goals: ['Increase covers', 'Build loyal customers', 'Grow delivery sales', 'Event bookings', 'Social media presence'],
    marketing: ['Instagram', 'Google Maps', 'UberEats', 'Local guides'],
  },
  retail: {
    businesses: ['Fashion Forward Boutique', 'Home Decor Plus', 'Pet Supplies Direct', 'Sports Gear Outlet', 'Electronics Hub', 'Gift Shop Central', 'Toy World Express', 'Beauty Products Store', 'Garden Supplies'],
    pain_points: ['Online competition', 'Inventory management', 'Foot traffic', 'Seasonal sales', 'Customer loyalty'],
    goals: ['Increase sales', 'Build online presence', 'Customer retention', 'Expand product range', 'Local brand awareness'],
    marketing: ['Facebook Shop', 'Instagram', 'Google Shopping', 'Email lists'],
  },
  automotive: {
    businesses: ['Quality Auto Repairs', 'Tyre & Wheel Experts', 'Auto Detailing Pro', 'Mobile Mechanic Services', 'Car Audio Specialists', 'Panel Beaters Co', 'Used Car Sales', 'Fleet Services', 'Roadside Assist'],
    pain_points: ['Trust issues with customers', 'Price competition', 'Finding mechanics', 'Managing appointments', 'Building reputation'],
    goals: ['Increase bookings', 'Build trust', 'Expand services', 'Better reviews', 'Fleet contracts'],
    marketing: ['Google Business', 'Facebook', 'Yellow Pages', 'Word of mouth'],
  },
  home_services: {
    businesses: ['Sparkle Clean Services', 'Lawn Care Pros', 'Pest Control Experts', 'Security Systems AU', 'Moving Made Easy', 'Window Washing Co', 'Handyman Solutions', 'Carpet Cleaning Plus', 'Junk Removal Fast'],
    pain_points: ['Seasonal demand', 'Finding reliable staff', 'Pricing transparency', 'Building trust', 'Getting repeat business'],
    goals: ['Consistent bookings', 'Grow service area', 'Build reviews', 'Recurring contracts', 'Automate scheduling'],
    marketing: ['Google Ads', 'Facebook', 'Hipages', 'Referrals'],
  },
  tech_services: {
    businesses: ['IT Support Solutions', 'Web Design Studio', 'App Development Co', 'Cloud Services Pro', 'Cybersecurity Experts', 'Digital Marketing AU', 'SEO Specialists', 'Tech Training Hub', 'Software Consulting'],
    pain_points: ['Explaining value to non-tech clients', 'Scope creep', 'Pricing projects', 'Standing out from freelancers', 'Long sales cycles'],
    goals: ['Retainer clients', 'Higher value projects', 'Build authority', 'Expand team', 'Niche specialization'],
    marketing: ['LinkedIn', 'Content marketing', 'Referrals', 'Google Ads'],
  },
};

const TEST_TYPES = ['brand_analysis', 'content_generation', 'seo_audit', 'competitor_analysis', 'campaign_strategy', 'client_retention', 'stickiness', 'lost_direction', 'flow'];

// ============================================
// HELPERS
// ============================================

function generatePersonas(count = 200) {
  const personas = [];
  const personasPerIndustry = Math.ceil(count / INDUSTRIES.length);

  for (const industry of INDUSTRIES) {
    const config = INDUSTRY_CONFIG[industry];
    for (let i = 0; i < personasPerIndustry && personas.length < count; i++) {
      personas.push({
        id: `${industry}-${String(i + 1).padStart(3, '0')}`,
        business_name: `${config.businesses[i % config.businesses.length]}${i >= config.businesses.length ? ` #${Math.floor(i / config.businesses.length) + 1}` : ''}`,
        industry,
        location: LOCATIONS[i % LOCATIONS.length],
        employees: EMPLOYEE_RANGES[i % EMPLOYEE_RANGES.length],
        annual_revenue: REVENUE_RANGES[i % REVENUE_RANGES.length],
        pain_points: config.pain_points.slice(0, 3),
        goals: config.goals.slice(0, 3),
        current_marketing: config.marketing.slice(0, 2),
        budget_range: `$${500 + (i * 100)}-$${1000 + (i * 200)}/month`,
        decision_maker: {
          name: `Decision Maker ${i + 1}`,
          role: i % 2 === 0 ? 'Owner' : 'Manager',
          age_range: ['35-44', '45-54', '55-64'][i % 3],
          tech_savvy: ['low', 'medium', 'high'][i % 3],
        },
      });
    }
  }
  return personas;
}

function getTestPrompt(testType, persona) {
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
    default:
      return `Help ${persona.business_name} with their ${testType} needs.`;
  }
}

async function callOpenRouter(apiKey, prompt, model = 'deepseek/deepseek-chat') {
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
        { role: 'system', content: 'You are a marketing strategist helping Australian SMBs. Keep responses concise and actionable.' },
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
    tokens: { input: usage.prompt_tokens, output: usage.completion_tokens },
    cost: inputCost + outputCost,
    latency,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  SYNTHEX OVERNIGHT TEST HARNESS');
  console.log('  200-Persona SMB Testing System');
  console.log('='.repeat(60));
  console.log('');

  // Validate API key
  if (!CONFIG.openrouter_api_key) {
    console.error('ERROR: OPENROUTER_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`Model: ${CONFIG.model}`);
  console.log(`Personas: ${CONFIG.max_personas}`);
  console.log(`Max Runtime: ${CONFIG.max_runtime_hours} hours`);
  console.log(`Output: ${CONFIG.output_dir}`);
  console.log('');

  // Create output directory
  fs.mkdirSync(CONFIG.output_dir, { recursive: true });

  const personas = generatePersonas(CONFIG.max_personas);
  const startTime = Date.now();
  const maxRuntime = CONFIG.max_runtime_hours * 60 * 60 * 1000;
  const results = [];

  console.log(`Generated ${personas.length} personas across ${INDUSTRIES.length} industries`);
  console.log(`Total tests: ${personas.length * TEST_TYPES.length}`);
  console.log('');
  console.log('Starting tests...');
  console.log('');

  let testCount = 0;
  const totalTests = personas.length * TEST_TYPES.length;

  for (const persona of personas) {
    // Check runtime limit
    if (Date.now() - startTime > maxRuntime) {
      console.log('');
      console.log('Maximum runtime reached. Stopping tests.');
      break;
    }

    console.log(`\n[${Math.floor((testCount / totalTests) * 100)}%] ${persona.business_name} (${persona.industry})`);

    for (const testType of TEST_TYPES) {
      testCount++;
      const prompt = getTestPrompt(testType, persona);

      try {
        const result = await callOpenRouter(CONFIG.openrouter_api_key, prompt, CONFIG.model);

        results.push({
          persona_id: persona.id,
          test_type: testType,
          timestamp: new Date().toISOString(),
          duration_ms: result.latency,
          success: true,
          response: result.content,
          model_used: CONFIG.model,
          tokens_used: { input: result.tokens.input, output: result.tokens.output, total: result.tokens.input + result.tokens.output },
          cost_usd: result.cost,
        });

        console.log(`  [OK] ${testType} (${result.latency}ms, $${result.cost.toFixed(6)})`);
      } catch (error) {
        results.push({
          persona_id: persona.id,
          test_type: testType,
          timestamp: new Date().toISOString(),
          duration_ms: 0,
          success: false,
          error: error.message,
        });

        console.log(`  [FAIL] ${testType}: ${error.message}`);
      }

      // Save progress every 10 tests
      if (testCount % 10 === 0) {
        fs.writeFileSync(
          path.join(CONFIG.output_dir, 'progress.json'),
          JSON.stringify({
            started_at: new Date(startTime).toISOString(),
            current_test: testCount,
            total_tests: totalTests,
            completed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            percent_complete: Math.round((testCount / totalTests) * 100),
          }, null, 2)
        );
      }

      await sleep(CONFIG.delay_between_tests_ms);
    }
  }

  // Generate final report
  const endTime = Date.now();
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  const industryBreakdown = {};
  for (const result of results) {
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

  const successRate = results.filter(r => r.success).length / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;
  const totalCost = results.reduce((sum, r) => sum + (r.cost_usd || 0), 0);

  const finalReport = {
    run_id: `overnight-${new Date(startTime).toISOString().split('T')[0]}`,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_hours: Math.round(durationHours * 100) / 100,
    total_personas: personas.length,
    total_tests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    success_rate: Math.round(successRate * 10000) / 100,
    total_cost_usd: Math.round(totalCost * 10000) / 10000,
    average_response_time_ms: Math.round(avgLatency),
    industry_breakdown: industryBreakdown,
    swot_analysis: {
      strengths: [
        successRate > 0.95 ? 'Excellent API reliability (>95% success rate)' : 'Good API stability',
        avgLatency < 2000 ? 'Fast response times (<2s average)' : 'Acceptable response times',
        'Comprehensive industry coverage (8 industries)',
        'Cost-effective testing with DeepSeek model',
      ],
      weaknesses: [
        successRate < 0.9 ? `Some API failures (${Math.round((1 - successRate) * 100)}% failure rate)` : null,
        avgLatency > 3000 ? 'Response times could be optimized' : null,
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
    },
    recommendations: [
      'Consider caching common responses to reduce API costs',
      'Implement progressive complexity in test prompts',
      'Add sentiment analysis to response quality checks',
    ],
  };

  // Save results
  fs.writeFileSync(path.join(CONFIG.output_dir, 'final-report.json'), JSON.stringify(finalReport, null, 2));
  fs.writeFileSync(path.join(CONFIG.output_dir, 'all-results.json'), JSON.stringify(results, null, 2));

  // Print summary
  console.log('');
  console.log('='.repeat(60));
  console.log('  OVERNIGHT TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total Tests:    ${finalReport.total_tests}`);
  console.log(`Passed:         ${finalReport.passed}`);
  console.log(`Failed:         ${finalReport.failed}`);
  console.log(`Success Rate:   ${finalReport.success_rate}%`);
  console.log(`Total Cost:     $${finalReport.total_cost_usd}`);
  console.log(`Duration:       ${finalReport.duration_hours} hours`);
  console.log(`Avg Latency:    ${finalReport.average_response_time_ms}ms`);
  console.log('');
  console.log(`Report saved to: ${CONFIG.output_dir}/final-report.json`);
  console.log('');

  // Print SWOT summary
  console.log('SWOT Analysis:');
  console.log('  Strengths:', finalReport.swot_analysis.strengths.slice(0, 2).join('; '));
  console.log('  Weaknesses:', finalReport.swot_analysis.weaknesses.slice(0, 2).join('; ') || 'None significant');
  console.log('');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
