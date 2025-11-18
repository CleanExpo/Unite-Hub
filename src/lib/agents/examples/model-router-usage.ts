/**
 * Model Router Usage Examples
 *
 * Shows how to use the model router in different scenarios
 */

import { routeToModel } from "../model-router";

/**
 * Example 1: Ultra-Cheap Intent Extraction
 * Use case: Quickly determine email intent (support, sales, billing)
 * Cost: ~$0.001 per call
 */
export async function extractEmailIntent(emailContent: string): Promise<string> {
  const result = await routeToModel({
    task: "extract_intent",
    prompt: `What is the main intent of this email? Respond with one word: support, sales, billing, or general.

Email: "${emailContent}"`,
    // Will auto-select: gemini-flash-lite (OpenRouter)
  });

  console.log(`✅ Intent extracted: ${result.response}`);
  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return result.response.trim().toLowerCase();
}

/**
 * Example 2: Budget Email Intelligence Extraction
 * Use case: Extract business goals, pain points from emails
 * Cost: ~$0.02-0.10 per email
 */
export async function extractEmailIntelligence(emailThread: string) {
  const result = await routeToModel({
    task: "email_intelligence",
    prompt: `Extract the following from this email thread:
1. Business goals mentioned
2. Pain points expressed
3. Requirements stated
4. Budget discussed (if any)
5. Timeline mentioned (if any)

Return as JSON with keys: business_goals, pain_points, requirements, budget, timeline`,
    context: emailThread,
    // Will auto-select: claude-haiku-4.5
  });

  console.log(`✅ Intelligence extracted`);
  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return JSON.parse(result.response);
}

/**
 * Example 3: Standard Buyer Persona Generation
 * Use case: Create buyer persona from contact intelligence
 * Cost: ~$0.50-2.00 per persona
 */
export async function generateBuyerPersona(intelligence: {
  business_goals: string[];
  pain_points: string[];
  demographics: Record<string, any>;
}) {
  const result = await routeToModel({
    task: "generate_persona",
    prompt: `Create a detailed buyer persona based on this intelligence:

Business Goals:
${intelligence.business_goals.map((g) => `- ${g}`).join("\n")}

Pain Points:
${intelligence.pain_points.map((p) => `- ${p}`).join("\n")}

Demographics:
${JSON.stringify(intelligence.demographics, null, 2)}

Return as JSON with keys:
- persona_name (e.g., "Marketing Manager Mike")
- description (2-3 sentences)
- demographics (age_range, location, job_title, income_range)
- pain_points (array)
- goals (array)
- preferred_channels (array)
- content_preferences (array)
- buying_triggers (array)`,
    // Will auto-select: claude-sonnet-4.5
    preferredModel: "claude-sonnet-4.5",
  });

  console.log(`✅ Persona generated: ${result.response.substring(0, 100)}...`);
  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return JSON.parse(result.response);
}

/**
 * Example 4: Premium Content Generation with Extended Thinking
 * Use case: High-quality blog posts, landing pages
 * Cost: ~$5-15 per piece
 */
export async function generateMarketingContent(
  topic: string,
  targetAudience: string,
  tone: string
) {
  const result = await routeToModel({
    task: "generate_content",
    prompt: `Write a compelling 1000-word blog post about: ${topic}

Target Audience: ${targetAudience}
Tone: ${tone}

Include:
1. Catchy headline
2. Engaging introduction
3. 3-4 main sections with subheadings
4. Real-world examples
5. Strong call-to-action

Make it educational, actionable, and SEO-optimized.`,
    assignedModel: "claude-opus-4", // Force Opus for quality
    thinkingBudget: 5000, // Enable Extended Thinking
    temperature: 0.8, // Higher creativity
  });

  console.log(`✅ Content generated (${result.response.length} chars)`);
  console.log(`💭 Thinking used: ${result.reasoning ? "Yes" : "No"}`);
  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return result.response;
}

/**
 * Example 5: Ultra-Premium Codebase Security Audit
 * Use case: Analyze entire codebase for vulnerabilities
 * Cost: ~$20-50 per audit
 */
