# Social Copy Templates Specification

## Overview

The Social Copy Templates system provides 50+ pre-built templates per platform, AI-generated custom templates, tone variations, and performance predictions for all major social media platforms.

## Features

### Core Capabilities

1. **Template Library**: Browse 250+ pre-built templates across 5 platforms
2. **AI Generation**: Generate custom templates using Claude AI
3. **Tone Variations**: Create 7 different tone variations for any template
4. **Platform Previews**: See how posts look on each platform
5. **Performance Predictions**: Get engagement and reach estimates
6. **Bulk Operations**: Export, favorite, and delete multiple templates
7. **Search & Filter**: Find templates by platform, category, or keyword
8. **Character Counter**: Real-time validation for platform limits
9. **Hashtag Suggestions**: AI-powered hashtag recommendations
10. **Usage Tracking**: Monitor which templates perform best

### Supported Platforms

| Platform | Character Limit | Optimal Length | Templates |
|----------|----------------|----------------|-----------|
| Facebook | 63,206 | 250 | 50+ |
| Instagram | 2,200 | 125 | 50+ |
| TikTok | 2,200 | 150 | 50+ |
| LinkedIn | 3,000 | 150 | 50+ |
| Twitter | 280 | 240 | 50+ |

### Template Categories

1. **Promotional** - Sales, offers, product launches
2. **Educational** - Tips, tutorials, how-to guides
3. **Engagement** - Polls, questions, interactive content
4. **Brand Story** - Mission, values, behind-the-scenes
5. **User Generated** - Customer spotlights, testimonials
6. **Behind Scenes** - Team culture, process, workspace
7. **Product Launch** - New releases, limited editions
8. **Seasonal** - Holidays, events, time-sensitive
9. **Testimonial** - Reviews, success stories, social proof
10. **How To** - Step-by-step guides, instructions

### Tone Variations

1. **Professional** - Formal, polished, authoritative
2. **Casual** - Friendly, relaxed, conversational
3. **Inspirational** - Uplifting, motivating, aspirational
4. **Humorous** - Fun, entertaining, lighthearted
5. **Urgent** - Time-sensitive, action-driven, compelling
6. **Educational** - Informative, clear, helpful
7. **Emotional** - Heartfelt, personal, connecting

## Architecture

### Database Schema

```typescript
socialCopyTemplates: {
  clientId: Id<"clients">
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "twitter"
  category: "promotional" | "educational" | "engagement" | ...
  templateName: string
  copyText: string
  hashtags: string[]
  emojiSuggestions: string[]
  characterCount: number
  callToAction?: string
  variations: { copy: string, tone: string }[]
  performancePrediction: {
    estimatedReach: string
    estimatedEngagement: string
    bestTimeToPost: string
  }
  aiGenerated: boolean
  usageCount: number
  isFavorite: boolean
  tags: string[]
  createdAt: number
  updatedAt: number
}
```

### API Endpoints

#### Generate Templates
```
POST /api/social-templates/generate
Body: {
  clientId: string
  platform: string
  category: string
  count: number
  businessContext?: string
}
```

#### Get Templates
```
GET /api/clients/:id/social-templates
Query: ?platform=&category=&favoriteOnly=
```

#### Search Templates
```
GET /api/social-templates/search
Query: ?clientId=&query=
```

#### Update Template
```
PUT /api/social-templates/:id
Body: { updates: {...} }
```

#### Toggle Favorite
```
POST /api/social-templates/:id/favorite
```

#### Generate Variations
```
POST /api/social-templates/:id/variations
Body: { tones: string[], count: number }
```

#### Export Templates
```
POST /api/social-templates/export
Body: { clientId: string, format: "json" | "csv", templateIds?: string[] }
```

#### Bulk Operations
```
POST /api/social-templates/bulk
Body: { action: "delete" | "favorite" | "unfavorite", templateIds: string[] }
```

## Usage Guide

### For Developers

#### Initialize Master Templates
```typescript
import { ALL_MASTER_TEMPLATES } from "@/lib/social-templates/masterTemplates";
import { api } from "@/convex/_generated/api";

// Seed templates for a new client
async function seedTemplatesForClient(clientId: string) {
  const templates = ALL_MASTER_TEMPLATES.filter(
    t => t.platform === "facebook" // Or any platform
  );

  for (const template of templates) {
    await fetchMutation(api.socialTemplates.createTemplate, {
      clientId,
      ...template,
    });
  }
}
```

