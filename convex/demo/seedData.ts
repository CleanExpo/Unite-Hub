import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getCurrentTimestamp, addDays } from "../lib/utils";

/**
 * DEMO DATA SEEDING
 * Helper mutations to seed sample data for demo client
 */

// Seed demo persona for tea business
export const seedPersona = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check if persona already exists for this client
    const existingPersona = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existingPersona) {
      return existingPersona._id;
    }

    const now = getCurrentTimestamp();

    const personaId = await ctx.db.insert("personas", {
      clientId: args.clientId,
      personaName: "Tea Enthusiast Emma",
      demographics: {
        ageRange: "28-45",
        gender: "Female",
        location: "Urban and suburban areas",
        income: "$60,000-$120,000",
        education: "Bachelor's degree or higher",
        occupation: "Professional, creative, or wellness-focused careers",
      },
      psychographics: {
        values: [
          "Health and wellness",
          "Sustainability",
          "Quality over quantity",
          "Mindfulness and self-care",
          "Cultural appreciation",
        ],
        interests: [
          "Wellness and healthy living",
          "Culinary experiences",
          "Travel and culture",
          "Sustainability and eco-friendly products",
          "Meditation and mindfulness",
        ],
        lifestyle: "Active, health-conscious lifestyle with appreciation for artisan products and cultural experiences",
        personality: "Curious, discerning, values authenticity and craftsmanship",
      },
      painPoints: [
        "Difficulty finding high-quality, authentic loose-leaf teas locally",
        "Uncertainty about tea preparation and brewing techniques",
        "Limited knowledge about tea origins and flavor profiles",
        "Concerns about pesticides and chemicals in mass-market teas",
        "Desire for a more premium tea experience at home",
      ],
      goals: [
        "Discover new and unique tea varieties",
        "Learn proper tea preparation techniques",
        "Create calming tea rituals for stress management",
        "Support sustainable and ethical tea producers",
        "Impress guests with premium tea experiences",
      ],
      buyingBehavior: {
        motivations: [
          "Quality and authenticity of tea",
          "Educational content and tea expertise",
          "Organic and sustainably sourced products",
          "Unique and rare tea varieties",
          "Recommendations and customer reviews",
        ],
        barriers: [
          "Higher price point compared to grocery store teas",
          "Lack of knowledge about tea varieties",
          "Uncertainty about online tea purchases",
          "Shipping costs and delivery time",
        ],
        decisionFactors: [
          "Product quality and sourcing transparency",
          "Educational resources and guidance",
          "Customer reviews and testimonials",
          "Brand authenticity and expertise",
          "Value for money",
        ],
      },
      communicationPreferences: [
        "Email newsletters with tea education content",
        "Instagram for visual inspiration and product showcases",
        "Educational blog posts and brewing guides",
        "Facebook community for tea enthusiasts",
      ],
      competitiveAwareness: "Aware of local tea shops and mainstream online tea retailers, but seeking more premium and educational experience",
      decisionMakingProcess: "Researches products, reads reviews, values expert recommendations, willing to invest in quality",
      generatedFromEmails: [],
      version: 1,
      isActive: true,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });

    return personaId;
  },
});

