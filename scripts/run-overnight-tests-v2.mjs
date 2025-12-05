#!/usr/bin/env node
// scripts/run-overnight-tests-v2.mjs
// Synthex Overnight Test Harness V2 - With Framework Integration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env.local') });

// Load Synthex config
const configPath = path.join(projectRoot, 'src/lib/content/synthex-config.json');
const SYNTHEX_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  openrouter_api_key: process.env.OPENROUTER_API_KEY,
  model: process.env.OVERNIGHT_MODEL || 'deepseek/deepseek-chat',
  max_personas: parseInt(process.env.OVERNIGHT_PERSONAS || '200', 10),
  max_runtime_hours: parseInt(process.env.OVERNIGHT_HOURS || '12', 10),
  output_dir: process.env.OVERNIGHT_OUTPUT || path.join(projectRoot, 'test-results', `v2-run-${Date.now()}`),
  delay_between_tests_ms: parseInt(process.env.OVERNIGHT_DELAY_MS || '1000', 10),
};

// ============================================
// INDUSTRIES & PERSONAS
// ============================================

const INDUSTRIES = ['trades', 'professional', 'health', 'hospitality', 'retail', 'automotive', 'home_services', 'tech_services'];
const LOCATIONS = ['Sydney, NSW', 'Melbourne, VIC', 'Brisbane, QLD', 'Perth, WA', 'Adelaide, SA', 'Gold Coast, QLD', 'Newcastle, NSW'];

const INDUSTRY_BUSINESSES = {
  trades: ['Reliable Plumbing Co', 'Spark Electric Services', 'Cool Air HVAC', 'Pro Carpentry', 'Master Painters'],
  professional: ['Smith & Partners Accounting', 'Legal Eagles Law', 'Financial Planning Plus', 'Tax Solutions AU'],
  health: ['Smile Dental Clinic', 'PhysioFit Studios', 'Mind Wellness Psychology', 'Chiro Care Centre'],
  hospitality: ['Cafe Delights', 'The Local Pub', 'Fine Dining Experience', 'Quick Bites Takeaway'],
  retail: ['Fashion Forward Boutique', 'Home Decor Plus', 'Pet Supplies Direct', 'Sports Gear Outlet'],
  automotive: ['Quality Auto Repairs', 'Tyre & Wheel Experts', 'Auto Detailing Pro', 'Mobile Mechanic'],
  home_services: ['Sparkle Clean Services', 'Lawn Care Pros', 'Pest Control Experts', 'Security Systems AU'],
  tech_services: ['IT Support Solutions', 'Web Design Studio', 'App Development Co', 'Cloud Services Pro'],
};

const INDUSTRY_CONTEXT = {
  trades: { pain: ['Finding quality leads', 'Managing scheduling'], goals: ['Consistent work', 'Higher margins'] },
  professional: { pain: ['Client retention', 'Lead generation'], goals: ['Grow client base', 'Build authority'] },
  health: { pain: ['No-shows', 'Patient retention'], goals: ['Fill appointments', 'Build reputation'] },
  hospitality: { pain: ['Seasonal fluctuations', 'Reviews'], goals: ['Increase covers', 'Build loyalty'] },
  retail: { pain: ['Online competition', 'Foot traffic'], goals: ['Increase sales', 'Customer retention'] },
  automotive: { pain: ['Customer trust', 'Competition'], goals: ['More bookings', 'Better reviews'] },
  home_services: { pain: ['Seasonal demand', 'Getting repeat business'], goals: ['Consistent bookings', 'Recurring contracts'] },
  tech_services: { pain: ['Explaining value', 'Long sales cycles'], goals: ['Retainer clients', 'Higher value projects'] },
};

// ============================================
// V2 TEST TYPES - Framework-based
// ============================================

const TEST_TYPES = [
  'hero_headline',      // StoryBrand + 4U formula
  'problem_section',    // PAS framework
  'features_section',   // FAB framework
  'cta_section',        // PAS + Loss Aversion
  'seo_recommendations',
  'campaign_strategy',
  'client_retention',
  'stickiness',
  'customer_flow',
];