export async function auditCodebaseSecurity(codebaseFiles: Record<string, string>) {
  const codebaseContext = Object.entries(codebaseFiles)
    .map(([path, content]) => `\n--- ${path} ---\n${content}`)
    .join("\n\n");

  const result = await routeToModel({
    task: "security_audit",
    prompt: `Perform a comprehensive security audit of this codebase.

Identify:
1. SQL injection vulnerabilities
2. XSS (Cross-Site Scripting) risks
3. Authentication/Authorization flaws
4. Insecure data storage
5. API security issues
6. OWASP Top 10 vulnerabilities

For each issue, provide:
- Severity (critical, high, medium, low)
- File and line number
- Explanation
- Remediation steps

Return as JSON array of issues.`,
    context: codebaseContext,
    // Will auto-select: sherlock-think-alpha (1.84M context)
    fallback: "claude-sonnet-4.5", // Fallback if Sherlock unavailable
  });

  console.log(`✅ Security audit complete`);
  console.log(`🔍 Model used: ${result.model}`);
  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return JSON.parse(result.response);
}

/**
 * Example 6: Force Specific Model
 * Use case: When you need a specific model for compliance/quality reasons
 */
export async function generateWithSpecificModel() {
  const result = await routeToModel({
    task: "generate_strategy",
    prompt: "Create a marketing strategy for a SaaS company",
    assignedModel: "claude-sonnet-4.5", // Force Sonnet even if cheaper exists
  });

  console.log(`✅ Strategy generated with ${result.model}`);
  return result.response;
}

/**
 * Example 7: Fallback Chain
 * Use case: Ensure task always completes even if preferred model fails
 */
export async function generateWithFallback() {
  const result = await routeToModel({
    task: "generate_content",
    prompt: "Write a product description",
    preferredModel: "sherlock-think-alpha", // Try Sherlock first
    fallback: "claude-sonnet-4.5", // Fallback to Sonnet
    // If both fail, emergency fallback to claude-haiku-4.5
  });

  console.log(`✅ Content generated with ${result.model}`);
  return result.response;
}

/**
 * Example 8: Batch Operations for Cost Efficiency
 * Use case: Process multiple emails at once to reduce API overhead
 */
export async function batchExtractIntents(emails: string[]): Promise<string[]> {
  const batchPrompt = `Extract the intent for each of the following emails. Return as JSON array of strings.

Emails:
${emails.map((e, i) => `${i + 1}. ${e}`).join("\n\n")}

Return format: ["intent1", "intent2", ...]`;

  const result = await routeToModel({
    task: "extract_intent",
    prompt: batchPrompt,
  });

  const intents = JSON.parse(result.response);

  console.log(`✅ Batch processed ${emails.length} emails`);
  console.log(`💰 Cost per email: $${(result.costEstimate / emails.length).toFixed(4)}`);

  return intents;
}

/**
 * Example 9: Temperature Control for Different Use Cases
 */
export async function generateWithTemperature() {
  // Low temperature (0.2) for factual, deterministic outputs
  const factual = await routeToModel({
    task: "email_intelligence",
    prompt: "Extract business requirements from this email",
    context: "We need a CRM with 50 user licenses...",
    temperature: 0.2, // More factual
  });

  // High temperature (0.9) for creative outputs
  const creative = await routeToModel({
    task: "generate_content",
    prompt: "Write a creative tagline for our product",
    temperature: 0.9, // More creative
  });

  return { factual: factual.response, creative: creative.response };
}

/**
 * Example 10: Cost Tracking Across Multiple Calls
 */
export async function trackCostAcrossOperations() {
  let totalCost = 0;
  const operations: Array<{ operation: string; cost: number }> = [];

  // Operation 1: Extract intent
  const intent = await routeToModel({
    task: "extract_intent",
    prompt: "What is the intent of this email?",
  });
  totalCost += intent.costEstimate;
  operations.push({ operation: "extract_intent", cost: intent.costEstimate });

  // Operation 2: Generate persona
  const persona = await routeToModel({
    task: "generate_persona",
    prompt: "Create a buyer persona",
  });
  totalCost += persona.costEstimate;
  operations.push({ operation: "generate_persona", cost: persona.costEstimate });

  // Operation 3: Generate content
  const content = await routeToModel({
    task: "generate_content",
    prompt: "Write a blog post",
    assignedModel: "claude-opus-4",
    thinkingBudget: 5000,
  });
  totalCost += content.costEstimate;
  operations.push({ operation: "generate_content", cost: content.costEstimate });

  console.log("\n📊 Cost Report:");
  operations.forEach((op) => {
    console.log(`  ${op.operation}: $${op.cost.toFixed(4)}`);
  });
  console.log(`  TOTAL: $${totalCost.toFixed(4)}`);

  return { operations, totalCost };
}
