# DALL-E 3 Integration - Quick Start Guide

## Setup (2 minutes)

### 1. Add OpenAI API Key
```bash
# In .env.local
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Test Installation
```bash
npm list openai
# Should show: openai@6.8.1
```

## Usage Examples

### Generate Marketing Images via API

```bash
# Generate 3 Instagram posts
curl -X POST http://localhost:3008/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "k17gxz...",
    "conceptType": "social_post",
    "platform": "instagram",
    "style": "modern",
    "size": "1024x1024",
    "quality": "standard",
    "variationCount": 3
  }'
```

### Use in Code

```typescript
import { generateImage, engineerPrompt } from "@/lib/dalle";

// Simple generation
const image = await generateImage({
  prompt: "Modern social media post for eco-friendly products",
  size: "1024x1024",
  quality: "standard"
});

// Advanced with prompt engineering
const prompt = engineerPrompt(
  "social_post",
  {
    businessName: "EcoLife",
    businessDescription: "Sustainable living products",
    brandColors: ["#22C55E", "#86EFAC"]
  },
  {
    platform: "instagram",
    style: "organic"
  }
);

const result = await generateImage({ prompt, size: "1024x1024" });
```

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images/generate` | POST | Generate new images |
| `/api/images/regenerate` | POST | Regenerate with new prompt |
| `/api/clients/[id]/images` | GET | List client images |
| `/api/clients/[id]/images/[imageId]` | GET/DELETE/PATCH | Manage single image |

## Concept Types

- `social_post` - Social media posts
- `product_mockup` - Product photography
- `marketing_visual` - Marketing materials
- `ad_creative` - Advertisement creatives
- `brand_concept` - Brand identity visuals

## Platforms

- `facebook` - 1:1 or 16:9
- `instagram` - 1:1 or 4:5
- `tiktok` - 9:16
- `linkedin` - 1:1 or 16:9
- `general` - Versatile

## Styles

- `modern` - Clean, contemporary
- `minimalist` - Simple, elegant
- `bold` - High-contrast, vibrant
- `organic` - Natural, earthy
- `professional` - Corporate
- `creative` - Artistic
- `luxury` - Premium
- `playful` - Fun, energetic

## Tier Limits

- **Starter**: 50 images/month, 3 variations
- **Professional**: 200 images/month, 5 variations

## Pricing

| Size | Quality | Cost |
|------|---------|------|
| 1024x1024 | Standard | $0.040 |
| 1792x1024 / 1024x1792 | Standard | $0.080 |
| 1024x1024 | HD | $0.080 |
| 1792x1024 / 1024x1792 | HD | $0.120 |

## Common Tasks

### Check Usage
```typescript
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const usage = await convex.query("usageTracking:getByOrgAndMetric", {
  orgId: "org_123",
  metricType: "images_generated"
});

console.log(`Used: ${usage.count}/${usage.limitAmount}`);
```

### Regenerate Image
```typescript
const response = await fetch("/api/images/regenerate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    imageId: "img_123",
    newPrompt: "Updated design with modern aesthetic",
    size: "1024x1024"
  })
});
```

### Get All Client Images
```typescript
const response = await fetch("/api/clients/client_123/images?conceptType=social_post");
const data = await response.json();

console.log(`Total images: ${data.count}`);
data.images.forEach(img => {
  console.log(`${img.conceptType} - ${img.platform}: ${img.imageUrl}`);
});
```

## Troubleshooting

### API Key Not Working
```bash
# Verify key is set
echo $OPENAI_API_KEY

# Test with OpenAI CLI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Usage Limit Reached
```typescript
// Check current usage
const usage = await convex.query("usageTracking:getByOrgAndMetric", {
  orgId: "org_123",
  metricType: "images_generated"
});

// Reset if needed (admin only)
await convex.mutation("usageTracking:resetForPeriod", {
  orgId: "org_123"
});
```

### Image Not Generating
1. Check API key validity
2. Verify client exists in database
3. Check usage limits
4. Review prompt for content policy violations
5. Check server logs for errors

## Best Practices

1. **Always use brand colors** - Extract from client assets
2. **Match platform specs** - Use correct size/aspect ratio
3. **Use appropriate style** - Match industry and brand
4. **Monitor usage** - Track to prevent overages
5. **Standard quality first** - Use HD only when needed
6. **Clear prompts** - Specific, descriptive prompts work best

## Next Steps

1. Test basic generation
2. Integrate with campaign creation
3. Add to client portal
4. Set up cloud storage
5. Implement analytics

## Documentation

- Full docs: `src/lib/dalle/README.md`
- Implementation: `DALLE_INTEGRATION.md`
- API reference: See endpoint files

## Support

For issues, check:
1. OpenAI API status
2. Usage limits
3. Server logs
4. Convex database queries
