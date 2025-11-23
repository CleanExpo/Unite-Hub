/**
 * Welcome Pack Markdown Template
 * Phase 47: Generates personalized welcome pack content
 */

export interface WelcomePackData {
  businessName: string;
  businessIndustry: string;
  targetAudience: string;
}

export function generateWelcomePackMarkdown(data: WelcomePackData): string {
  return `# Welcome to Unite-Hub, ${data.businessName}!

We're excited to have you on board. This welcome pack contains everything you need to get started and see real results within your first week.

---

## Your First 24 Hours Roadmap

### Hour 1-2: Foundation Setup
- [ ] Complete your business profile
- [ ] Add your website URL
- [ ] Upload your logo and brand colors

### Hour 3-4: Brand Assets
- [ ] Review visual inspiration pack
- [ ] Upload existing brand materials
- [ ] Set your brand voice preferences

### Hour 5-8: Content Foundation
- [ ] Connect your social accounts
- [ ] Run your first website audit
- [ ] Review SEO recommendations

### Hour 9-24: Launch Preparation
- [ ] Review and approve generated content
- [ ] Set up email integration
- [ ] Schedule your first campaign

---

## What We've Prepared For You

### 1. Visual Inspiration Pack
We've curated visual examples and design inspiration tailored to the **${data.businessIndustry}** industry. Use these as references for your content creation.

### 2. Initial SEO Snapshot
Once you connect your website, we'll analyze:
- Current search rankings
- Keyword opportunities
- Technical SEO health
- Competitor landscape

### 3. Brand Positioning Report
A starter analysis of how to position **${data.businessName}** effectively for **${data.targetAudience}**.

### 4. Content Templates
Pre-built templates for:
- Social media posts
- Email campaigns
- Blog outlines
- Ad copy

---

## Your Success Metrics

Track these key metrics during your first month:

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Profile Completion | 100% | Enables AI personalization |
| First Campaign | Week 1 | Quick wins build momentum |
| Website Audit | Day 1 | Baseline for improvement |
| Social Connections | Week 1 | Multi-channel reach |

---

## Getting Help

### Voice Commands
Say these to your AI assistant:
- "Run my website audit"
- "Show my onboarding progress"
- "What should I do next?"

### Quick Links
- [Dashboard](/client/dashboard)
- [Settings](/client/settings)
- [Support](/help)

---

## Important Notes

**Transparency First**: All AI-generated content requires your approval before it's published or sent to anyone.

**Your Data**: Your business information is used solely to personalize your experience and generate relevant content.

**No Lock-in**: You own all content generated for your business.

---

## Ready to Start?

Click the button below to begin your onboarding tasks. Each task is designed to take 5 minutes or less.

**Let's make ${data.businessName} stand out!**
`;
}
