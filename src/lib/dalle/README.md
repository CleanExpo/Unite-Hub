# DALL-E 3 Integration

Complete DALL-E 3 image generation system for Unite-Hub CRM.

## Overview

This module provides AI-powered image generation for marketing campaigns, social media posts, and brand visuals using OpenAI's DALL-E 3 model.

## Features

- **Intelligent Prompt Engineering**: Automatically constructs optimized prompts based on client brand assets, business description, and platform requirements
- **Style System**: Pre-defined styles (modern, minimalist, bold, organic, etc.) with color palettes
- **Platform Optimization**: Generates images optimized for Facebook, Instagram, TikTok, LinkedIn
- **Tier-Based Variations**: 3 variations for Starter, 5 for Professional
- **Usage Tracking**: Monitors image generation limits per subscription tier
- **Cost Calculation**: Tracks DALL-E API costs per organization
- **Brand Consistency**: Extracts and applies client brand colors

## Directory Structure

```
lib/dalle/
├── client.ts       - DALL-E API client initialization and image generation
├── prompts.ts      - Prompt engineering helpers and context building
├── styles.ts       - Style definitions and color palette management
├── types.ts        - TypeScript type definitions
├── index.ts        - Module exports
└── README.md       - This file
```

## API Endpoints

### Generate Images
```
POST /api/images/generate
```

**Request:**
```json
{
  "clientId": "client_123",
  "conceptType": "social_post",
  "platform": "instagram",
  "style": "modern",
  "size": "1024x1024",
  "quality": "standard",
  "variationCount": 3
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "img_123",
      "url": "https://...",
      "revisedPrompt": "..."
    }
  ],
  "generated": 3,
  "cost": 0.12,
  "prompt": "..."
}
```

### Regenerate Image
```
POST /api/images/regenerate
```

**Request:**
```json
{
  "imageId": "img_123",
  "newPrompt": "Modern minimalist social media post for...",
  "size": "1024x1024",
  "quality": "standard"
}
```

### Get Client Images
```
GET /api/clients/[id]/images?conceptType=social_post&platform=instagram
```

### Delete Image
```
DELETE /api/clients/[id]/images/[imageId]
```

## Usage Examples

### Basic Image Generation

```typescript
import { generateImage } from "@/lib/dalle";

const result = await generateImage({
  prompt: "Modern social media post for eco-friendly products",
  size: "1024x1024",
  quality: "standard",
  style: "vivid"
});

console.log(result.url); // Generated image URL
```

### Advanced Prompt Engineering

```typescript
import { engineerPrompt } from "@/lib/dalle";

const prompt = engineerPrompt(
  "social_post",
  {
    businessName: "EcoLife",
    businessDescription: "Sustainable living products",
    brandColors: ["#22C55E", "#86EFAC"],
    keywords: ["eco-friendly", "sustainable", "natural"]
  },
  {
    platform: "instagram",
    aspectRatio: "1:1",
    style: "organic"
  }
);

console.log(prompt);
// "Create an engaging social media post image for EcoLife..."
```

### Generate Multiple Variations

```typescript
import { generateImageVariations } from "@/lib/dalle";

const variations = await generateImageVariations(
  "Modern product mockup for sustainable products",
  3,
  {
    size: "1024x1024",
    quality: "standard",
    style: "vivid"
  }
);

console.log(`Generated ${variations.length} variations`);
```

### Style Selection

```typescript
import { recommendStyleForIndustry, getStyleDefinition } from "@/lib/dalle";

// Automatically recommend style based on industry
const style = recommendStyleForIndustry("wellness");
console.log(style.name); // "Organic"

// Get specific style
const modernStyle = getStyleDefinition("modern");
console.log(modernStyle.colorPalettes);
```

## Concept Types

- **social_post**: Social media posts for feeds
- **product_mockup**: Product photography and mockups
- **marketing_visual**: General marketing materials
- **ad_creative**: Advertisement creatives
- **brand_concept**: Brand identity visuals

## Platform Specifications

- **Facebook**: 1:1 or 16:9, eye-catching visuals
- **Instagram**: 1:1 or 4:5, high aesthetic appeal
- **TikTok**: 9:16, bold and dynamic
- **LinkedIn**: 1:1 or 16:9, professional and polished
- **General**: Versatile for multiple platforms

## Style Definitions

1. **Modern**: Clean, contemporary design
2. **Minimalist**: Simple, elegant, abundant white space
3. **Bold**: High-contrast, vibrant colors
4. **Organic**: Natural, earthy tones
5. **Professional**: Corporate, trustworthy
6. **Creative**: Artistic, experimental
7. **Luxury**: Premium, high-end aesthetics
8. **Playful**: Fun, energetic, whimsical

## Tier Limits

### Starter Tier
- 50 images per month
- 3 variations per generation
- Standard quality

### Professional Tier
- 200 images per month
- 5 variations per generation
- HD quality available

## Cost Structure

DALL-E 3 Pricing (as of 2024):
- Standard 1024x1024: $0.040 per image
- Standard 1024x1792/1792x1024: $0.080 per image
- HD 1024x1024: $0.080 per image
- HD 1024x1792/1792x1024: $0.120 per image

## Error Handling

The system includes comprehensive error handling:

- **Invalid Prompt**: Content policy violations detected
- **Usage Limit Reached**: Subscription tier limits exceeded
- **API Errors**: DALL-E API failures handled gracefully
- **Missing Assets**: Defaults to standard color palettes

## Environment Variables

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Database Schema

Images are stored in the `imageConcepts` table with:
- clientId, campaignId (optional)
- conceptType, platform
- prompt, imageUrl, thumbnailUrl
- style, colorPalette, dimensions
- alternativeConcepts array
- usageRecommendations, technicalSpecs
- isUsed flag
- timestamps

## Future Enhancements

- [ ] Image color extraction from uploaded brand assets
- [ ] A/B testing framework for image variations
- [ ] Integration with social media scheduling
- [ ] Image editing and refinement tools
- [ ] Analytics on image performance
- [ ] Cloud storage integration (S3, Cloudinary)
- [ ] Image compression and optimization
- [ ] Watermark application
- [ ] Batch generation workflows

## Best Practices

1. **Brand Consistency**: Always extract and use client brand colors
2. **Platform Optimization**: Select appropriate size and aspect ratio
3. **Prompt Quality**: Use detailed, specific prompts for best results
4. **Usage Monitoring**: Track limits to prevent overages
5. **Cost Management**: Use standard quality unless HD is required
6. **Content Policy**: Ensure prompts comply with OpenAI guidelines

## Support

For issues or questions, contact the development team or refer to:
- OpenAI DALL-E Documentation: https://platform.openai.com/docs/guides/images
- Unite-Hub Documentation: Internal wiki
