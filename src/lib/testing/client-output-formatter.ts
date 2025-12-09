// src/lib/testing/client-output-formatter.ts
// Transform raw test results into polished client-facing outputs

export interface RawTestResult {
  persona_id: string;
  test_type: string;
  response: string;
  duration_ms: number;
  cost_usd?: number;
}

export interface ClientDeliverable {
  business_name: string;
  industry: string;
  location: string;
  generated_at: string;
  assets: {
    headline?: string;
    value_proposition?: string;
    brand_analysis?: string;
    seo_recommendations?: SEORecommendation[];
    competitive_advantages?: CompetitiveAdvantage[];
    campaign_plan?: CampaignStep[];
    retention_tactics?: RetentionTactic[];
    customer_journey?: JourneyStage[];
  };
  quality_score: number;
  ready_for_client: boolean;
}

export interface SEORecommendation {
  action: string;
  keyword_example?: string;
  effort_hours: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CompetitiveAdvantage {
  name: string;
  why_it_works: string;
  implementation: string;
  messaging_example: string;
}

export interface CampaignStep {
  step_number: number;
  action: string;
  cost: string;
  expected_result: string;
}

export interface RetentionTactic {
  name: string;
  how_it_works: string;
  setup_cost: string;
  expected_impact: string;
}

export interface JourneyStage {
  stage: 'awareness' | 'interest' | 'decision' | 'purchase' | 'loyalty';
  customer_mindset: string;
  touchpoint: string;
  action: string;
}

// ============================================
// PARSERS
// ============================================

function parseContentGeneration(response: string): { headline?: string; value_proposition?: string } {
  const result: { headline?: string; value_proposition?: string } = {};

  // Extract headline
  const headlineMatch = response.match(/\*\*Headline:?\*\*\s*["']?([^"'\n]+)["']?/i);
  if (headlineMatch) {
    result.headline = headlineMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  // Extract value proposition
  const vpMatch = response.match(/\*\*Value Prop(?:osition)?:?\*\*\s*["']?([^"'\n]+)["']?/i);
  if (vpMatch) {
    result.value_proposition = vpMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  return result;
}

function parseSEOAudit(response: string): SEORecommendation[] {
  const recommendations: SEORecommendation[] = [];

  // Split by numbered items
  const items = response.split(/\d+\.\s*\*\*/);

  for (const item of items) {
    if (item.trim().length < 20) {
continue;
}

    const lines = item.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
continue;
}

    const action = lines[0].replace(/\*\*/g, '').trim();
    const keywordMatch = item.match(/keyword[s]?[:\s]+["']?([^"'\n,]+)/i);
    const effortMatch = item.match(/(\d+[-–]?\d*)\s*hour/i);

    recommendations.push({
      action: action.substring(0, 100),
      keyword_example: keywordMatch ? keywordMatch[1].trim() : undefined,
      effort_hours: effortMatch ? effortMatch[1] : '2-4',
      priority: recommendations.length === 0 ? 'high' : recommendations.length === 1 ? 'medium' : 'low',
    });
  }

  return recommendations.slice(0, 3);
}

function parseCampaignStrategy(response: string): CampaignStep[] {
  const steps: CampaignStep[] = [];

  // Look for numbered steps
  const stepMatches = response.matchAll(/(?:step\s*)?(\d+)[.:\s]+\*?\*?([^*\n]+)\*?\*?/gi);

  let stepNum = 0;
  for (const match of stepMatches) {
    stepNum++;
    const content = match[2].trim();

    // Try to extract cost
    const costMatch = response.substring(match.index || 0, (match.index || 0) + 500).match(/\$[\d,]+[-–]?\$?[\d,]*/);

    steps.push({
      step_number: stepNum,
      action: content.substring(0, 80),
      cost: costMatch ? costMatch[0] : 'TBD',
      expected_result: 'Increased visibility',
    });

    if (stepNum >= 3) {
break;
}
  }

  return steps;
}

// ============================================
// MAIN FORMATTER
// ============================================

export function formatForClient(
  results: RawTestResult[],
  businessInfo: {
    business_name: string;
    industry: string;
    location: string;
  }
): ClientDeliverable {
  const deliverable: ClientDeliverable = {
    business_name: businessInfo.business_name,
    industry: businessInfo.industry,
    location: businessInfo.location,
    generated_at: new Date().toISOString(),
    assets: {},
    quality_score: 0,
    ready_for_client: false,
  };

  let qualityPoints = 0;
  let totalChecks = 0;

  for (const result of results) {
    switch (result.test_type) {
      case 'content_generation': {
        const parsed = parseContentGeneration(result.response);
        if (parsed.headline) {
          deliverable.assets.headline = parsed.headline;
          qualityPoints += parsed.headline.length > 20 ? 20 : 10;
        }
        if (parsed.value_proposition) {
          deliverable.assets.value_proposition = parsed.value_proposition;
          qualityPoints += parsed.value_proposition.length > 30 ? 20 : 10;
        }
        totalChecks += 40;
        break;
      }

      case 'brand_analysis': {
        deliverable.assets.brand_analysis = result.response
          .replace(/\*\*/g, '')
          .trim()
          .substring(0, 500);
        qualityPoints += result.response.length > 100 ? 20 : 10;
        totalChecks += 20;
        break;
      }

      case 'seo_audit': {
        const seoRecs = parseSEOAudit(result.response);
        if (seoRecs.length > 0) {
          deliverable.assets.seo_recommendations = seoRecs;
          qualityPoints += seoRecs.length * 10;
        }
        totalChecks += 30;
        break;
      }

      case 'campaign_strategy': {
        const steps = parseCampaignStrategy(result.response);
        if (steps.length > 0) {
          deliverable.assets.campaign_plan = steps;
          qualityPoints += steps.length * 10;
        }
        totalChecks += 30;
        break;
      }

      case 'competitor_analysis': {
        // Store raw for now, parse later
        deliverable.assets.competitive_advantages = [{
          name: 'Local Expertise',
          why_it_works: result.response.substring(0, 200),
          implementation: 'See full analysis',
          messaging_example: 'Your local expert',
        }];
        qualityPoints += 15;
        totalChecks += 20;
        break;
      }
    }
  }

  deliverable.quality_score = totalChecks > 0 ? Math.round((qualityPoints / totalChecks) * 100) : 0;
  deliverable.ready_for_client = deliverable.quality_score >= 70;

  return deliverable;
}

// ============================================
// HTML EXPORT
// ============================================

export function generateClientHTML(deliverable: ClientDeliverable): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Assets - ${deliverable.business_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; color: #666; margin-bottom: 2rem; font-weight: normal; }
    h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #ff6b35; margin: 2rem 0 1rem; }
    .card { background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .headline { font-size: 1.5rem; font-weight: bold; color: #1a1a1a; }
    .value-prop { font-size: 1.1rem; color: #444; margin-top: 0.5rem; }
    .seo-item { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .priority { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase; }
    .priority-high { background: #fee2e2; color: #dc2626; }
    .priority-medium { background: #fef3c7; color: #d97706; }
    .priority-low { background: #d1fae5; color: #059669; }
    .step { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .step-num { background: #ff6b35; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #666; font-size: 0.875rem; }
    .quality-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; }
    .quality-good { background: #d1fae5; color: #059669; }
    .quality-ok { background: #fef3c7; color: #d97706; }
  </style>
</head>
<body>
  <h1>${deliverable.business_name}</h1>
  <h2>${deliverable.industry} • ${deliverable.location}</h2>

  ${deliverable.assets.headline ? `
  <h3>Your Headline</h3>
  <div class="card">
    <div class="headline">${deliverable.assets.headline}</div>
    ${deliverable.assets.value_proposition ? `<div class="value-prop">${deliverable.assets.value_proposition}</div>` : ''}
  </div>
  ` : ''}

  ${deliverable.assets.brand_analysis ? `
  <h3>Brand Analysis</h3>
  <div class="card">
    <p>${deliverable.assets.brand_analysis}</p>
  </div>
  ` : ''}

  ${deliverable.assets.seo_recommendations ? `
  <h3>SEO Actions</h3>
  <div class="card">
    ${deliverable.assets.seo_recommendations.map(rec => `
    <div class="seo-item">
      <span class="priority priority-${rec.priority}">${rec.priority}</span>
      <div>
        <strong>${rec.action}</strong>
        ${rec.keyword_example ? `<br><small>Keyword: "${rec.keyword_example}"</small>` : ''}
        <br><small>Effort: ${rec.effort_hours} hours</small>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${deliverable.assets.campaign_plan ? `
  <h3>3-Step Campaign</h3>
  <div class="card">
    ${deliverable.assets.campaign_plan.map(step => `
    <div class="step">
      <div class="step-num">${step.step_number}</div>
      <div>
        <strong>${step.action}</strong>
        <br><small>Budget: ${step.cost}</small>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <span class="quality-badge ${deliverable.quality_score >= 70 ? 'quality-good' : 'quality-ok'}">
      Quality Score: ${deliverable.quality_score}%
    </span>
    <br><br>
    Generated by Synthex on ${new Date(deliverable.generated_at).toLocaleDateString('en-AU')}
  </div>
</body>
</html>`;
}

// ============================================
// BATCH PROCESSOR
// ============================================

export async function processTestResultsForClients(
  allResults: RawTestResult[],
  personas: Array<{ id: string; business_name: string; industry: string; location: string }>
): Promise<Map<string, ClientDeliverable>> {
  const deliverables = new Map<string, ClientDeliverable>();

  for (const persona of personas) {
    const personaResults = allResults.filter(r => r.persona_id === persona.id);

    if (personaResults.length === 0) {
continue;
}

    const deliverable = formatForClient(personaResults, {
      business_name: persona.business_name,
      industry: persona.industry,
      location: persona.location,
    });

    deliverables.set(persona.id, deliverable);
  }

  return deliverables;
}
