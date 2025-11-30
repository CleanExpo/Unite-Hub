#!/usr/bin/env node

/**
 * SYNTHEX Ultra-Premium Prompt Generator
 *
 * Generates absolute best-in-class prompts targeting perfect 10.0 scores
 * for all 45 Phase 1 concepts.
 *
 * Targeting:
 * - Average Quality Score: 9.8+
 * - Auto-Approve Rate: 100% (45/45)
 * - Perfection Grade: Museum/Fortune 500 quality
 *
 * Usage: node synthex-ultra-premium-prompts.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration files
const loadConfig = (filename) => {
  const filepath = path.resolve(__dirname, `../config/generation_configs/${filename}`);
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (error) {
    console.error(`Could not load ${filename}: ${error.message}`);
    process.exit(1);
  }
};

// Generate ultra-premium prompt for industry cards
const generateUltraPremiumCardPrompt = (industry, style, colorHex, basePrompt) => {
  const premiumMarkers = {
    technical_excellence: 'Museum-quality sharp focus throughout entire frame, professional studio three-point lighting, advanced bokeh background isolation, professional color grading with natural tones, zero artifacts or defects, cinematic production value',
    brand_perfection: `Brand-aligned visual hierarchy with ${colorHex} accent color as primary highlight, premium professional aesthetic, sophisticated color palette, no generic stock photo appearance whatsoever`,
    expertise_demonstration: 'Subject demonstrates exceptional mastery and professional expertise, confident authority evident, years of proven experience visible in posture and environment, certification and credentials subtly apparent',
    composition_mastery: 'Rule-of-thirds composition with perfect balance, leading lines guiding viewer attention, dynamic yet professional staging, visual hierarchy absolutely clear, layered depth with compelling foreground-middle-background relationships',
    authenticity: 'Authentic professional setting with real equipment and authentic materials, genuine expertise evident, not staged or artificial, natural interaction with tools/environment'
  };

  const styleSpecific = {
    photorealistic: `Professional photography style. Subject: ${basePrompt.split('Subject:')[1]?.split('.')[0] || 'professional expert'}. Lighting: Three-point studio setup with warm professional tones, shadow detail preserved, flattering key light at 45° angle. Composition: ${premiumMarkers.composition_mastery}. Quality: Publish-ready for National Geographic, Fortune Magazine standards.`,
    illustrated: `Premium illustration style - Pixar/Disney animation quality level. Character design with distinctive personality and professional appearance. Setting: Modern, upscale, contemporary workspace. Color palette: Sophisticated and harmonious with industry accent color. Quality: Museum-quality illustration suitable for premium editorial. Style: Contemporary digital art with smooth gradients, anti-aliased precision, professional color theory application.`,
    isometric: `Premium isometric technical illustration. 3D isometric perspective showing system architecture, components, and workflow. Rendering: Cinema-grade isometric render with professional lighting, shadow detail, and depth. Color: Harmonious palette with ${colorHex} as strategic accent. Quality: Technical illustration suitable for Fortune 500 enterprise presentations.`
  };

  return `
ULTRA-PREMIUM IMAGE SPECIFICATION - PERFECT 10.0 TARGET

=== CORE REQUIREMENTS ===

Professional Quality Benchmark: National Geographic / Fortune 500 / Premium Editorial Magazine standards

Brand Identity: Synthex premium professional contractor services brand
- Primary color: ${colorHex} (exact hex match required)
- Secondary: Dark backgrounds (#08090a to #141517)
- Aesthetic: Modern, professional, trustworthy, sophisticated
- Target: Conveying expertise, reliability, and premium service quality

=== SUBJECT & CONTEXT ===

${styleSpecific[style]}

=== TECHNICAL EXCELLENCE ===

${premiumMarkers.technical_excellence}

Quality Specification: Every pixel must meet magazine publication standards. Zero tolerance for:
- Blurry areas (except intentional bokeh)
- Color fringing or artifacts
- Oversaturation or undersaturation
- Poor exposure (no blown highlights, no blocked shadows)
- Unnatural lighting (must appear professionally lit)
- Generic or stock photo appearance

=== BRAND ALIGNMENT ===

${premiumMarkers.brand_perfection}

Visual Identity Elements:
- ${colorHex} accent color positioned prominently but not dominantly
- Professional confidence throughout composition
- Modern, premium aesthetic at every detail level
- No off-brand elements or visual conflicts

=== EXPERTISE & MASTERY ===

${premiumMarkers.expertise_demonstration}

The subject should communicate:
- Professional credentials and certification (visual subtlety required)
- Years of specialized experience and knowledge
- Confident authority in their field
- Reliability and trustworthiness
- Problem-solving capability

=== COMPOSITION & DESIGN ===

${premiumMarkers.composition_mastery}

Advanced composition requirements:
- Primary subject positioned on rule-of-thirds intersection
- Negative space used strategically
- Leading lines guide viewer through image
- Clear visual hierarchy with professional emphasis
- Depth layers: compelling foreground, clear middle ground, supporting background
- Every element serves composition purpose

=== EMOTIONAL IMPACT ===

Evoke these emotions precisely:
- Professional confidence (but not arrogance)
- Trustworthy expertise (but not clinical)
- Aspirational quality (but achievable/relatable)
- Modern sophistication (but approachable)
- Reliable competence (but personable)

Emotional authenticity is critical - avoid:
- Staged or artificial feeling
- Overly posed / unnatural
- Cold or clinical appearance
- Aggressive or dismissive tone
- Generic or corporate sterility

=== TECHNICAL SPECIFICATIONS ===

Output Quality:
- Resolution: ${basePrompt.includes('1920') ? '1920x1080' : '800x600'}
- Sharpness: Crystal clear throughout, no softness
- Color Accuracy: Professional grading, natural yet punchy
- Exposure: Perfect exposure with detail in all tones
- No Artifacts: Zero distortion, noise, compression artifacts

Format Requirements:
- Color space: sRGB for web, properly calibrated
- Color grading: Professional post-production look
- Lighting Model: Physically plausible, professional studio appearance
- Rendering: Clean, precise, publication-ready

=== ABSOLUTE FORBIDDEN ELEMENTS ===

Reject immediately if image contains any of:
- Watermarks, logos, or text
- Generic stock photo appearance
- Blurry or out-of-focus subject
- Poor lighting (dim, uneven, artificial-looking)
- Oversaturated or undersaturated colors
- Awkward or unnatural poses
- Cheap or amateur equipment/setting
- Visible artifacts or distortions
- Clichéd poses or backgrounds
- Off-brand color palette
- Generic expressions or emotions
- Cluttered or messy composition
- Unprofessional or low-quality materials

=== SUCCESS CRITERIA FOR 10.0 RATING ===

Visual excellence: Suitable for premium brand marketing
- Magazine-cover quality composition
- Professional photography / illustration standards
- Every technical element executed perfectly
- Authentic expertise unmistakably evident

Brand perfection: Synthex brand values fully embodied
- Color palette exactly matches brand guidelines
- Professional aesthetic consistently reinforced
- Premium positioning crystal clear
- Competitive differentiation obvious

Emotional resonance: Perfect emotional communication
- Intended mood evokes powerfully and authentically
- Trustworthiness and expertise immediately apparent
- Aspiration without alienation balanced perfectly
- Memorable and impactful visual impact

Audience connection: Directly addresses target audience needs
- Speaks to audience values and aspirations
- Demonstrates understanding of audience needs
- Motivates engagement or action
- Resonates with target demographic specifically

Uniqueness & originality: Stands out from competition
- Completely original composition (not stock photo)
- Distinctive visual approach or perspective
- Memorable and differentiating aesthetic
- Sets new standard for industry marketing

=== GENERATION INSTRUCTIONS ===

Generate image matching 100% of specifications above.
Target quality: 10.0/10.0 - Museum and Fortune 500 standards
Reject anything below perfection standards.
Every specification detail is mandatory - no compromise.

This is premium brand positioning - quality is everything.
`;
};

// Generate ultra-premium hero prompts
const generateUltraPremiumHeroPrompt = (heroTitle, concept, aesthetic) => {
  return `
ULTRA-PREMIUM HERO IMAGE - PERFECT 10.0 TARGET

=== CAMPAIGN IDENTITY ===

Campaign: ${heroTitle}
Concept: ${concept}
Aesthetic Direction: ${aesthetic}

Target Quality Standard: CNN / Getty Images / Fortune 500 brand benchmark

=== VISUAL EXECUTION ===

Composition:
- Cinematic composition with advanced visual hierarchy
- Dynamic yet balanced - professional energy evident
- Rule-of-thirds or golden ratio composition mandatory
- Leading lines create visual flow and engagement
- Foreground-background depth creates spatial interest
- Professional staging with authentic context

Lighting:
- Cinema-grade cinematic lighting
- Multiple light sources creating sophisticated illumination
- Warm professional tones with strategic accents
- Shadow detail preserved throughout
- No harsh or flat lighting
- Professional color temperature management

Color Palette:
- Dark background anchor (#08090a to #141517)
- Orange (#ff6b35) accent as strategic highlight
- Sophisticated secondary colors supporting composition
- Professional color grading applied
- Harmonious color relationships throughout
- Brand colors integrated seamlessly

Technical Excellence:
- Sharp focus throughout entire composition
- Professional exposure with full tonal range
- Zero artifacts or quality defects
- Cinematic production value evident
- Magazine-cover quality clarity
- Museum-grade visual precision

=== BRAND ALIGNMENT ===

Brand Integration:
- Synthex visual identity unmistakably embodied
- Premium professional positioning crystal clear
- Dark theme anchor with orange accents
- Modern sophisticated aesthetic throughout
- Trust and expertise communicated visually
- Competitive differentiation obvious at glance

Visual Sophistication:
- Enterprise-grade brand presentation
- Fortune 500 company aesthetic level
- Premium market positioning evident
- Professional confidence throughout
- Aspirational yet achievable impression

=== EMOTIONAL IMPACT ===

Emotional Communication:
- Aspiration and inspiration clear
- Professional confidence unmistakable
- Trustworthiness and reliability evident
- Innovation and modernity apparent
- Unified and coordinated brand message
- Memorable visual impact

Feeling:
- This image should feel aspirational
- Confidence and competence should shine
- Authenticity should be genuine
- Sophistication should be evident
- Accessibility should be maintained (not cold)

=== COMPOSITION REQUIREMENTS ===

Advanced Composition Elements:
- Dynamic diagonal or triangular composition
- Multiple focal points with clear hierarchy
- Negative space supporting positive elements
- Layered depth with compelling relationships
- Professional framing with intention
- Viewer engagement path clearly guided

Visual Story:
- Narrative communicated without text
- Unified service vision apparent
- Multiple trades represented (if applicable)
- Connection/unity theme reinforced
- Professional mastery demonstrated

=== TECHNICAL SPECIFICATIONS ===

Output Quality:
- Resolution: 1920x1080 (Hero size)
- Sharpness: Museum-quality sharp throughout
- Color: Professional grading with subtlety
- Exposure: Perfect with detail in all tones
- No Artifacts: Zero distortion or defects

Publishing Standard:
- Ready for website hero section
- Suitable for billboard/large format
- Professional presentation materials
- Presentation deck compatibility

=== FORBIDDEN ELEMENTS ===

Absolutely reject if contains:
- Generic stock photo appearance
- Clichéd or overused composition
- Blurry or soft focus
- Poor or flat lighting
- Oversaturation / undersaturation
- Visible watermarks or logos
- Off-brand colors or aesthetic
- Artificial or staged feeling
- Low-quality equipment/materials
- Unfocused or weak composition

=== 10.0 RATING CRITERIA ===

Visual Excellence: Top 1% of commercial imagery
- Every technical element perfect
- Cinematic quality throughout
- Professional presentation standards

Brand Perfection: Embodiment of Synthex brand
- Color palette perfect match
- Brand positioning unmistakable
- Competitive differentiation clear

Emotional Power: Moves and inspires viewers
- Aspirational without alienation
- Professional confidence evident
- Trustworthiness communicated
- Memorable impact

Originality: Distinctive and unique
- Not generic stock photo
- Unique visual perspective
- Sets new industry standard

=== GENERATION INSTRUCTIONS ===

Generate hero image to these exact specifications.
Target score: 10.0/10.0 - Perfect execution
Every specification is mandatory.
Quality is non-negotiable.
Premium positioning requires premium execution.
`;
};

// Generate ultra-premium blog prompts
const generateUltraPremiumBlogPrompt = (title, industry, topic, visual, colorHex) => {
  return `
ULTRA-PREMIUM BLOG FEATURED IMAGE - PERFECT 10.0 TARGET

=== ARTICLE CONTEXT ===

Title: ${title}
Industry: ${industry}
Topic: ${topic}
Target Color: ${colorHex}

Publishing Standard: Premium Editorial Magazine (NYT, Forbes, Wired level)

=== VISUAL CONCEPT ===

Visual Approach: ${visual}

Content Strategy:
- Article topic clearly communicated visually
- Professional and authoritative impression
- Educational and helpful tone
- Industry expertise unmistakably evident
- Compelling thumbnail (works at small size too)

=== TECHNICAL EXCELLENCE ===

Publication Quality:
- Magazine cover quality composition
- Professional photography standards
- Sharp, clear, well-exposed throughout
- Professional color grading applied
- Zero artifacts or quality issues
- Print and web ready

Image Specifications:
- Resolution: 1200x630 (Blog featured size)
- Sharpness: Crystal clear and focused
- Colors: Professional, natural, properly graded
- Exposure: Perfect with full tonal range
- Quality: Magazine publication standard

=== COMPOSITION MASTERY ===

Professional Composition:
- Rule-of-thirds positioning
- Clear visual hierarchy
- Interesting depth and layers
- Compelling foreground/background relationship
- Viewer attention guided naturally
- Professional framing with intention

Visual Storytelling:
- Article topic apparent without text
- Professional expertise evident
- Authoritative and credible impression
- Visual interest maintains attention
- Suitable for social media sharing
- Thumbnail effectiveness at small size

=== SUBJECT & CONTEXT ===

Professional Setting:
- Real, authentic environment
- Professional equipment/materials
- Clean and organized presentation
- Modern and contemporary aesthetic
- ${colorHex} accent color integrated
- Brand-aligned visual approach

Subject Matter:
- Clearly represents article topic
- Demonstrates industry knowledge
- Professional execution throughout
- Authentic and genuine presentation
- Not staged or artificial
- Real-world applicability obvious

=== COLOR & BRANDING ===

Color Palette:
- ${colorHex} as strategic accent color
- Professional secondary colors
- Harmonious color relationships
- Sophisticated color grading
- Brand consistency with Synthex aesthetic
- Proper saturation and tone

Brand Integration:
- Professional Synthex brand alignment
- Modern and contemporary feel
- Premium quality evident
- Industry-specific visual language
- Trustworthy and reliable impression

=== EMOTIONAL COMMUNICATION ===

Professional Tone:
- Authoritative and knowledgeable
- Trustworthy and reliable
- Helpful and educational
- Professional confidence evident
- Approachable and accessible
- Authentic and genuine

Viewer Response:
- "This looks professional and trustworthy"
- "The author/brand knows their subject"
- "I want to read this article"
- "This is quality content"
- "I trust this source"

=== SOCIAL SHARING OPTIMIZATION ===

Social Media Performance:
- Visually compelling at all sizes
- Works well in news feeds
- Thumbnail still clear and interesting
- Encourages click-through
- Professional platform representation
- Shareable and memorable

Engagement Factors:
- Visually stops scrolling
- Compels further exploration
- Conveys professionalism
- Generates trust and interest
- Drives article readership

=== FORBIDDEN ELEMENTS ===

Never include:
- Generic or stock photo appearance
- Blurry, soft, or unclear focus
- Poor, uneven, or amateur lighting
- Oversaturated or dull colors
- Visible watermarks or logos
- Awkward or unnatural poses
- Cluttered or messy composition
- Off-brand colors or aesthetic
- Cheap or low-quality materials
- Artificial or staged feeling
- Clichéd or overused concepts
- Poor exposure or color grading

=== 10.0 RATING SPECIFICATIONS ===

Magazine Quality: NYT, Forbes, Wired Editorial Standard
- Every technical element flawless
- Professional composition mastery evident
- Premium publication aesthetic

Content Alignment: Perfect article representation
- Topic immediately clear visually
- Professional expertise communicated
- Compelling visual storytelling
- Reader interest generated

Brand Excellence: Synthex brand embodied
- Professional aesthetic evident
- Color palette perfectly integrated
- Industry expertise clear
- Trustworthiness communicated

Originality & Impact: Distinctive and memorable
- Unique visual approach
- Not generic or stock-like
- Memorable composition
- Competitive differentiation

=== GENERATION INSTRUCTIONS ===

Generate featured image to these specifications.
Target Quality: 10.0/10.0 - Perfect execution
All specifications mandatory - no compromise
Magazine publication ready
Professional brand representation
Every detail serves composition purpose

This is premium editorial imagery - quality is everything.
`;
};

// Main execution
const main = async () => {
  console.log('\n████████████████████████████████████████████████████');
  console.log('█ SYNTHEX ULTRA-PREMIUM PROMPT GENERATOR              █');
  console.log('█ Target: Perfect 10.0 Quality Scores                 █');
  console.log('████████████████████████████████████████████████████\n');

  try {
    const phase1Config = loadConfig('phase1_concepts.json');
    const qualityConfig = loadConfig('phase1_quality_optimization.json');

    const ultraPremiumPrompts = {
      timestamp: new Date().toISOString(),
      phase: 'phase1_ultra_premium',
      target_average_score: 9.8,
      auto_approve_target: 45,
      concepts: []
    };

    // Generate industry card ultra-premium prompts
    console.log('📸 BATCH 1: Industry Cards (Ultra-Premium)');
    console.log('─────────────────────────────────────────\n');

    for (const industry of phase1Config.batch_1_industry_cards.industries) {
      console.log(`  ${industry.industry.toUpperCase()}`);

      for (const variation of industry.variations) {
        const ultraPrompt = generateUltraPremiumCardPrompt(
          industry.industry,
          variation.style,
          industry.color,
          variation.brief
        );

        ultraPremiumPrompts.concepts.push({
          id: variation.id,
          category: 'industry_card',
          industry: industry.industry,
          style: variation.style,
          color: industry.color,
          original_brief: variation.brief,
          ultra_premium_prompt: ultraPrompt,
          quality_target: 10.0,
          target_approval: 'auto_approve'
        });

        console.log(`    ✓ ${variation.id}`);
      }
    }

    // Generate hero ultra-premium prompts
    console.log('\n🎬 BATCH 2: Hero Section (Ultra-Premium)');
    console.log('────────────────────────────────────────\n');

    for (const variation of phase1Config.batch_2_hero_section.variations) {
      const ultraPrompt = generateUltraPremiumHeroPrompt(
        variation.title,
        variation.brief,
        variation.mood
      );

      ultraPremiumPrompts.concepts.push({
        id: variation.id,
        category: 'hero_section',
        title: variation.title,
        original_brief: variation.brief,
        ultra_premium_prompt: ultraPrompt,
        quality_target: 10.0,
        target_approval: 'auto_approve'
      });

      console.log(`  ✓ ${variation.id}`);
    }

    // Generate blog featured ultra-premium prompts
    console.log('\n📝 BATCH 3: Blog Featured (Ultra-Premium)');
    console.log('────────────────────────────────────────\n');

    for (const category of phase1Config.batch_3_blog_featured.categories) {
      console.log(`  ${category.industry.toUpperCase()}`);

      for (const article of category.articles) {
        const ultraPrompt = generateUltraPremiumBlogPrompt(
          article.title,
          category.industry,
          article.brief,
          'Professional editorial imagery',
          category.color
        );

        ultraPremiumPrompts.concepts.push({
          id: article.id,
          category: 'blog_featured',
          industry: category.industry,
          title: article.title,
          original_brief: article.brief,
          ultra_premium_prompt: ultraPrompt,
          quality_target: 10.0,
          target_approval: 'auto_approve'
        });

        console.log(`    ✓ ${article.id}`);
      }
    }

    // Save ultra-premium prompts
    const outputPath = path.join(
      __dirname,
      '../config/generation_configs/phase1_ultra_premium_prompts.json'
    );

    fs.writeFileSync(outputPath, JSON.stringify(ultraPremiumPrompts, null, 2));

    // Summary
    console.log('\n════════════════════════════════════════');
    console.log('ULTRA-PREMIUM PROMPTS GENERATED');
    console.log('════════════════════════════════════════');
    console.log(`✓ Total Prompts: ${ultraPremiumPrompts.concepts.length}`);
    console.log(`✓ Target Average Score: ${qualityConfig.target_metrics.average_quality_score}`);
    console.log(`✓ Auto-Approve Target: 100% (${ultraPremiumPrompts.concepts.length}/45)`);
    console.log(`✓ Minimum Score: 10.0 (no compromise)`);
    console.log(`\n📁 Saved to: ${outputPath}`);
    console.log('\n🎯 QUALITY SPECIFICATIONS:');
    console.log('   - Magazine publication standards');
    console.log('   - Fortune 500 brand aesthetic');
    console.log('   - Museum-quality execution');
    console.log('   - Zero tolerance for defects');
    console.log('   - Perfect scores across all dimensions');

  } catch (error) {
    console.error('\n✗ Fatal Error:', error.message);
    process.exit(1);
  }
};

main();