// ============================================
// FRAMEWORK-DRIVEN PROMPTS
// ============================================

function getFrameworkPrompt(testType, persona) {
  const voice = SYNTHEX_CONFIG.voice.industry_adaptation[persona.industry] || {};
  const frameworks = SYNTHEX_CONFIG.copywriting.frameworks;

  const locationCity = persona.location.split(',')[0];
  const baseRules = `
BRAND VOICE:
- Tone: ${voice.tone || 'Professional and helpful'}
- Example: "${voice.example || 'You do the work. We bring the customers.'}"

CRITICAL REQUIREMENTS (MUST follow):
1. MENTION "${locationCity}" or "Australia" explicitly in the content
2. Use "you" or "your" at least 3 times (customer is the hero)
3. NEVER use these words: AI-powered, revolutionary, cutting-edge, game-changing, synergy, leverage, disrupt, tailored, paradigm, ecosystem
4. Include at least one specific number (e.g., "5 new leads", "30 days", "200+ clients")
5. CTA must be "Start Free Trial" NOT "Book a Call" or "Schedule"
6. Australian English (colour, organisation, centre)

PERSPECTIVE: Write TO the ${persona.industry} business owner. NEVER say "we help you" or "our team" - speak as their guide, not salesperson.

WORDS TO USE: ${SYNTHEX_CONFIG.voice.vocabulary.use.slice(0, 6).join(', ')}
`;

  switch (testType) {
    case 'hero_headline':
      return `Generate a HERO section for ${persona.business_name} (${persona.industry}, ${persona.location}).

FRAMEWORK: StoryBrand - Customer as hero, brand as guide
HEADLINE FORMULA: Useful + Urgent + Unique + Ultra-specific

Pain points: ${persona.pain_points.join(', ')}
Goals: ${persona.goals.join(', ')}

${baseRules}

OUTPUT FORMAT:
HEADLINE: [10 words max, bold claim with specific number/timeframe]
SUBHEADLINE: [20 words max, expand the benefit]
CTA: [3-4 words, action-oriented]

Example headline style: "Get 3X More Leads in 30 Days Without Spending More on Ads"`;

    case 'problem_section':
      return `Generate a PROBLEM section for ${persona.business_name} using PAS framework.

FRAMEWORK: Problem-Agitate-Solve
${frameworks.pas.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Business: ${persona.business_name} (${persona.industry}, ${persona.location})
Pain points: ${persona.pain_points.join(', ')}

${baseRules}

OUTPUT FORMAT:
PROBLEM: [State the pain clearly - 1 sentence]
AGITATE: [Make it feel urgent - 2 sentences]
BRIDGE: [Transition to solution - 1 sentence]

Make the reader nod and think "that's exactly my problem"`;

    case 'features_section':
      return `Generate 3 FEATURES for ${persona.business_name} using FAB framework.

FRAMEWORK: Features-Advantages-Benefits
${frameworks.fab.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Business: ${persona.business_name} (${persona.industry}, ${persona.location})
Goals: ${persona.goals.join(', ')}

${baseRules}

OUTPUT FORMAT (for each of 3 features):
FEATURE: [2-4 words, what it is]
ADVANTAGE: [What it does]
BENEFIT: [Why it matters to THEM - use "you"]

Focus on outcomes, not technology.`;

    case 'cta_section':
      return `Generate a CTA section for ${persona.business_name} using Loss Aversion psychology.

PSYCHOLOGY: Loss Aversion - Fear of missing out > desire to gain

Business: ${persona.business_name} (${persona.industry}, ${persona.location})
Goals: ${persona.goals.join(', ')}

${baseRules}

SYNTHEX RULES:
- Primary CTA: "Start Free Trial" (NOT "Book a Call")
- Trust signal: "200+ Australian SMBs"
- Risk reducer: "Cancel anytime, no contracts"

OUTPUT FORMAT:
HEADLINE: [Urgency + benefit]
SUBTEXT: [Address final objection]
PRIMARY_CTA: Start Free Trial
SUPPORT_TEXT: [Reduce risk]

Frame what they LOSE by not acting.`;

    case 'seo_recommendations':
      return `Provide 3 specific SEO actions for ${persona.business_name} in ${persona.location}.

Industry: ${persona.industry}
Current situation: Small business wanting more local visibility

${baseRules}

OUTPUT FORMAT (for each of 3 recommendations):
ACTION: [Specific thing to do THIS WEEK]
KEYWORD: [Example ${persona.location}-focused keyword]
EFFORT: [Hours estimate]
IMPACT: [Expected result]

Focus on local SEO for Australian SMBs.`;

    case 'campaign_strategy':
      return `Create a 3-step marketing campaign for ${persona.business_name}.

Business: ${persona.industry} in ${persona.location}
Goal: ${persona.goals[0]}
Budget: $500-$1000/month

${baseRules}

OUTPUT FORMAT:
STEP 1: [Action] | Cost: $X | Result: [Expected outcome]
STEP 2: [Action] | Cost: $X | Result: [Expected outcome]
STEP 3: [Action] | Cost: $X | Result: [Expected outcome]

Keep it SIMPLE. Focus on what works locally.`;

    case 'client_retention':
      return `Provide 3 client retention tactics for ${persona.business_name}.

Business: ${persona.industry} in ${persona.location}
Challenge: ${persona.pain_points[0]}

${baseRules}

OUTPUT FORMAT:
TACTIC 1: [Name] - How it works - Setup cost - Expected impact
TACTIC 2: [Name] - How it works - Setup cost - Expected impact
TACTIC 3: [Name] - How it works - Setup cost - Expected impact

Make these practical for a small ${persona.industry} business.`;

    case 'stickiness':
      return `Describe 2 "stickiness mechanisms" for ${persona.business_name}.

Business: ${persona.industry} in ${persona.location}
Pain points: ${persona.pain_points.join(', ')}

${baseRules}

OUTPUT FORMAT:
MECHANISM 1: [Name]
- What it is
- Why it makes switching hard
- Implementation cost

MECHANISM 2: [Name]
- What it is
- Why it makes switching hard
- Implementation cost

Create switching costs that benefit both business and customer.`;

    case 'customer_flow':
      return `Map the customer journey for ${persona.business_name} (${persona.industry}).

Location: ${persona.location}
Budget: $500-$1000/month

${baseRules}

OUTPUT FORMAT:
AWARENESS: [Customer mindset] → [Touchpoint] → [Action]
INTEREST: [Customer mindset] → [Touchpoint] → [Action]
DECISION: [Customer mindset] → [Touchpoint] → [Action]
PURCHASE: [Customer mindset] → [Touchpoint] → [Action]
LOYALTY: [Customer mindset] → [Touchpoint] → [Action]

Make this practical for a small business.`;

    default:
      return `Help ${persona.business_name} with ${testType}.`;
  }
}

