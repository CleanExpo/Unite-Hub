# DALL-E 3 Setup Guide

Complete guide to set up OpenAI DALL-E 3 integration for Unite-Hub CRM's AI image generation features.

## Overview

Unite-Hub uses DALL-E 3 to:
- Generate marketing visuals for social media campaigns
- Create product mockups and concepts
- Design ad creatives based on campaign strategy
- Produce brand imagery aligned with client personas
- Generate platform-specific visual content (Facebook, Instagram, TikTok, LinkedIn)

## Prerequisites

- OpenAI account
- Credit card for billing (API usage is pay-as-you-go)
- Unite-Hub application with proper environment configuration
- Understanding of OpenAI's usage policies and content guidelines

---

## Step 1: Create OpenAI Account

### 1.1: Sign Up

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Click "Sign Up" in the top right
3. Choose sign-up method:
   - Continue with Google
   - Continue with Microsoft
   - Or use email address
4. Complete email verification if using email signup
5. Accept OpenAI's Terms of Service and Privacy Policy

### 1.2: Complete Profile

1. Log in to your OpenAI account
2. Complete your profile information:
   - Full name
   - Organization name: "Unite Group" (or your company name)
   - Use case: "Marketing automation and content generation"
   - Industry: "Marketing & Advertising"
3. Click "Continue"

---

## Step 2: Set Up Billing

DALL-E 3 requires a paid account (no free tier for image generation).

### 2.1: Add Payment Method

