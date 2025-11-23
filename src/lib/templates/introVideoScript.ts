/**
 * Intro Video Script Template
 * Phase 47: Generates personalized intro video/audio scripts
 */

export interface IntroScriptData {
  businessName: string;
  businessIndustry: string;
}

export function generateIntroVideoScript(data: IntroScriptData): string {
  return `# Welcome Video Script for ${data.businessName}

## Duration: 60-90 seconds
## Voice: Professional, warm, conversational

---

### [OPENING - 0:00-0:10]

Welcome to Unite-Hub! We're thrilled to have ${data.businessName} join our platform.

### [VALUE PROPOSITION - 0:10-0:25]

As a business in the ${data.businessIndustry} space, you know how important it is to stand out online. That's exactly what we're here to help you do.

Unite-Hub combines AI-powered marketing automation with genuine human insight to help you:
- Create compelling content
- Optimize your online presence
- Connect with your ideal customers

### [WHAT TO EXPECT - 0:25-0:45]

Over the next few minutes, we'll guide you through setting up your account. Here's what you'll accomplish:

First, you'll complete your business profile. This helps our AI understand your brand and create personalized content.

Then, you'll connect your website and social accounts. This unlocks our SEO tools and cross-platform optimization.

Finally, you'll review your personalized welcome pack, including visual inspiration and content templates tailored to your industry.

### [QUICK WIN - 0:45-0:60]

The best part? You'll see your first results within 24 hours. Our system will generate an initial website audit, brand positioning recommendations, and content ideas ready for your review.

### [CALL TO ACTION - 0:60-0:75]

Ready to get started? Click the "Begin Setup" button below, and let's make ${data.businessName} shine online.

We're here to help every step of the way. If you have questions, just ask your AI assistant or reach out to our support team.

### [CLOSING - 0:75-0:90]

Welcome aboard, and here's to your success!

---

## Production Notes

**Tone**: Encouraging but not salesy. Focus on practical value.

**Pacing**: Medium speed, clear enunciation.

**Background**: Light ambient music, modern and professional.

**Visuals** (if video):
- Dashboard interface screenshots
- Progress indicators
- Check marks as items are mentioned
- Brand-appropriate color scheme

---

## ElevenLabs Voice Settings (Suggested)

- Voice: Professional Female or Male
- Stability: 0.5
- Similarity: 0.75
- Style: 0.3
- Use Speaker Boost: Yes
`;
}