// ============================================
// CONTENT SCORER
// ============================================

function scoreContent(response, persona, testType) {
  const checks = [];
  let score = 100;

  // Check for banned words
  const bannedWords = SYNTHEX_CONFIG.voice.vocabulary.avoid;
  for (const word of bannedWords) {
    if (response.toLowerCase().includes(word.toLowerCase())) {
      checks.push({ check: `Contains "${word}"`, passed: false });
      score -= 5;
    }
  }

  // Check for "you" language (require 3+ for excellent quality)
  const youCount = (response.match(/\byou\b|\byour\b/gi) || []).length;
  checks.push({ check: 'Uses "you" language', passed: youCount >= 3 });
  if (youCount < 3) score -= 10;

  // Check for Australian context
  const hasAusContext = response.toLowerCase().includes('australia') ||
                        response.toLowerCase().includes(persona.location.split(',')[0].toLowerCase());
  checks.push({ check: 'Has local context', passed: hasAusContext });
  if (!hasAusContext) score -= 10;

  // Check for specific numbers
  const hasNumbers = /\d+/.test(response);
  checks.push({ check: 'Uses specific numbers', passed: hasNumbers });
  if (!hasNumbers) score -= 5;

  // Check for wrong perspective (selling Synthex TO business)
  const wrongPerspective = response.toLowerCase().includes('we connect you') ||
                           response.toLowerCase().includes('we help you') ||
                           response.toLowerCase().includes('our team');
  checks.push({ check: 'Correct perspective', passed: !wrongPerspective });
  if (wrongPerspective) score -= 15;

  // Check for phone/call CTAs (not allowed for Synthex)
  const hasPhoneCTA = response.toLowerCase().includes('call us') ||
                      response.toLowerCase().includes('book a call');
  checks.push({ check: 'No phone CTAs', passed: !hasPhoneCTA });
  if (hasPhoneCTA) score -= 10;

  // Check for wrong CTAs (must be "Start Free Trial")
  const hasWrongCTA = (response.toLowerCase().includes('book a free') ||
                       response.toLowerCase().includes('schedule')) &&
                      !response.toLowerCase().includes('start free trial');
  checks.push({ check: 'Correct CTA', passed: !hasWrongCTA });
  if (hasWrongCTA) score -= 10;

  return { score: Math.max(0, score), checks };
}