1. Navigate to [Billing Settings](https://platform.openai.com/account/billing/overview)
2. Click "Payment methods"
3. Click "Add payment method"
4. Enter credit card details:
   - Card number
   - Expiration date
   - CVC
   - Billing address
5. Click "Add card"

### 2.2: Set Up Budget Limits

**IMPORTANT**: Set budget limits to control costs.

1. Go to **Billing** > **Limits**
2. Set monthly budget limit:
   - **Recommended starting limit**: $50-100/month
   - **Production estimate**: $200-500/month (depends on usage)
3. Set up email notifications:
   - Alert at 50% of budget
   - Alert at 75% of budget
   - Alert at 90% of budget
4. Enable hard limit (optional but recommended for testing)

### 2.3: Add Budget for Auto-Recharge (Optional)

1. Click "Auto-recharge"
2. Set recharge amount: $100 (or your preferred amount)
3. Set recharge threshold: When balance falls below $25
4. Click "Save"

---

## Step 3: Generate API Key

### 3.1: Create API Key

1. Navigate to [API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Configure the key:
   - **Name**: `Unite-Hub Production` (or `Unite-Hub Dev` for development)
   - **Permissions**: All (or restrict to specific endpoints if needed)
   - **Project**: Default (or create a project)
4. Click "Create secret key"

### 3.2: Save API Key Securely

**CRITICAL**: You'll only see the key once!

1. Copy the API key: `sk-proj-...` or `sk-...`
2. Store it immediately in a secure location:
   - Password manager (recommended)
   - Encrypted file
   - Environment variable manager (e.g., Vercel, Railway)
3. **NEVER** commit the key to version control
4. **NEVER** share the key publicly or in logs

Example key format:
```
sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ
```

### 3.3: Create Separate Keys (Recommended)

For better security and tracking:

1. **Development key**: For local testing
   - Name: `Unite-Hub Development`
   - Lower rate limits
2. **Production key**: For live application
   - Name: `Unite-Hub Production`
   - Monitor usage closely
3. **Backup key**: Emergency fallback
   - Name: `Unite-Hub Backup`
   - Keep disabled until needed

---

## Step 4: Configure Environment Variables

Add to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxx  # Optional, for organization accounts

# DALL-E Specific Settings (optional, defaults provided)
DALLE_MODEL=dall-e-3
DALLE_DEFAULT_SIZE=1024x1024
DALLE_DEFAULT_QUALITY=standard
DALLE_DEFAULT_STYLE=vivid
```

For production (Vercel, Railway, etc.), add these environment variables through the platform's dashboard.

---

## Step 5: Understand DALL-E 3 Pricing

### 5.1: Current Pricing (as of 2025)

**DALL-E 3** pricing varies by resolution and quality:

| Resolution | Quality | Price per Image |
|------------|---------|----------------|
| 1024x1024  | Standard | $0.040 |
| 1024x1024  | HD | $0.080 |
| 1024x1792  | Standard | $0.080 |
| 1024x1792  | HD | $0.120 |
| 1792x1024  | Standard | $0.080 |
| 1792x1024  | HD | $0.120 |

### 5.2: Cost Estimation

**Example Usage Scenarios:**

**Starter Plan Client (5 images/month)**
- 5 images × $0.040 = **$0.20/month per client**
- 10 clients = **$2/month**

**Professional Plan Client (20 images/month)**
- 20 images × $0.040 = **$0.80/month per client**
- 10 clients = **$8/month**

**High-Volume Production (100 images/month)**
- 100 images × $0.040 = **$4/month**
- Mix of standard/HD: ~**$6-8/month**

**Budget Recommendations:**
- **Development/Testing**: $20-50/month
- **Small Production (1-10 clients)**: $50-100/month
- **Medium Production (10-50 clients)**: $100-300/month
- **Large Production (50+ clients)**: $300-1000/month

---

## Step 6: Test Image Generation

### 6.1: Test with curl

```bash
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A modern, minimalist logo for a marketing agency called Unite Group, professional, clean design, blue and white color scheme",
    "n": 1,
    "size": "1024x1024",
    "quality": "standard",
    "style": "vivid"
  }'
```

Expected response:
```json
{
  "created": 1710000000,
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revised_prompt": "..."
    }
  ]
}
```

### 6.2: Test with Node.js

Create a test script: `test-dalle.mjs`

```javascript
import OpenAI from 'openai';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testDalle() {
  console.log('Testing DALL-E 3 API...\n');

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A vibrant social media post background for a coffee shop, featuring coffee beans and warm autumn colors, modern and inviting',
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    });

    console.log('✅ Image generated successfully!');
    console.log('URL:', response.data[0].url);
    console.log('Revised prompt:', response.data[0].revised_prompt);

    // Download image
    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    fs.writeFileSync('test-image.png', Buffer.from(buffer));
    console.log('\n💾 Image saved to test-image.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDalle();
```

Run the test:
```bash
node test-dalle.mjs
```

### 6.3: Test Through Unite-Hub

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3008/dashboard/content`

3. Create a test campaign or use an existing client

4. Generate an image:
   - Select "Generate Marketing Visual"
   - Choose platform: Instagram
   - Enter prompt or use AI-suggested prompt
   - Click "Generate Image"

5. Verify:
   - Image appears in preview
   - Image URL is saved to database (Convex `imageConcepts` table)
   - Cost tracking is updated
   - Image can be downloaded

---

## Step 7: Cost Management & Optimization

### 7.1: Implement Cost Controls

Add these features to your application:

**1. Daily/Monthly Limits per Organization**
```javascript
const usage = await db.usageTracking.getByOrgAndMetric(
  orgId,
  'images_generated'
);

if (usage.count >= usage.limitAmount) {
  throw new Error('Monthly image generation limit reached');
}
```

**2. Image Generation Approval Flow**
```javascript
// Require admin approval for HD quality images
if (quality === 'hd' && !isAdmin) {
  throw new Error('HD images require admin approval');
}
```

**3. Caching Strategy**
```javascript
// Cache similar prompts to avoid regeneration
const cachedImage = await db.imageConcepts.findSimilarPrompt(prompt);
if (cachedImage && cacheAge < 7 * 24 * 60 * 60 * 1000) {
  return cachedImage; // Use cached image if less than 7 days old
}
```

### 7.2: Cost-Saving Tips

1. **Use Standard Quality**: Save 50% compared to HD
   - Standard (1024x1024): $0.040
   - HD (1024x1024): $0.080

2. **Optimize Prompts**: Better prompts = fewer regenerations
   - Be specific and detailed
   - Include style, colors, mood
   - Reference composition

3. **Batch Generation**: Generate multiple variations at once
   - More efficient than individual requests
   - Better prompt engineering

4. **Reuse Images**: Create a library of generic assets
   - Background textures
   - Common elements
   - Brand assets

5. **User Limits**: Enforce generation limits per tier
   - Starter: 5 images/month
   - Professional: 20 images/month
   - Enterprise: Unlimited (with budget cap)

### 7.3: Monitor Usage

1. Check OpenAI dashboard regularly:
   - [Usage Dashboard](https://platform.openai.com/usage)
   - View daily/monthly costs
   - Analyze cost trends

2. Set up monitoring in your app:
   ```javascript
   // Log every image generation with cost
   await db.auditLogs.create({
     action: 'image_generated',
     resource: 'dalle',
     details: {
       prompt,
       size,
       quality,
       estimatedCost: 0.040, // USD
     },
   });
   ```

3. Weekly cost reports:
   - Email summary to admin
   - Track cost per client
   - Identify high-usage clients

---

## Step 8: Rate Limiting & Error Handling

### 8.1: OpenAI Rate Limits

**DALL-E 3 Rate Limits (Tier 1 - Default)**
- **Images per minute (IPM)**: 5
- **Requests per minute (RPM)**: 5

**Higher tiers available with increased usage:**
- Tier 2: 7 IPM
- Tier 3: 7 IPM (higher RPM)
- Tier 4: 15 IPM
- Tier 5: 20 IPM

### 8.2: Implement Exponential Backoff

```javascript
async function generateWithRetry(prompt, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        ...options,
      });
    } catch (error) {
      if (error.status === 429) { // Rate limit
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Other errors - don't retry
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 8.3: Queue System for High Volume

For production with many concurrent requests:

```javascript
import PQueue from 'p-queue';

const imageQueue = new PQueue({
  concurrency: 1, // Process one at a time
  interval: 60000, // 1 minute
  intervalCap: 5, // 5 requests per minute
});

export async function queueImageGeneration(prompt, options) {
  return imageQueue.add(() => generateWithRetry(prompt, options));
}
```

---

## Step 9: Content Policy & Safety

### 9.1: OpenAI Content Policy

DALL-E 3 blocks prompts that violate policies:
- No violence or gore
- No sexual content
- No hate symbols
- No harassment
- No illegal activities
- No copyrighted characters/brands without permission

### 9.2: Prompt Filtering

Implement pre-filtering before sending to API:

```javascript
const BLOCKED_TERMS = [
  'nude', 'naked', 'violence', 'blood', 'weapon',
  // Add more based on your use case
];

function validatePrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lowerPrompt.includes(term)) {
      throw new Error(`Prompt contains prohibited content: ${term}`);
    }
  }
  return true;
}
```

### 9.3: Handle Moderation Errors

```javascript
try {
  const image = await openai.images.generate({ prompt, ... });
} catch (error) {
  if (error.code === 'content_policy_violation') {
    // Log for review
    await db.auditLogs.create({
      action: 'content_policy_violation',
      details: { prompt, error: error.message },
    });

    // User-friendly message
    throw new Error(
      'This prompt violates content policies. Please revise and try again.'
    );
  }
  throw error;
}
```

---

## Troubleshooting

### Error: "Incorrect API key provided"

**Cause**: Invalid or malformed API key

**Solution**:
1. Verify API key is correctly copied (no extra spaces)
2. Check environment variable is loaded: `console.log(process.env.OPENAI_API_KEY?.substring(0, 10))`
3. Regenerate API key if needed
4. Ensure no quotes around key in `.env.local`

### Error: "You exceeded your current quota"

**Cause**: No credits or budget limit reached

**Solution**:
1. Check billing: https://platform.openai.com/account/billing/overview
2. Add funds or increase budget
3. Review usage to identify unusual activity
4. Verify payment method is valid

### Error: "Rate limit exceeded"

**Cause**: Too many requests per minute

**Solution**:
1. Implement exponential backoff (see Step 8.2)
2. Use queue system for high volume
3. Request higher tier: https://platform.openai.com/account/limits
4. Space out requests

### Error: "Content policy violation"

**Cause**: Prompt violates OpenAI policies

**Solution**:
1. Review and revise prompt
2. Remove prohibited terms
3. Make prompt more professional/business-focused
4. Implement prompt pre-filtering

### Images Look Different Than Expected

**Cause**: DALL-E 3 revises prompts for safety/quality

**Solution**:
1. Check `revised_prompt` in API response
2. Use more specific descriptions
3. Include style keywords: "professional", "clean", "modern"
4. Specify colors, composition, mood explicitly
5. Iterate on prompt based on results

---

## Production Checklist

Before going live:

- [ ] Production API key created and secured
- [ ] Development and production keys separated
- [ ] Billing set up with budget limits
- [ ] Email alerts configured (50%, 75%, 90% of budget)
- [ ] Rate limiting implemented
- [ ] Error handling and retry logic in place
- [ ] Content policy filtering implemented
- [ ] Usage tracking in database
- [ ] Cost monitoring dashboard created
- [ ] User limits enforced (by subscription tier)
- [ ] Image caching strategy implemented
- [ ] Queue system for high volume (if needed)
- [ ] Generated images stored permanently (not just OpenAI CDN)
- [ ] Backup API key created (disabled)
- [ ] Usage alerts configured
- [ ] Monthly cost reports automated

---

## Additional Resources

- [OpenAI DALL-E Documentation](https://platform.openai.com/docs/guides/images)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/images)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [Content Policy](https://openai.com/policies/usage-policies)
- [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [Best Practices for Prompts](https://platform.openai.com/docs/guides/images/prompting)

---

## Support

For issues specific to Unite-Hub DALL-E integration:
- Check application logs for detailed error messages
- Review Convex function logs for image generation requests
- Monitor OpenAI usage dashboard for API issues
- Contact: contact@unite-group.in
