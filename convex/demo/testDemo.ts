import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * DEMO TESTING UTILITIES
 * Test mutations to verify demo data creation
 */

// Test complete demo flow
export const testDemoFlow = mutation({
  args: {},
  handler: async (ctx) => {
    const results: any = {
      steps: [],
      success: true,
      errors: [],
    };

    try {
      // Step 1: Create demo org
      results.steps.push("Creating demo organization...");
      const orgId = await ctx.runMutation("organizations:createDemoOrg", {});
      results.orgId = orgId;
      results.steps.push(`✓ Demo org created: ${orgId}`);

      // Step 2: Create demo client
      results.steps.push("Creating demo client...");
      const clientId = await ctx.runMutation("clients:createDemoClient", {
        orgId,
      });
      results.clientId = clientId;
      results.steps.push(`✓ Demo client created: ${clientId}`);

      // Step 3: Verify client
      const client = await ctx.db.get(clientId);
      if (!client) throw new Error("Client not found after creation");
      results.steps.push(`✓ Client verified: ${client.businessName}`);

      // Step 4: Create persona
      results.steps.push("Creating demo persona...");
      const personaId = await ctx.runMutation("demo/seedData:seedPersona", {
        clientId,
      });
      results.personaId = personaId;
      results.steps.push(`✓ Persona created: ${personaId}`);

      // Step 5: Create strategy
      results.steps.push("Creating demo strategy...");
      const strategyId = await ctx.runMutation("demo/seedData:seedStrategy", {
        clientId,
        personaId,
      });
      results.strategyId = strategyId;
      results.steps.push(`✓ Strategy created: ${strategyId}`);

      // Step 6: Create calendar posts
      results.steps.push("Creating demo calendar posts...");
      const postIds = await ctx.runMutation(
        "demo/seedData:seedCalendarPosts",
        {
          clientId,
          strategyId,
        }
      );
      results.postIds = postIds;
      results.steps.push(`✓ Created ${postIds.length} calendar posts`);

      results.steps.push("✓ Demo flow completed successfully!");
      return results;
    } catch (error: any) {
      results.success = false;
      results.errors.push(error.message);
      results.steps.push(`✗ Error: ${error.message}`);
      return results;
    }
  },
});

// Get demo stats
export const getDemoStats = query({
  args: {},
  handler: async (ctx) => {
    // Find demo org
    const demoOrg = await ctx.db
      .query("organizations")
      .withIndex("by_email", (q) => q.eq("email", "demo@unite-hub.com"))
      .first();

    if (!demoOrg) {
      return {
        exists: false,
        message: "Demo organization not found",
      };
    }

    // Get demo clients
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", demoOrg._id))
      .collect();

    const demoClient = clients.find((c) => c.businessName === "Duncan's Tea House");

    if (!demoClient) {
      return {
        exists: true,
        hasOrg: true,
        hasClient: false,
        message: "Demo organization exists but no client",
      };
    }

    // Get all demo data
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    const calendarPosts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    const emailThreads = await ctx.db
      .query("emailThreads")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    const assets = await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    return {
      exists: true,
      hasOrg: true,
      hasClient: true,
      demo: {
        organization: {
          id: demoOrg._id,
          name: demoOrg.name,
          email: demoOrg.email,
        },
        client: {
          id: demoClient._id,
          name: demoClient.businessName,
          status: demoClient.status,
          tier: demoClient.packageTier,
        },
        counts: {
          personas: personas.length,
          strategies: strategies.length,
          calendarPosts: calendarPosts.length,
          emailThreads: emailThreads.length,
          assets: assets.length,
        },
        details: {
          activePersona: personas.find((p) => p.isActive)?.personaName,
          activeStrategy: strategies.find((s) => s.isActive)?.strategyTitle,
          upcomingPosts: calendarPosts.filter(
            (p) => p.scheduledDate > Date.now()
          ).length,
        },
      },
    };
  },
});

// Verify demo data integrity
export const verifyDemoIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const checks: any[] = [];
    let allPassed = true;

    // Check 1: Demo org exists
    const demoOrg = await ctx.db
      .query("organizations")
      .withIndex("by_email", (q) => q.eq("email", "demo@unite-hub.com"))
      .first();

    checks.push({
      check: "Demo organization exists",
      passed: !!demoOrg,
      details: demoOrg ? `Found: ${demoOrg.name}` : "Not found",
    });

    if (!demoOrg) {
      allPassed = false;
      return { passed: allPassed, checks };
    }

    // Check 2: Demo client exists
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", demoOrg._id))
      .collect();

    const demoClient = clients.find((c) => c.businessName === "Duncan's Tea House");

    checks.push({
      check: "Demo client exists",
      passed: !!demoClient,
      details: demoClient ? `Found: ${demoClient.businessName}` : "Not found",
    });

    if (!demoClient) {
      allPassed = false;
      return { passed: allPassed, checks };
    }

    // Check 3: Client has primary email
    const primaryEmail = await ctx.db
      .query("clientEmails")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .filter((q) => q.eq(q.field("isPrimary"), true))
      .first();

    checks.push({
      check: "Client has primary email",
      passed: !!primaryEmail,
      details: primaryEmail
        ? `Email: ${primaryEmail.emailAddress}`
        : "No primary email",
    });

    if (!primaryEmail) allPassed = false;

    // Check 4: Client has contact info
    const contactInfo = await ctx.db
      .query("clientContactInfo")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .first();

    checks.push({
      check: "Client has contact info",
      passed: !!contactInfo,
      details: contactInfo ? "Contact info exists" : "No contact info",
    });

    if (!contactInfo) allPassed = false;

    // Check 5: Client has persona
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    checks.push({
      check: "Client has persona",
      passed: personas.length > 0,
      details: `Found ${personas.length} persona(s)`,
    });

    if (personas.length === 0) allPassed = false;

    // Check 6: Client has strategy
    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    checks.push({
      check: "Client has marketing strategy",
      passed: strategies.length > 0,
      details: `Found ${strategies.length} strateg(ies)`,
    });

    if (strategies.length === 0) allPassed = false;

    // Check 7: Client has calendar posts
    const calendarPosts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", demoClient._id))
      .collect();

    checks.push({
      check: "Client has calendar posts",
      passed: calendarPosts.length > 0,
      details: `Found ${calendarPosts.length} post(s)`,
    });

    if (calendarPosts.length === 0) allPassed = false;

    // Check 8: Active persona exists
    const activePersona = personas.find((p) => p.isActive);

    checks.push({
      check: "Has active persona",
      passed: !!activePersona,
      details: activePersona
        ? `Active: ${activePersona.personaName}`
        : "No active persona",
    });

    if (!activePersona) allPassed = false;

    // Check 9: Active strategy exists
    const activeStrategy = strategies.find((s) => s.isActive);

    checks.push({
      check: "Has active strategy",
      passed: !!activeStrategy,
      details: activeStrategy
        ? `Active: ${activeStrategy.strategyTitle}`
        : "No active strategy",
    });

    if (!activeStrategy) allPassed = false;

    return {
      passed: allPassed,
      summary: `${checks.filter((c) => c.passed).length}/${checks.length} checks passed`,
      checks,
    };
  },
});