// Seed demo marketing strategy
export const seedStrategy = mutation({
  args: {
    clientId: v.id("clients"),
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check if strategy already exists
    const existingStrategy = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existingStrategy) {
      return existingStrategy._id;
    }

    const now = getCurrentTimestamp();

    const strategyId = await ctx.db.insert("marketingStrategies", {
      clientId: args.clientId,
      strategyTitle: "Premium Tea Education & Community Building Strategy",
      executiveSummary: "Position Duncan's Tea House as the premier destination for tea enthusiasts seeking quality, education, and community. Focus on content marketing that educates customers about tea culture, brewing techniques, and sustainability while building a loyal community of tea lovers.",
      marketAnalysis: "The specialty tea market is growing at 8% annually, driven by health-conscious consumers seeking alternatives to coffee and mass-market beverages. Customers increasingly value transparency, sustainability, and authentic experiences. The market opportunity lies in premium, educational tea retail that goes beyond product sales to create meaningful experiences.",
      targetAudience: "Health-conscious professionals aged 28-45, predominantly female, with household income of $60,000-$120,000. They value quality, sustainability, and wellness. They seek authentic experiences and are willing to invest in premium products that align with their values.",
      uniqueSellingProposition: "Duncan's Tea House offers curated, organic loose-leaf teas paired with expert education and a welcoming community. We don't just sell tea—we create tea experiences and empower customers to become tea connoisseurs in their own homes.",
      competitorAnalysis: "While local tea shops offer in-person experiences and online retailers provide convenience, Duncan's Tea House uniquely combines premium product quality with comprehensive education and community building. Our competitive advantage lies in our expertise, curation, and commitment to customer education.",
      marketingChannels: [
        {
          channel: "Instagram",
          description: "Visual storytelling featuring tea preparation, product showcases, and behind-the-scenes content",
          priority: "high" as const,
        },
        {
          channel: "Email Marketing",
          description: "Weekly educational newsletters with brewing tips, tea origins, and exclusive offers",
          priority: "high" as const,
        },
        {
          channel: "Facebook",
          description: "Community building through groups, events, and customer engagement",
          priority: "medium" as const,
        },
        {
          channel: "Content Marketing",
          description: "Blog posts and videos about tea culture, health benefits, and brewing techniques",
          priority: "high" as const,
        },
      ],
      contentStrategy: "Create educational, inspiring content that positions Duncan's Tea House as the trusted tea authority. Focus on three content pillars: Tea Education, Wellness & Lifestyle, and Sustainability. Use storytelling to connect customers with tea origins and artisan producers.",
      contentPillars: [
        "Tea Education & Brewing Mastery",
        "Wellness & Mindful Living",
        "Sustainability & Ethical Sourcing",
        "Tea Culture & Community",
      ],
      campaignCalendar: {
        Q1: "New Year Wellness Campaign - Focus on health benefits and tea rituals",
        Q2: "Spring Tea Harvest - Highlight fresh teas and seasonal varieties",
        Q3: "Iced Tea Innovation - Summer refreshment and cold brewing techniques",
        Q4: "Holiday Gift Guide - Premium tea gift sets and seasonal blends",
      },
      successMetrics: [
        {
          metric: "Email List Growth",
          target: "500 new subscribers per month",
          timeframe: "Monthly",
        },
        {
          metric: "Social Media Engagement",
          target: "5% engagement rate on Instagram",
          timeframe: "Monthly",
        },
        {
          metric: "Website Traffic",
          target: "30% increase in organic traffic",
          timeframe: "Quarterly",
        },
        {
          metric: "Customer Retention",
          target: "40% repeat purchase rate",
          timeframe: "Quarterly",
        },
      ],
      budgetGuidance: "Allocate 60% to content creation (photography, videography, copywriting), 25% to paid advertising (Instagram and Facebook ads), and 15% to email marketing tools and automation.",
      platformStrategies: [
        {
          platform: "instagram" as const,
          strategy: "Visual storytelling and community building through aesthetic tea photography, brewing tutorials, and behind-the-scenes content",
          tactics: [
            "Daily tea-spiration posts featuring beautiful tea moments",
            "Weekly brewing technique reels and tutorials",
            "Stories showcasing customer testimonials and tea journeys",
            "Monthly giveaways to build engagement",
            "User-generated content campaigns with branded hashtag",
          ],
        },
        {
          platform: "facebook" as const,
          strategy: "Community building through a private tea enthusiasts group and educational content",
          tactics: [
            "Weekly live Q&A sessions about tea",
            "Private Facebook group for tea lovers",
            "Event promotion for in-store tastings",
            "Customer testimonials and success stories",
            "Educational blog post sharing",
          ],
        },
        {
          platform: "linkedin" as const,
          strategy: "B2B outreach for corporate gifting and office tea programs",
          tactics: [
            "Thought leadership content about wellness in the workplace",
            "Corporate gifting case studies",
            "Professional networking with HR and office managers",
            "Workplace wellness tips featuring tea",
          ],
        },
      ],
      version: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return strategyId;
  },
});

// Seed demo calendar posts
export const seedCalendarPosts = mutation({
  args: {
    clientId: v.id("clients"),
    strategyId: v.id("marketingStrategies"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check if posts already exist
    const existingPosts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existingPosts) {
      const allPosts = await ctx.db
        .query("contentCalendarPosts")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
      return allPosts.map((p) => p._id);
    }

    const now = getCurrentTimestamp();
    const postIds: Id<"contentCalendarPosts">[] = [];

    // Create 7 sample posts across different platforms
    const samplePosts = [
      {
        scheduledDate: addDays(now, 1),
        platform: "instagram" as const,
        postType: "educational" as const,
        contentPillar: "Tea Education & Brewing Mastery",
        suggestedCopy: "The perfect cup starts with the perfect temperature 🌡️\n\nDid you know? Different teas require different water temperatures:\n• White tea: 160-185°F\n• Green tea: 170-185°F\n• Oolong tea: 185-205°F\n• Black tea: 200-212°F\n\nWhat's your favorite tea to brew? Share in the comments! 👇\n\n#TeaBrewing #TeaEducation #LooseLeafTea #TeaTips",
        suggestedHashtags: ["TeaBrewing", "TeaEducation", "LooseLeafTea", "TeaTips", "DuncansTeaHouse"],
        suggestedImagePrompt: "Elegant tea brewing setup with thermometer showing different temperatures, steam rising from a ceramic teapot, warm lighting, professional tea photography",
        aiReasoning: "Educational content performs well on Instagram by providing value. This post teaches proper brewing temperatures, encouraging saves and shares. The conversational tone invites engagement through comments.",
        bestTimeToPost: "9:00 AM - Morning tea time",
        targetAudience: "Tea enthusiasts seeking to improve their brewing skills",
        callToAction: "Comment your favorite tea to brew",
      },
      {
        scheduledDate: addDays(now, 2),
        platform: "facebook" as const,
        postType: "brand_story" as const,
        contentPillar: "Sustainability & Ethical Sourcing",
        suggestedCopy: "From farm to cup: The journey of our organic Darjeeling 🌱\n\nThis week's featured tea comes from a family-owned garden in the Himalayan foothills. The farmers use traditional methods passed down through generations, growing tea in harmony with nature.\n\nWhen you choose Duncan's Tea House, you're supporting sustainable farming practices and fair wages for tea farmers. Every cup tells a story of care, tradition, and respect for the land.\n\nLearn more about our sourcing practices: [link]\n\n#SustainableTea #EthicalSourcing #OrganicTea #TeaStory",
        suggestedHashtags: ["SustainableTea", "EthicalSourcing", "OrganicTea", "TeaStory"],
        suggestedImagePrompt: "Tea farmers in Darjeeling mountains harvesting tea leaves at sunrise, lush green tea garden, misty mountains in background, authentic documentary style",
        aiReasoning: "Brand story content builds emotional connection and communicates values. Facebook's audience responds well to longer-form storytelling and values-based content. This positions the brand as ethical and transparent.",
        bestTimeToPost: "1:00 PM - Lunchtime engagement peak",
        targetAudience: "Sustainability-conscious consumers who value ethical sourcing",
        callToAction: "Learn more about our sourcing practices",
      },
      {
        scheduledDate: addDays(now, 3),
        platform: "instagram" as const,
        postType: "engagement" as const,
        contentPillar: "Tea Culture & Community",
        suggestedCopy: "Weekend vibes = Tea + Good book 📚☕\n\nTag someone who would love this cozy moment! Double tap if this is your ideal Saturday.\n\nWhat book are you reading this weekend? Drop your recommendations below! 👇\n\n#TeaAndBooks #CozyVibes #WeekendTea #TeaCommunity #SelfCare",
        suggestedHashtags: ["TeaAndBooks", "CozyVibes", "WeekendTea", "TeaCommunity", "SelfCare"],
        suggestedImagePrompt: "Cozy flat lay with steaming tea cup, open book, soft blanket, natural window light, peaceful aesthetic, warm tones",
        aiReasoning: "Lifestyle engagement posts perform exceptionally well on weekends when users are relaxed and browsing leisurely. The 'tag someone' CTA drives shares and reach. Book recommendations generate comments and community interaction.",
        bestTimeToPost: "10:00 AM Saturday - Weekend browsing time",
        targetAudience: "Tea lovers who enjoy reading and cozy moments",
        callToAction: "Tag someone who would love this moment",
      },
      {
        scheduledDate: addDays(now, 4),
        platform: "linkedin" as const,
        postType: "promotional" as const,
        contentPillar: "Wellness & Mindful Living",
        suggestedCopy: "Elevate your workplace wellness program 🌿\n\nForward-thinking companies are discovering that premium tea moments create:\n• Mindful breaks that boost productivity\n• Healthier alternatives to coffee overload\n• Memorable client meeting experiences\n• Team bonding opportunities\n\nOur corporate tea programs include:\n✓ Curated tea selections for your office\n✓ Brewing equipment and guidance\n✓ Monthly tea tastings for your team\n✓ Flexible subscription options\n\nInterested in bringing premium tea to your workplace? Let's connect.\n\n#WorkplaceWellness #CorporateGifting #EmployeeWellbeing #PremiumTea",
        suggestedHashtags: ["WorkplaceWellness", "CorporateGifting", "EmployeeWellbeing", "PremiumTea"],
        suggestedImagePrompt: "Modern office break room with elegant tea station, diverse professionals enjoying tea together, bright professional setting, corporate wellness aesthetic",
        aiReasoning: "LinkedIn is ideal for B2B outreach. This post speaks to HR managers and business owners, connecting tea to tangible workplace benefits. The professional tone and clear value proposition encourage B2B inquiries.",
        bestTimeToPost: "8:00 AM Tuesday - Business day engagement",
        targetAudience: "HR managers, office administrators, business owners",
        callToAction: "Connect to learn about corporate programs",
      },
      {
        scheduledDate: addDays(now, 5),
        platform: "instagram" as const,
        postType: "promotional" as const,
        contentPillar: "Tea Education & Brewing Mastery",
        suggestedCopy: "NEW ARRIVAL 🎉 Himalayan Spring First Flush\n\nThe most anticipated tea of the year is here! This rare first harvest offers delicate floral notes with a crisp, refreshing finish.\n\nWhy tea lovers are obsessed:\n🌸 Limited harvest from high-altitude gardens\n🌸 Hand-picked during the first spring flush\n🌸 Complex flavor profile with orchid notes\n🌸 Only 100 packages available\n\nDon't miss out on this seasonal treasure. Link in bio to order while supplies last!\n\n#NewTea #FirstFlush #SpecialtyTea #LimitedEdition #TeaLovers",
        suggestedHashtags: ["NewTea", "FirstFlush", "SpecialtyTea", "LimitedEdition", "TeaLovers"],
        suggestedImagePrompt: "Premium tea packaging with fresh spring tea leaves, elegant presentation on marble surface, soft natural lighting, luxury product photography",
        aiReasoning: "Product launch posts with scarcity (limited availability) drive urgency and conversions. The educational element (explaining first flush) adds value while the promotional aspect drives sales. Instagram is perfect for visual product showcases.",
        bestTimeToPost: "11:00 AM - Late morning shopping time",
        targetAudience: "Existing customers and tea enthusiasts seeking rare varieties",
        callToAction: "Link in bio to order now",
      },
      {
        scheduledDate: addDays(now, 6),
        platform: "facebook" as const,
        postType: "engagement" as const,
        contentPillar: "Tea Culture & Community",
        suggestedCopy: "🍵 Quick Poll: What's your go-to tea time?\n\nWe're curious about our tea-loving community!\n\nReact with:\n❤️ Morning person (5-10 AM)\n👍 Midday break (12-2 PM)\n😊 Afternoon pick-me-up (3-5 PM)\n😍 Evening wind-down (6-9 PM)\n\nNo wrong answers—every tea time is the right tea time! What's your ritual?\n\n#TeaCommunity #TeaTime #TeaLovers #DuncansTeaHouse",
        suggestedHashtags: ["TeaCommunity", "TeaTime", "TeaLovers", "DuncansTeaHouse"],
        suggestedImagePrompt: "Split-panel image showing tea being enjoyed at different times of day: sunrise morning tea, afternoon tea break, cozy evening tea, lifestyle photography",
        aiReasoning: "Facebook's reaction feature enables easy interaction, driving engagement metrics. Polls and interactive content increase post visibility in the algorithm. This post builds community by learning about customer habits while requiring minimal effort to participate.",
        bestTimeToPost: "7:00 PM - Evening social media browsing",
        targetAudience: "Engaged community members who enjoy interactive content",
        callToAction: "React with your tea time preference",
      },
      {
        scheduledDate: addDays(now, 7),
        platform: "instagram" as const,
        postType: "educational" as const,
        contentPillar: "Wellness & Mindful Living",
        suggestedCopy: "5 teas for better sleep 😴🌙\n\nSwap the scrolling for sipping with these calming evening teas:\n\n1. Chamomile - Classic relaxation in a cup\n2. Lavender blend - Aromatherapy + flavor\n3. Passionflower - Natural stress relief\n4. Valerian root - Sleep support\n5. Lemon balm - Calming & delicious\n\nPro tip: Brew 30 minutes before bed as part of your wind-down ritual 🌟\n\nSave this for tonight! Which one will you try?\n\n#SleepTea #BedtimeRitual #HerbalTea #SleepBetter #WellnessTea",
        suggestedHashtags: ["SleepTea", "BedtimeRitual", "HerbalTea", "SleepBetter", "WellnessTea"],
        suggestedImagePrompt: "Peaceful bedtime scene with herbal tea on nightstand, soft dim lighting, cozy bedroom setting, calming aesthetic, evening wellness vibe",
        aiReasoning: "Educational wellness content with practical tips gets high saves (which boosts reach). Sleep is a universal concern, making this relatable to a broad audience. The 'save this' CTA encourages action that signals value to Instagram's algorithm.",
        bestTimeToPost: "8:00 PM Sunday - Evening wellness focus",
        targetAudience: "Health-conscious followers seeking better sleep and wellness",
        callToAction: "Save this for tonight",
      },
    ];

    for (const post of samplePosts) {
      const postId = await ctx.db.insert("contentCalendarPosts", {
        clientId: args.clientId,
        strategyId: args.strategyId,
        scheduledDate: post.scheduledDate,
        platform: post.platform,
        postType: post.postType,
        contentPillar: post.contentPillar,
        suggestedCopy: post.suggestedCopy,
        suggestedHashtags: post.suggestedHashtags,
        suggestedImagePrompt: post.suggestedImagePrompt,
        status: "suggested",
        aiReasoning: post.aiReasoning,
        bestTimeToPost: post.bestTimeToPost,
        targetAudience: post.targetAudience,
        callToAction: post.callToAction,
        createdAt: now,
        updatedAt: now,
      });
      postIds.push(postId);
    }

    return postIds;
  },
});
