/**
 * Seed Email Sequence Templates
 * Run this to populate the database with pre-built sequence templates
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const templates = [
      {
        name: "SaaS Cold Outreach",
        description: "5-step sequence for introducing your SaaS product to cold prospects. Focuses on value delivery, social proof, and permission-based follow-up.",
        category: "saas" as const,
        sequenceType: "cold_outreach" as const,
        industry: "Software / Technology",
        targetAudience: "B2B decision makers, managers, and executives in mid-size to enterprise companies",
        goal: "Book qualified demo calls with prospects who match ideal customer profile",
        totalSteps: 5,
        estimatedConversionRate: "3-5%",
        recommendedFor: ["SaaS companies", "B2B software", "Tech startups", "Platform businesses"],
        isPremium: false,
        popularityScore: 95,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Quick question about {company}",
            preview: "Personal introduction with specific value proposition relevant to their business...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "Resource for {company}",
            preview: "Valuable resource or insight with no strings attached...",
          },
          {
            stepNumber: 3,
            dayDelay: 4,
            subject: "How {competitor} achieved {result}",
            preview: "Case study showing specific results from similar company...",
          },
          {
            stepNumber: 4,
            dayDelay: 5,
            subject: "Should I close your file?",
            preview: "Permission-based breakup email that often gets responses...",
          },
          {
            stepNumber: 5,
            dayDelay: 7,
            subject: "One last thing for {company}",
            preview: "Final value add while leaving door open for future...",
          },
        ],
      },

      {
        name: "E-commerce Cart Recovery",
        description: "3-step sequence to recover abandoned shopping carts and complete purchases. Uses urgency, social proof, and incentives.",
        category: "ecommerce" as const,
        sequenceType: "re_engagement" as const,
        industry: "E-commerce / Retail",
        targetAudience: "Customers who added items to cart but didn't complete purchase",
        goal: "Recover abandoned carts and convert browsers into buyers",
        totalSteps: 3,
        estimatedConversionRate: "15-20%",
        recommendedFor: ["E-commerce stores", "Online retailers", "D2C brands", "Shopify stores"],
        isPremium: false,
        popularityScore: 90,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "You left something behind...",
            preview: "Friendly reminder about items in cart with easy checkout link...",
          },
          {
            stepNumber: 2,
            dayDelay: 1,
            subject: "Still thinking about it?",
            preview: "Social proof and reviews from happy customers...",
          },
          {
            stepNumber: 3,
            dayDelay: 2,
            subject: "Last chance - 10% off your cart",
            preview: "Limited-time discount to incentivize purchase...",
          },
        ],
      },

      {
        name: "Service Business Lead Nurture",
        description: "7-step nurture sequence for service-based businesses. Educates, builds trust, and positions expertise over time.",
        category: "service_business" as const,
        sequenceType: "lead_nurture" as const,
        industry: "Professional Services",
        targetAudience: "Leads who showed interest but haven't committed yet",
        goal: "Build trust, demonstrate expertise, and convert leads into paying clients",
        totalSteps: 7,
        estimatedConversionRate: "8-12%",
        recommendedFor: ["Consultants", "Agencies", "Professional services", "B2B services"],
        isPremium: false,
        popularityScore: 85,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Welcome! Here's what to expect",
            preview: "Set expectations and deliver immediate value...",
          },
          {
            stepNumber: 2,
            dayDelay: 2,
            subject: "Solving your {pain_point} challenge",
            preview: "Educational content addressing their biggest pain point...",
          },
          {
            stepNumber: 3,
            dayDelay: 4,
            subject: "Common mistakes with {topic}",
            preview: "Helpful insights and avoid common pitfalls...",
          },
          {
            stepNumber: 4,
            dayDelay: 6,
            subject: "How we helped {company} achieve {result}",
            preview: "Case study with specific, measurable results...",
          },
          {
            stepNumber: 5,
            dayDelay: 8,
            subject: "What makes our approach different",
            preview: "Unique methodology and service offering...",
          },
          {
            stepNumber: 6,
            dayDelay: 10,
            subject: "Ready to get started?",
            preview: "Clear CTA for consultation or discovery call...",
          },
          {
            stepNumber: 7,
            dayDelay: 12,
            subject: "Limited spots available this quarter",
            preview: "Scarcity and urgency to take action...",
          },
        ],
      },

      {
        name: "Product Launch Sequence",
        description: "5-step sequence for launching new products to existing customers and warm leads. Builds excitement and drives pre-orders.",
        category: "product_launch" as const,
        sequenceType: "custom" as const,
        industry: "All Industries",
        targetAudience: "Existing customers and warm leads on email list",
        goal: "Generate excitement, pre-orders, and successful product launch",
        totalSteps: 5,
        estimatedConversionRate: "10-15%",
        recommendedFor: ["Product companies", "E-commerce", "SaaS", "Consumer brands"],
        isPremium: false,
        popularityScore: 80,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Something exciting is coming...",
            preview: "Tease the launch and build anticipation...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "First look at {product}",
            preview: "Reveal the product with key benefits and features...",
          },
          {
            stepNumber: 3,
            dayDelay: 5,
            subject: "Behind the scenes: How we built {product}",
            preview: "Story and development process to build connection...",
          },
          {
            stepNumber: 4,
            dayDelay: 7,
            subject: "Early bird special - 24 hours only",
            preview: "Exclusive pre-order discount for email subscribers...",
          },
          {
            stepNumber: 5,
            dayDelay: 10,
            subject: "{product} is now live!",
            preview: "Official launch announcement with social proof...",
          },
        ],
      },

      {
        name: "Free Trial to Paid Conversion",
        description: "4-step onboarding sequence for trial users. Ensures activation, demonstrates value, and drives conversion.",
        category: "trial_conversion" as const,
        sequenceType: "onboarding" as const,
        industry: "SaaS / Software",
        targetAudience: "Users currently in free trial period",
        goal: "Activate trial users, demonstrate ROI, convert to paying customers",
        totalSteps: 4,
        estimatedConversionRate: "20-30%",
        recommendedFor: ["SaaS products", "Subscription services", "Software tools"],
        isPremium: false,
        popularityScore: 88,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Welcome to {product}! Get started in 5 minutes",
            preview: "Onboarding guide and quick win to show immediate value...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "Are you making the most of {feature}?",
            preview: "Highlight key features and use cases...",
          },
          {
            stepNumber: 3,
            dayDelay: 7,
            subject: "Your trial expires in {days} days",
            preview: "Reminder with success stories and pricing options...",
          },
          {
            stepNumber: 4,
            dayDelay: 12,
            subject: "Last day to save 20% on your subscription",
            preview: "Final conversion push with limited-time discount...",
          },
        ],
      },

      {
        name: "Customer Win-Back Campaign",
        description: "3-step sequence to re-engage churned or inactive customers. Highlights new features and offers incentives.",
        category: "win_back" as const,
        sequenceType: "re_engagement" as const,
        industry: "All Industries",
        targetAudience: "Customers who canceled or haven't engaged in 60+ days",
        goal: "Re-activate churned customers and bring them back to platform",
        totalSteps: 3,
        estimatedConversionRate: "5-8%",
        recommendedFor: ["Subscription businesses", "SaaS", "Membership sites", "Service businesses"],
        isPremium: false,
        popularityScore: 75,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "We miss you, {firstName}",
            preview: "Personal note acknowledging they left, teasing improvements...",
          },
          {
            stepNumber: 2,
            dayDelay: 4,
            subject: "Here's what you've been missing",
            preview: "Showcase new features, improvements since they left...",
          },
          {
            stepNumber: 3,
            dayDelay: 7,
            subject: "Come back - we'll make it worth your while",
            preview: "Special comeback offer or discount to return...",
          },
        ],
      },

      {
        name: "Customer Referral Request",
        description: "3-step sequence asking happy customers for referrals. Uses timing, incentives, and makes it easy to refer.",
        category: "referral" as const,
        sequenceType: "custom" as const,
        industry: "All Industries",
        targetAudience: "Satisfied customers with high engagement scores",
        goal: "Generate qualified referrals from existing customer base",
        totalSteps: 3,
        estimatedConversionRate: "10-15%",
        recommendedFor: ["All business types", "Service businesses", "B2B companies"],
        isPremium: false,
        popularityScore: 70,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Quick favor? 2 minutes of your time",
            preview: "Ask how they're doing, set up the referral ask...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "Know anyone struggling with {pain_point}?",
            preview: "Make referral ask specific and easy with template...",
          },
          {
            stepNumber: 3,
            dayDelay: 7,
            subject: "Thank you! Here's something for you too",
            preview: "Follow up with referral bonus or gift...",
          },
        ],
      },

      {
        name: "Webinar Promotion Sequence",
        description: "5-step sequence to promote webinar and maximize registrations. Builds interest and reduces no-shows.",
        category: "event_promotion" as const,
        sequenceType: "custom" as const,
        industry: "All Industries",
        targetAudience: "Email list subscribers and website visitors",
        goal: "Drive webinar registrations and ensure high attendance",
        totalSteps: 5,
        estimatedConversionRate: "12-18%",
        recommendedFor: ["B2B companies", "Education", "SaaS", "Consultants"],
        isPremium: false,
        popularityScore: 78,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Join us: {webinar_topic} masterclass",
            preview: "Announce webinar with key takeaways and benefits...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "What you'll learn in our {topic} webinar",
            preview: "Detailed agenda and speaker credentials...",
          },
          {
            stepNumber: 3,
            dayDelay: 5,
            subject: "Last chance to register - {seats} spots left",
            preview: "Create urgency with limited availability...",
          },
          {
            stepNumber: 4,
            dayDelay: 7,
            subject: "Tomorrow: Join us for {webinar}",
            preview: "Reminder 24 hours before with calendar invite...",
          },
          {
            stepNumber: 5,
            dayDelay: 8,
            subject: "Starting in 1 hour! Here's your link",
            preview: "Final reminder with join link and what to prepare...",
          },
        ],
      },

      {
        name: "Customer Upsell Sequence",
        description: "4-step sequence to upgrade existing customers to premium plans. Shows value of upgrade and makes transition easy.",
        category: "upsell" as const,
        sequenceType: "custom" as const,
        industry: "SaaS / Software",
        targetAudience: "Existing customers on basic or starter plans",
        goal: "Upgrade customers to higher-tier plans and increase MRR",
        totalSteps: 4,
        estimatedConversionRate: "15-20%",
        recommendedFor: ["SaaS", "Subscription services", "Membership sites"],
        isPremium: true,
        popularityScore: 82,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Unlock the full power of {product}",
            preview: "Show what they're missing with premium features...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "How {company} 10x'd results with Premium",
            preview: "Case study of similar customer upgrading...",
          },
          {
            stepNumber: 3,
            dayDelay: 5,
            subject: "Your personalized upgrade plan",
            preview: "Custom recommendation based on their usage...",
          },
          {
            stepNumber: 4,
            dayDelay: 7,
            subject: "Upgrade today, save 25%",
            preview: "Limited-time upgrade discount to close the deal...",
          },
        ],
      },

      {
        name: "Newsletter Welcome Series",
        description: "4-step welcome sequence for new newsletter subscribers. Establishes value and reading habit.",
        category: "newsletter" as const,
        sequenceType: "onboarding" as const,
        industry: "All Industries",
        targetAudience: "New newsletter subscribers",
        goal: "Engage new subscribers and establish regular reading habit",
        totalSteps: 4,
        estimatedConversionRate: "40-50%",
        recommendedFor: ["Content creators", "Publishers", "Thought leaders", "Bloggers"],
        isPremium: false,
        popularityScore: 72,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Welcome! Here's what you signed up for",
            preview: "Set expectations and deliver on promise immediately...",
          },
          {
            stepNumber: 2,
            dayDelay: 2,
            subject: "Our most popular content",
            preview: "Share best articles and resources...",
          },
          {
            stepNumber: 3,
            dayDelay: 5,
            subject: "A personal note from {founder}",
            preview: "Build connection with personal story...",
          },
          {
            stepNumber: 4,
            dayDelay: 7,
            subject: "How to get the most from our newsletter",
            preview: "Tips for engaging with content and community...",
          },
        ],
      },

      {
        name: "Partnership Outreach",
        description: "5-step sequence for B2B partnership proposals. Professional, value-focused approach for strategic partnerships.",
        category: "partner_outreach" as const,
        sequenceType: "cold_outreach" as const,
        industry: "B2B / Enterprise",
        targetAudience: "Potential business partners and strategic collaborators",
        goal: "Establish strategic business partnerships and collaborations",
        totalSteps: 5,
        estimatedConversionRate: "5-8%",
        recommendedFor: ["B2B companies", "Agencies", "SaaS", "Enterprise"],
        isPremium: true,
        popularityScore: 68,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Partnership opportunity for {company}",
            preview: "Professional introduction with mutual value prop...",
          },
          {
            stepNumber: 2,
            dayDelay: 4,
            subject: "How {partner} benefited from collaboration",
            preview: "Case study of successful partnership...",
          },
          {
            stepNumber: 3,
            dayDelay: 7,
            subject: "Partnership proposal for review",
            preview: "Detailed partnership proposal document...",
          },
          {
            stepNumber: 4,
            dayDelay: 10,
            subject: "Thoughts on the partnership?",
            preview: "Follow up with specific questions...",
          },
          {
            stepNumber: 5,
            dayDelay: 14,
            subject: "Let's schedule a call",
            preview: "Direct ask for partnership discussion...",
          },
        ],
      },

      {
        name: "Event Follow-up Sequence",
        description: "3-step follow-up after trade shows, conferences, or networking events. Converts warm leads into sales conversations.",
        category: "event_promotion" as const,
        sequenceType: "lead_nurture" as const,
        industry: "B2B / Events",
        targetAudience: "Leads collected at events, trade shows, or conferences",
        goal: "Convert event leads into qualified sales opportunities",
        totalSteps: 3,
        estimatedConversionRate: "12-15%",
        recommendedFor: ["B2B companies", "Event organizers", "Sales teams"],
        isPremium: false,
        popularityScore: 65,
        stepsPreview: [
          {
            stepNumber: 1,
            dayDelay: 0,
            subject: "Great meeting you at {event}",
            preview: "Personal follow-up referencing specific conversation...",
          },
          {
            stepNumber: 2,
            dayDelay: 3,
            subject: "That resource I mentioned",
            preview: "Deliver promised resource or information...",
          },
          {
            stepNumber: 3,
            dayDelay: 7,
            subject: "Next steps from our {event} conversation",
            preview: "Clear CTA for demo, call, or meeting...",
          },
        ],
      },
    ];

    // Insert all templates
    for (const template of templates) {
      await ctx.db.insert("emailSequenceTemplates", {
        ...template,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      templatesCreated: templates.length,
      message: "Email sequence templates seeded successfully",
    };
  },
});

// Helper mutation to clear all templates (for re-seeding)
export const clearTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("emailSequenceTemplates").collect();

    for (const template of templates) {
      await ctx.db.delete(template._id);
    }

    return {
      success: true,
      templatesDeleted: templates.length,
    };
  },
});
