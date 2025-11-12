import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp, getNextVersion } from "./lib/utils";
import {
  demographicsValidator,
  psychographicsValidator,
  buyingBehaviorValidator,
  isNonEmptyArray,
} from "./lib/validators";
import { canCreateMultiplePersonas } from "./lib/permissions";

/**
 * PERSONAS - AI-generated customer personas
 * CRUD, versioning, history management
 */

// Create persona
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    personaName: v.string(),
    demographics: demographicsValidator,
    psychographics: psychographicsValidator,
    painPoints: v.array(v.string()),
    goals: v.array(v.string()),
    buyingBehavior: buyingBehaviorValidator,
    communicationPreferences: v.array(v.string()),
    competitiveAwareness: v.optional(v.string()),
    decisionMakingProcess: v.optional(v.string()),
    generatedFromEmails: v.optional(v.array(v.id("emailThreads"))),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check if multi-persona is allowed for this tier
    if (!canCreateMultiplePersonas(client.packageTier)) {
      // Check if a persona already exists
      const existingPersona = await ctx.db
        .query("personas")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .first();

      if (existingPersona) {
        throw new Error(
          "Multiple personas not available on Starter plan. Upgrade to Professional."
        );
      }
    }

    // Validate arrays
    if (!isNonEmptyArray(args.painPoints)) {
      throw new Error("At least one pain point is required");
    }
    if (!isNonEmptyArray(args.goals)) {
      throw new Error("At least one goal is required");
    }

    // Get latest version for this client
    const existingPersonas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const maxVersion = existingPersonas.reduce(
      (max, p) => Math.max(max, p.version),
      0
    );
    const newVersion = maxVersion + 1;

    const now = getCurrentTimestamp();

    const personaId = await ctx.db.insert("personas", {
      clientId: args.clientId,
      personaName: args.personaName.trim(),
      demographics: args.demographics,
      psychographics: args.psychographics,
      painPoints: args.painPoints,
      goals: args.goals,
      buyingBehavior: args.buyingBehavior,
      communicationPreferences: args.communicationPreferences,
      competitiveAwareness: args.competitiveAwareness,
      decisionMakingProcess: args.decisionMakingProcess,
      generatedFromEmails: args.generatedFromEmails || [],
      version: newVersion,
      isActive: true,
      isPrimary: args.isPrimary ?? existingPersonas.length === 0,
      createdAt: now,
      updatedAt: now,
    });

    return personaId;
  },
});

// Get persona by ID
export const get = query({
  args: { personaId: v.id("personas") },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");
    return persona;
  },
});

// List personas for a client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId));

    const personas = await query.collect();

    if (args.activeOnly) {
      return personas.filter((p) => p.isActive);
    }

    return personas.sort((a, b) => b.version - a.version);
  },
});

// Get active personas for a client
export const getActive = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_client_and_active", (q) =>
        q.eq("clientId", args.clientId).eq("isActive", true)
      )
      .collect();
  },
});

// Get primary persona for a client
export const getPrimary = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_client_and_active", (q) =>
        q.eq("clientId", args.clientId).eq("isActive", true)
      )
      .collect();

    return personas.find((p) => p.isPrimary) || personas[0] || null;
  },
});

// Update persona
export const update = mutation({
  args: {
    personaId: v.id("personas"),
    personaName: v.optional(v.string()),
    demographics: v.optional(demographicsValidator),
    psychographics: v.optional(psychographicsValidator),
    painPoints: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    buyingBehavior: v.optional(buyingBehaviorValidator),
    communicationPreferences: v.optional(v.array(v.string())),
    competitiveAwareness: v.optional(v.string()),
    decisionMakingProcess: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    const updates: Partial<Doc<"personas">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.personaName) updates.personaName = args.personaName.trim();
    if (args.demographics) updates.demographics = args.demographics;
    if (args.psychographics) updates.psychographics = args.psychographics;
    if (args.painPoints) updates.painPoints = args.painPoints;
    if (args.goals) updates.goals = args.goals;
    if (args.buyingBehavior) updates.buyingBehavior = args.buyingBehavior;
    if (args.communicationPreferences)
      updates.communicationPreferences = args.communicationPreferences;
    if (args.competitiveAwareness !== undefined)
      updates.competitiveAwareness = args.competitiveAwareness;
    if (args.decisionMakingProcess !== undefined)
      updates.decisionMakingProcess = args.decisionMakingProcess;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.isPrimary !== undefined) updates.isPrimary = args.isPrimary;

    await ctx.db.patch(args.personaId, updates);
    return args.personaId;
  },
});

