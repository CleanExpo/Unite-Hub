/**
 * Generate Visual Assets using Google AI
 * Creates SVG diagrams, comparison visuals, and icons
 *
 * Part of Anthropic UI/UX Phase
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ Missing Google AI API key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Ensure output directory exists
const outputDir = join(process.cwd(), 'public', 'generated-assets');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory might already exist
}

console.log('🎨 Generating visual assets with Google AI...\n');

/**
 * Generate Unite-Hub Architecture Diagram
 */
async function generateArchitectureDiagram() {
  console.log('📐 Generating architecture diagram...');

  const prompt = `Generate a professional SVG architecture diagram (1200x800px) for Unite-Hub showing 3 layers:

TOP LAYER (Blue gradient #3b82f6 to #60a5fa):
- Label: "Next.js App Router (React 19)"
- Sub-items: "CRM Dashboard", "Synthex Product", "100+ API Routes"
- Height: 200px from top

MIDDLE LAYER (Orange gradient #ff6b35 to #ff8c61):
- Label: "AI Agent Layer (43 Agents)"
- Badge: "✓ Project Vend Phase 2 Enhanced"
- Sub-items: "Email Agent", "Content Generator", "Orchestrator"
- Icons: Small AI/robot icons
- Height: 300px from top

BOTTOM LAYER (Purple gradient #8b5cf6 to #a78bfa):
- Label: "Supabase PostgreSQL"
- Sub-items: "Multi-tenant RLS", "Real-time", "100+ tables"
- Height: from 500px to bottom

CONNECTIONS:
- Arrows from Top → Middle (labeled "API calls")
- Arrows from Middle → Bottom (labeled "Data queries")
- Bi-directional arrow for real-time subscriptions

TEXT REQUIREMENTS:
- All text must be in <text> elements (AI-parseable)
- Use clear labels, not just icons
- High contrast (white/light text on colored backgrounds)

STYLE:
- Professional, clean, technical
- Rounded rectangles for layers
- Gradient fills for visual appeal
- Drop shadows for depth

Return ONLY the SVG code, no markdown, no explanation.`;

  const result = await model.generateContent(prompt);
  let svgCode = result.response.text();

  // Clean markdown if present
  svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

  // Save to file
  const filename = 'unite-hub-architecture.svg';
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, svgCode, 'utf-8');

  console.log(`✅ Architecture diagram saved: ${filepath}\n`);

  return { filename, filepath, svgCode };
}

/**
 * Generate Client vs Agency Comparison
 */
async function generateComparisonVisual() {
  console.log('⚖️  Generating client vs agency comparison...');

  const prompt = `Generate a professional split-screen comparison SVG (1200x630px):

LEFT SIDE (Traditional Agency - Red theme #ef4444):
- Background: Light red gradient
- Header: "Traditional Agency" (bold, dark red)
- Icon: Building/office (red)
- Metrics:
  * "$5,000/month" (large, bold)
  * "2-3 weeks response time" (with clock icon)
  * "Black box process" (with lock icon)
  * "No code access"
- Overall tone: Warning, expensive, slow

CENTER DIVIDER:
- Vertical line
- Large arrow pointing right →
- Text: "Transform"

RIGHT SIDE (Unite-Hub - Green theme #10b981):
- Background: Light green gradient
- Header: "Unite-Hub" (bold, dark green)
- Icon: Lightning bolt (green)
- Metrics:
  * "$0.05/email" (large, bold)
  * "Real-time automation" (with lightning icon)
  * "Full transparency" (with eye icon)
  * "Open source GitHub" (with code icon)
- Overall tone: Success, affordable, fast

BOTTOM BANNER (across both sides):
- Dark background
- Text: "From Agency Dependency → Client Autonomy"
- Small: "Powered by 43 AI Agents + Project Vend Phase 2"

REQUIREMENTS:
- All text in <text> elements
- High contrast for readability
- Clear data comparison
- Professional business visual

Return ONLY the SVG code.`;

  const result = await model.generateContent(prompt);
  let svgCode = result.response.text();
  svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

  const filename = 'client-vs-agency-comparison.svg';
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, svgCode, 'utf-8');

  console.log(`✅ Comparison visual saved: ${filepath}\n`);

  return { filename, filepath, svgCode };
}

/**
 * Generate HowTo step icons
 */
async function generateStepIcons() {
  console.log('🎯 Generating 5 HowTo step icons...');

  const steps = [
    { name: 'Connect Gmail', description: 'Envelope with link/connection symbol' },
    { name: 'AI Analyzes', description: 'Brain with magnifying glass' },
    { name: 'Categorize Leads', description: 'Folders with star ratings' },
    { name: 'Generate Responses', description: 'Sparkles with document/email' },
    { name: 'Track Performance', description: 'Chart/graph with checkmark' }
  ];

  const icons = [];

  for (const [index, step] of steps.entries()) {
    console.log(`   Generating icon ${index + 1}/5: ${step.name}...`);

    const prompt = `Generate a minimalist icon SVG (200x200px) for: ${step.name}

Visual: ${step.description}

STYLE:
- Single color: Orange #ff6b35
- Circular background (diameter: 180px, centered)
- Icon in center (stroke-width: 3px, no fill, orange)
- Clean line art style
- Professional, modern

STRUCTURE:
- <circle> for background (fill: rgba(255,107,53,0.1), stroke: #ff6b35)
- Icon elements using <path> or simple shapes
- All elements centered at 100,100

REQUIREMENTS:
- Semantic <title> element: "${step.name}"
- <desc> element: "${step.description}"
- ARIA labels for accessibility
- High contrast for visibility

Return ONLY the SVG code, 200x200px viewBox.`;

    const result = await model.generateContent(prompt);
    let svgCode = result.response.text();
    svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

    const filename = `step-${index + 1}-${step.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, svgCode, 'utf-8');

    icons.push({ filename, filepath, step: step.name });
  }

  console.log(`✅ All 5 step icons generated\n`);

  return icons;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting visual asset generation...\n');

    // Generate architecture diagram
    const architecture = await generateArchitectureDiagram();

    // Generate comparison visual
    const comparison = await generateComparisonVisual();

    // Generate step icons
    const icons = await generateStepIcons();

    console.log('═'.repeat(70));
    console.log('✅ Visual asset generation COMPLETE\n');
    console.log('📁 Output directory:', outputDir);
    console.log('📊 Assets generated:');
    console.log(`   - ${architecture.filename}`);
    console.log(`   - ${comparison.filename}`);
    icons.forEach(icon => console.log(`   - ${icon.filename}`));
    console.log('\n📋 Next steps:');
    console.log('   1. Review SVG files in public/generated-assets/');
    console.log('   2. Generate schema with src/lib/schema/visual-schema.ts');
    console.log('   3. Integrate into Next.js pages');
    console.log('   4. Test with Google Search Console\n');

  } catch (err) {
    console.error('❌ Asset generation failed:', err);
    process.exit(1);
  }
}

main();