#### Generate Custom Templates
```typescript
const response = await fetch("/api/social-templates/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client123",
    platform: "instagram",
    category: "promotional",
    count: 10,
    businessContext: "E-commerce fashion brand targeting millennials",
  }),
});
```

#### Create Tone Variations
```typescript
const response = await fetch(`/api/social-templates/${templateId}/variations`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tones: ["professional", "casual", "inspirational"],
    count: 3,
  }),
});
```

### For Marketers

#### Workflow
1. Browse template library by platform and category
2. Preview templates in platform-specific format
3. Customize copy, hashtags, and CTAs
4. Generate tone variations for A/B testing
5. Copy to clipboard and use in social media scheduler
6. Track which templates get used most

#### Best Practices

**Facebook**
- Keep copy under 250 characters for maximum visibility
- Use 2-3 emojis strategically
- Include clear call-to-action
- Post between 1-3 PM on weekdays

**Instagram**
- First line must hook (shows before "more")
- Use 3-5 emojis for visual appeal
- Include 10-15 hashtags (mix popular and niche)
- Post between 11 AM-1 PM

**TikTok**
- Hook in first 3 words
- Use trending hashtags (#fyp, #foryou)
- Keep copy punchy and conversational
- Post between 7-9 PM

**LinkedIn**
- Professional but personable tone
- Start with compelling question or insight
- Include data/statistics when relevant
- Post between 8-10 AM Tuesday-Thursday

**Twitter**
- Every word counts (280 char limit)
- Use 1-2 hashtags maximum
- Be concise and witty
- Post between 12-2 PM

## Performance Metrics

### Benchmark Engagement Rates

| Platform | Avg Engagement Rate |
|----------|---------------------|
| Facebook | 0.18% |
| Instagram | 1.22% |
| TikTok | 5.96% |
| LinkedIn | 2.1% |
| Twitter | 0.045% |

### Template Performance Tracking

The system tracks:
- **Usage Count**: How many times template was copied
- **Platform Performance**: Which platforms get most engagement
- **Category Performance**: Which content types work best
- **Tone Performance**: Which tones resonate most
- **Time Performance**: Best posting times for your audience

## AI Generation

### Claude AI Integration

Templates are generated using Claude 3.5 Sonnet with:
- Platform-specific prompts
- Category guidelines
- Tone variations
- Performance predictions
- Hashtag research

### Prompt Engineering

Each platform has optimized prompts that include:
- Character limits and optimal lengths
- Platform-specific best practices
- Category goals and structures
- Tone characteristics
- Current trends and viral patterns

## Tier Limits

### Starter Tier
- 50 pre-built templates per platform
- 10 AI-generated templates per month
- Basic tone variations
- Standard performance predictions

### Professional Tier
- Unlimited pre-built templates
- Unlimited AI generation
- All 7 tone variations
- Advanced performance predictions
- Competitor hashtag analysis
- Custom prompt templates

## Roadmap

### Phase 1 (Current)
- ✅ 50+ templates per platform
- ✅ AI generation with Claude
- ✅ Tone variations
- ✅ Platform previews
- ✅ Export functionality

### Phase 2 (Q2 2025)
- 📋 A/B testing recommendations
- 📋 Historical performance tracking
- 📋 Automated posting integration
- 📋 Trend analysis dashboard
- 📋 Competitor copy analysis

### Phase 3 (Q3 2025)
- 📋 Video script templates
- 📋 Multi-platform campaign builder
- 📋 AI image generation integration
- 📋 Content calendar auto-population
- 📋 Performance-based recommendations

## Troubleshooting

### Common Issues

**Templates not generating**
- Check Anthropic API key is set
- Verify client has sufficient tier limits
- Check error logs for Claude API errors

**Character count mismatch**
- Ensure emoji counting is accurate (emojis = 2 chars)
- Verify platform limits are current
- Test with platform-specific validation

**Poor AI template quality**
- Provide more detailed business context
- Include target audience information
- Specify brand voice guidelines
- Review and regenerate if needed

**Export not working**
- Check file permissions
- Verify JSON/CSV formatting
- Test with smaller batch sizes

## Support

For questions or issues:
- Documentation: `/docs`
- API Reference: `/api-docs`
- Support: support@unite-hub.com
- GitHub Issues: [Unite-Hub Issues]

## License

Proprietary - Unite-Hub CRM © 2025
