# CONVEX Marketing Intelligence Module

## Overview

The CONVEX Marketing Intelligence Module integrates the full CONVEX methodology (brand positioning, funnel building, offer architecture, SEO dominance, competitive modeling) directly into Unite-Hub's multi-agent AI system.

## Version

- **Module Version**: 1.0.1
- **Compatible with**: Unite-Hub SaaS Platform

## Architecture

### Agent Integration

This module upgrades the following agents:

1. **Orchestrator Agent** - CONVEX-first strategy reasoning, brand matrices, funnel logic
2. **Marketing Intelligence Agent** - Enhanced campaign generation, segmentation, audience psychology
3. **SEO Agent** - Semantic cluster scoring, topical authority, intent mapping
4. **Market Shift Prediction Agent** - Early-warning system, competitor modeling
5. **Visual Intelligence Agent** - CONVEX brand psychology anchors

### Components

```
modules/convex/
├── README.md                          # This file
├── strategy_library.json              # Full CONVEX frameworks and patterns
├── reasoning_patterns.json            # Reasoning structures and compression rules
├── execution_templates/               # Ready-to-use templates
│   ├── convex_landing_page_template.md
│   ├── convex_seo_plan_template.md
│   ├── convex_paid_ads_template.md
│   └── convex_offer_architecture_template.md
├── agent_patches/                     # Agent enhancement patches
│   ├── orchestrator_patch.json
│   ├── marketing_agent_patch.json
│   ├── seo_agent_patch.json
│   ├── prediction_agent_patch.json
│   └── visual_agent_patch.json
├── ui/                                # React UI components
│   ├── ConvexStrategyDashboard.tsx
│   ├── ConvexSEOScoringOverlay.tsx
│   └── ConvexExecutionPanel.tsx
└── api/                               # Backend API
    ├── convexLibrary.ts
    └── convexScores.ts
```

## Frameworks Included

### Brand Positioning
- Category domination model
- Value ladder matrix
- Message compression framework
- Offer-audience precision fit
- Retention flywheel

### Funnel Design
- Awareness activation
- Micro-commitment sequencing
- Conversion tension points
- Social weight anchoring
- Emotional trigger mapping
- Frictionless CTA structure

### SEO Patterns
- Semantic cluster mapping
- Topical authority building
- Search intent mapping
- SERP gap exploitation
- Geo-signal consolidation
- Power content creation

### Competitor Modeling
- Feature-to-outcome mapping
- Weakness opportunity matrix
- Disruption early-warning
- Counterplay architecture

### Offer Architecture
- Offer strength scoring
- Feature→Outcome translation
- Risk reversal models
- Value expansion structure

## Safety Rules

1. **Truth Layer Validation** - All CONVEX outputs must pass Truth Layer validation
2. **No Fabrication** - Claims must be grounded in factual performance constraints
3. **Non-Defamatory** - Competitive comparisons must remain accurate and non-defamatory
4. **Compliance** - All outputs comply with platform safety rules

## Usage

After installation, any marketing, SEO, funnel, campaign, brand strategy, or competitive analysis request will automatically use CONVEX reasoning as the first-pass model.

### Automatic Activation

- UI tools appear automatically in founder and client dashboards
- All strategies generated use CONVEX-first reasoning
- SEO plans reference semantic clusters
- Funnel outputs follow micro-commitment flows
- Offer architecture is always present in recommendations

### Manual Override

To bypass CONVEX reasoning for a specific request, include `skipConvex: true` in the request options.

## Database Tables

The module creates the following tenant-specific tables (with RLS):

- `convex_strategies` - Stored strategy outputs
- `convex_seo_clusters` - Semantic cluster mappings
- `convex_competitor_profiles` - Competitor analysis data
- `convex_funnel_templates` - Custom funnel configurations

## Success Criteria

- All strategies generated use CONVEX-first reasoning
- SEO plans reference semantic clusters
- Funnel outputs follow micro-commitment flows
- Offer architecture is always present in recommendations
- Market shift early warnings increase accuracy

## Support

For issues or feature requests, contact the Unite-Hub development team.
