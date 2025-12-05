#!/usr/bin/env node
// scripts/generate-client-deliverables.mjs
// Generate sample client-facing deliverables from test results

import fs from 'fs';
import path from 'path';

const resultsPath = process.argv[2] || 'test-results/run-1764830453643/all-results.json';
const outputDir = process.argv[3] || 'test-results/client-deliverables';

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('');
console.log('='.repeat(60));
console.log('  GENERATING CLIENT DELIVERABLES');
console.log('='.repeat(60));
console.log('');

// Group results by persona
const byPersona = {};
for (const result of results) {
  if (!byPersona[result.persona_id]) {
    byPersona[result.persona_id] = [];
  }
  byPersona[result.persona_id].push(result);
}

// Parse content generation response
function parseContentGen(response) {
  const result = {};
  const headlineMatch = response.match(/\*\*Headline:?\*\*\s*["']?([^"'\n]+)["']?/i);
  if (headlineMatch) {
    result.headline = headlineMatch[1].trim().replace(/^["']|["']$/g, '');
  }
  const vpMatch = response.match(/\*\*Value Prop(?:osition)?:?\*\*\s*["']?([^"'\n]+)["']?/i);
  if (vpMatch) {
    result.value_proposition = vpMatch[1].trim().replace(/^["']|["']$/g, '');
  }
  return result;
}

// Generate HTML deliverable
function generateHTML(personaId, personaResults) {
  // Extract business info from persona ID
  const parts = personaId.split('-');
  const industry = parts[0];
  const businessNames = {
    'trades-001': 'Reliable Plumbing Co',
    'trades-002': 'Spark Electric Services',
    'trades-003': 'Cool Air HVAC',
    'professional-001': 'Smith & Partners Accounting',
    'health-001': 'Smile Dental Clinic',
    'hospitality-001': 'Cafe Delights',
    'retail-001': 'Fashion Forward Boutique',
    'automotive-001': 'Quality Auto Repairs',
    'home_services-001': 'Sparkle Clean Services',
    'tech_services-001': 'IT Support Solutions',
  };

  const businessName = businessNames[personaId] || `${industry} Business ${parts[1]}`;
  const locations = ['Sydney, NSW', 'Melbourne, VIC', 'Brisbane, QLD', 'Perth, WA', 'Adelaide, SA'];
  const location = locations[parseInt(parts[1]) % locations.length];

  // Extract assets from results
  const assets = {};

  for (const r of personaResults) {
    if (r.test_type === 'content_generation') {
      const parsed = parseContentGen(r.response);
      assets.headline = parsed.headline;
      assets.value_proposition = parsed.value_proposition;
    }
    if (r.test_type === 'brand_analysis') {
      assets.brand_analysis = r.response.replace(/\*\*/g, '').trim();
    }
    if (r.test_type === 'seo_audit') {
      assets.seo_audit = r.response;
    }
    if (r.test_type === 'campaign_strategy') {
      assets.campaign = r.response;
    }
    if (r.test_type === 'competitor_analysis') {
      assets.competitors = r.response;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Assets - ${businessName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fafafa;
    }
    .header {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .section-title {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #ff6b35;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-title::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #ff6b35;
      border-radius: 2px;
    }
    .headline-box {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      border-left: 4px solid #ff6b35;
    }
    .headline { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
    .value-prop { font-size: 1.1rem; color: #555; margin-top: 0.75rem; }
    .analysis { color: #444; }
    .campaign-step {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #eee;
    }
    .campaign-step:last-child { border-bottom: none; }
    .step-num {
      background: #ff6b35;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    .seo-item {
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }
    .seo-item strong { color: #1a1a1a; }
    .footer {
      text-align: center;
      padding: 2rem;
      color: #888;
      font-size: 0.875rem;
    }
    .footer img { height: 24px; opacity: 0.5; margin-bottom: 0.5rem; }
    @media (max-width: 600px) {
      body { padding: 20px 10px; }
      .header { padding: 1.5rem; }
      .headline { font-size: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${businessName}</h1>
    <p>${industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' ')} • ${location}</p>
  </div>

  ${assets.headline ? `
  <div class="section">
    <div class="section-title">Your Marketing Headline</div>
    <div class="headline-box">
      <div class="headline">${assets.headline}</div>
      ${assets.value_proposition ? `<div class="value-prop">${assets.value_proposition}</div>` : ''}
    </div>
    <p style="margin-top: 1rem; color: #888; font-size: 0.875rem;">
      Use this headline on your website homepage, Google Business Profile, and social media bios.
    </p>
  </div>
  ` : ''}

  ${assets.brand_analysis ? `
  <div class="section">
    <div class="section-title">Brand Positioning Analysis</div>
    <div class="analysis">${assets.brand_analysis.substring(0, 600)}${assets.brand_analysis.length > 600 ? '...' : ''}</div>
  </div>
  ` : ''}

  ${assets.seo_audit ? `
  <div class="section">
    <div class="section-title">SEO Action Plan</div>
    ${assets.seo_audit.split(/\d+\.\s*\*\*/).slice(1, 4).map(item => {
      const title = item.split('**')[0] || item.substring(0, 50);
      return `<div class="seo-item"><strong>${title.trim()}</strong></div>`;
    }).join('')}
    <p style="margin-top: 1rem; color: #888; font-size: 0.875rem;">
      Start with the first recommendation this week for the biggest impact.
    </p>
  </div>
  ` : ''}

  ${assets.campaign ? `
  <div class="section">
    <div class="section-title">3-Step Marketing Campaign</div>
    ${assets.campaign.split(/###?\s*\d+\./).slice(1, 4).map((step, i) => {
      const title = step.split('\n')[0].replace(/\*\*/g, '').trim();
      return `
      <div class="campaign-step">
        <div class="step-num">${i + 1}</div>
        <div><strong>${title.substring(0, 60)}</strong></div>
      </div>`;
    }).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Synthex • ${new Date().toLocaleDateString('en-AU')}</p>
    <p style="margin-top: 0.5rem;">Questions? Contact your account manager</p>
  </div>
</body>
</html>`;
}

// Generate deliverables for sample businesses
const samplePersonas = [
  'trades-001',
  'trades-002',
  'professional-001',
  'health-001',
  'hospitality-001',
  'retail-001',
  'automotive-001',
  'home_services-001',
  'tech_services-001',
];

let generated = 0;

for (const personaId of samplePersonas) {
  const personaResults = byPersona[personaId];
  if (!personaResults) {
    console.log(`  ⚠️  No results for ${personaId}`);
    continue;
  }

  const html = generateHTML(personaId, personaResults);
  const filename = `${personaId}-deliverable.html`;
  fs.writeFileSync(path.join(outputDir, filename), html);
  console.log(`  ✓ Generated ${filename}`);
  generated++;
}

console.log('');
console.log(`Generated ${generated} client deliverables in ${outputDir}/`);
console.log('');
console.log('Open in browser to preview:');
console.log(`  file://${path.resolve(outputDir)}/trades-001-deliverable.html`);
console.log('');