// ============================================
// PERSONA GENERATOR
// ============================================

function generatePersonas(count = 200) {
  const personas = [];
  const personasPerIndustry = Math.ceil(count / INDUSTRIES.length);

  for (const industry of INDUSTRIES) {
    const businesses = INDUSTRY_BUSINESSES[industry];
    const context = INDUSTRY_CONTEXT[industry];

    for (let i = 0; i < personasPerIndustry && personas.length < count; i++) {
      personas.push({
        id: `${industry}-${String(i + 1).padStart(3, '0')}`,
        business_name: businesses[i % businesses.length] + (i >= businesses.length ? ` #${Math.floor(i / businesses.length) + 1}` : ''),
        industry,
        location: LOCATIONS[i % LOCATIONS.length],
        pain_points: context.pain,
        goals: context.goals,
      });
    }
  }
  return personas;
}

// ============================================
// OPENROUTER API
// ============================================

async function callOpenRouter(apiKey, prompt, model = 'deepseek/deepseek-chat') {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://synthex.com.au',
      'X-Title': 'Synthex V2 Tests',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `You are an expert marketing copywriter for Australian SMBs. CRITICAL RULES - FAILURE TO FOLLOW = REJECTED:
1. ALWAYS mention the specific city name (Sydney, Melbourne, Brisbane, etc.) or "Australia" in your content
2. ALWAYS use "you" and "your" AT LEAST 4 TIMES - the customer is the HERO
3. **BANNED WORDS - NEVER USE THESE EXACT WORDS**: AI-powered, revolutionary, cutting-edge, disrupt, synergy, leverage, TAILORED, game-changing, paradigm, ecosystem. Use "personalised" instead of "tailored".
4. ALWAYS include at least one specific number
5. CTA must be "Start Free Trial" - NEVER "Book a Call" or "Schedule"
6. NEVER say "we help you" or "our team" - write as their GUIDE, not a salesperson
Follow the frameworks and output format exactly.` },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  const latency = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.14;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.28;

  return {
    content: data.choices?.[0]?.message?.content || '',
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
  console.log('  SYNTHEX OVERNIGHT TEST HARNESS V2');
  console.log('  Framework-Driven Content Testing');
  console.log('='.repeat(60));
  console.log('');

  if (!CONFIG.openrouter_api_key) {
    console.error('ERROR: OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  console.log(`Model: ${CONFIG.model}`);
  console.log(`Personas: ${CONFIG.max_personas}`);
  console.log(`Test Types: ${TEST_TYPES.length}`);
  console.log(`Max Runtime: ${CONFIG.max_runtime_hours} hours`);
  console.log(`Output: ${CONFIG.output_dir}`);
  console.log('');

  fs.mkdirSync(CONFIG.output_dir, { recursive: true });

  const personas = generatePersonas(CONFIG.max_personas);
  const startTime = Date.now();
  const maxRuntime = CONFIG.max_runtime_hours * 60 * 60 * 1000;
  const results = [];
  const qualityScores = [];

  console.log(`Generated ${personas.length} personas`);
  console.log(`Total tests: ${personas.length * TEST_TYPES.length}`);
  console.log('');

  let testCount = 0;
  const totalTests = personas.length * TEST_TYPES.length;

  for (const persona of personas) {
    if (Date.now() - startTime > maxRuntime) {
      console.log('\nMax runtime reached. Stopping.');
      break;
    }

    console.log(`\n[${Math.floor((testCount / totalTests) * 100)}%] ${persona.business_name} (${persona.industry})`);

    for (const testType of TEST_TYPES) {
      testCount++;
      const prompt = getFrameworkPrompt(testType, persona);

      try {
        const result = await callOpenRouter(CONFIG.openrouter_api_key, prompt, CONFIG.model);
        const quality = scoreContent(result.content, persona, testType);

        results.push({
          persona_id: persona.id,
          test_type: testType,
          timestamp: new Date().toISOString(),
          duration_ms: result.latency,
          success: true,
          response: result.content,
          quality_score: quality.score,
          quality_checks: quality.checks,
          tokens: result.tokens,
          cost_usd: result.cost,
        });

        qualityScores.push(quality.score);

        const scoreEmoji = quality.score >= 80 ? '✓' : quality.score >= 60 ? '~' : '✗';
        console.log(`  [${scoreEmoji}] ${testType} (${result.latency}ms, score:${quality.score})`);
      } catch (error) {
        results.push({
          persona_id: persona.id,
          test_type: testType,
          timestamp: new Date().toISOString(),
          duration_ms: 0,
          success: false,
          error: error.message,
          quality_score: 0,
        });
        console.log(`  [FAIL] ${testType}: ${error.message}`);
      }

      if (testCount % 20 === 0) {
        fs.writeFileSync(
          path.join(CONFIG.output_dir, 'progress.json'),
          JSON.stringify({
            current: testCount,
            total: totalTests,
            percent: Math.round((testCount / totalTests) * 100),
            avg_quality: Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length),
          }, null, 2)
        );
      }

      await sleep(CONFIG.delay_between_tests_ms);
    }
  }

  // Final report
  const endTime = Date.now();
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  const avgQuality = Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length);

  const report = {
    version: 'v2',
    run_id: `v2-overnight-${new Date(startTime).toISOString().split('T')[0]}`,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_hours: Math.round(durationHours * 100) / 100,
    total_tests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    success_rate: Math.round((results.filter(r => r.success).length / results.length) * 100),
    avg_quality_score: avgQuality,
    quality_distribution: {
      excellent: qualityScores.filter(s => s >= 85).length,
      good: qualityScores.filter(s => s >= 70 && s < 85).length,
      needs_work: qualityScores.filter(s => s < 70).length,
    },
    total_cost_usd: Math.round(results.reduce((sum, r) => sum + (r.cost_usd || 0), 0) * 10000) / 10000,
    frameworks_used: ['StoryBrand', 'PAS', 'FAB', 'AIDA', '4Ps'],
    improvements_vs_v1: [
      'Framework-driven prompts',
      'Real-time quality scoring',
      'Banned word detection',
      'Perspective checking',
      'Australian context validation',
    ],
  };

  fs.writeFileSync(path.join(CONFIG.output_dir, 'final-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(CONFIG.output_dir, 'all-results.json'), JSON.stringify(results, null, 2));

  console.log('');
  console.log('='.repeat(60));
  console.log('  V2 OVERNIGHT TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total Tests:      ${report.total_tests}`);
  console.log(`Passed:           ${report.passed}`);
  console.log(`Failed:           ${report.failed}`);
  console.log(`Success Rate:     ${report.success_rate}%`);
  console.log(`Avg Quality:      ${report.avg_quality_score}%`);
  console.log(`  - Excellent:    ${report.quality_distribution.excellent}`);
  console.log(`  - Good:         ${report.quality_distribution.good}`);
  console.log(`  - Needs Work:   ${report.quality_distribution.needs_work}`);
  console.log(`Total Cost:       $${report.total_cost_usd}`);
  console.log(`Duration:         ${report.duration_hours} hours`);
  console.log('');
  console.log(`Report: ${CONFIG.output_dir}/final-report.json`);
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