// Set primary persona
export const setPrimary = mutation({
  args: {
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    // Unset primary for all other personas of this client
    const allPersonas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", persona.clientId))
      .collect();

    for (const p of allPersonas) {
      if (p._id !== args.personaId && p.isPrimary) {
        await ctx.db.patch(p._id, { isPrimary: false });
      }
    }

    // Set this persona as primary
    await ctx.db.patch(args.personaId, {
      isPrimary: true,
      isActive: true,
    });

    return args.personaId;
  },
});

// Create new version of persona
export const createVersion = mutation({
  args: {
    personaId: v.id("personas"),
    changes: v.object({
      personaName: v.optional(v.string()),
      demographics: v.optional(demographicsValidator),
      psychographics: v.optional(psychographicsValidator),
      painPoints: v.optional(v.array(v.string())),
      goals: v.optional(v.array(v.string())),
      buyingBehavior: v.optional(buyingBehaviorValidator),
      communicationPreferences: v.optional(v.array(v.string())),
      competitiveAwareness: v.optional(v.string()),
      decisionMakingProcess: v.optional(v.string()),
    }),
    generatedFromEmails: v.optional(v.array(v.id("emailThreads"))),
  },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    // Deactivate old version
    await ctx.db.patch(args.personaId, {
      isActive: false,
      updatedAt: getCurrentTimestamp(),
    });

    // Create new version
    const now = getCurrentTimestamp();
    const newVersion = getNextVersion(persona.version);

    const newPersonaId = await ctx.db.insert("personas", {
      clientId: persona.clientId,
      personaName: args.changes.personaName || persona.personaName,
      demographics: args.changes.demographics || persona.demographics,
      psychographics: args.changes.psychographics || persona.psychographics,
      painPoints: args.changes.painPoints || persona.painPoints,
      goals: args.changes.goals || persona.goals,
      buyingBehavior: args.changes.buyingBehavior || persona.buyingBehavior,
      communicationPreferences:
        args.changes.communicationPreferences || persona.communicationPreferences,
      competitiveAwareness:
        args.changes.competitiveAwareness || persona.competitiveAwareness,
      decisionMakingProcess:
        args.changes.decisionMakingProcess || persona.decisionMakingProcess,
      generatedFromEmails: [
        ...persona.generatedFromEmails,
        ...(args.generatedFromEmails || []),
      ],
      version: newVersion,
      isActive: true,
      isPrimary: persona.isPrimary,
      createdAt: now,
      updatedAt: now,
    });

    return newPersonaId;
  },
});

// Get persona version history
export const getVersionHistory = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return personas.sort((a, b) => b.version - a.version);
  },
});

// Delete persona
export const remove = mutation({
  args: { personaId: v.id("personas") },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("Persona not found");

    // If this was the primary persona, make another one primary
    if (persona.isPrimary) {
      const otherPersonas = await ctx.db
        .query("personas")
        .withIndex("by_client_and_active", (q) =>
          q.eq("clientId", persona.clientId).eq("isActive", true)
        )
        .collect();

      const nextPrimary = otherPersonas.find((p) => p._id !== args.personaId);
      if (nextPrimary) {
        await ctx.db.patch(nextPrimary._id, { isPrimary: true });
      }
    }

    await ctx.db.delete(args.personaId);
    return { success: true };
  },
});

// Get persona stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      total: personas.length,
      active: personas.filter((p) => p.isActive).length,
      versions: Math.max(...personas.map((p) => p.version), 0),
      primary: personas.find((p) => p.isPrimary)?._id,
    };
  },
});
