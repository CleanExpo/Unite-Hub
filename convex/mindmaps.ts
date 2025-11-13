import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp, generateNodeId, getRandomColor } from "./lib/utils";
import { mindMapBranchValidator, mindMapNodeValidator } from "./lib/validators";

/**
 * MIND MAPS - Auto-expanding mind maps
 * CRUD, auto-expansion, versioning
 */

// Create mind map
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    rootLabel: v.string(),
    initialBranches: v.optional(v.array(mindMapBranchValidator)),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const now = getCurrentTimestamp();
    const rootNodeId = generateNodeId("root");

    const mindMapId = await ctx.db.insert("mindMaps", {
      clientId: args.clientId,
      rootNode: {
        id: rootNodeId,
        label: args.rootLabel.trim(),
        type: "business",
      },
      branches: args.initialBranches || [],
      autoExpandedFromEmails: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    return mindMapId;
  },
});

// Get mind map by ID
export const get = query({
  args: { mindMapId: v.id("mindMaps") },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");
    return mindMap;
  },
});

// Get latest mind map for client
export const getLatest = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const mindMaps = await ctx.db
      .query("mindMaps")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(1);

    return mindMaps[0] || null;
  },
});

// List mind maps for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("mindMaps")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);
  },
});

// Add branch to mind map
export const addBranch = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branch: mindMapBranchValidator,
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    // Ensure branch has unique ID
    const branchId = args.branch.id || generateNodeId("branch");
    const now = getCurrentTimestamp();

    const newBranch = {
      ...args.branch,
      id: branchId,
      createdAt: now,
      color: args.branch.color || getRandomColor(),
    };

    await ctx.db.patch(args.mindMapId, {
      branches: [...mindMap.branches, newBranch],
      updatedAt: now,
    });

    return branchId;
  },
});

// Add node to branch
export const addNode = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branchId: v.string(),
    node: mindMapNodeValidator,
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const branchIndex = mindMap.branches.findIndex((b) => b.id === args.branchId);
    if (branchIndex === -1) throw new Error("Branch not found");

    const now = getCurrentTimestamp();
    const nodeId = args.node.id || generateNodeId("node");

    const newNode = {
      ...args.node,
      id: nodeId,
      addedAt: now,
    };

    const updatedBranches = [...mindMap.branches];
    updatedBranches[branchIndex] = {
      ...updatedBranches[branchIndex],
      subNodes: [...updatedBranches[branchIndex].subNodes, newNode],
    };

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      updatedAt: now,
    });

    return nodeId;
  },
});

// Update node in branch
export const updateNode = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branchId: v.string(),
    nodeId: v.string(),
    label: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const branchIndex = mindMap.branches.findIndex((b) => b.id === args.branchId);
    if (branchIndex === -1) throw new Error("Branch not found");

    const branch = mindMap.branches[branchIndex];
    const nodeIndex = branch.subNodes.findIndex((n) => n.id === args.nodeId);
    if (nodeIndex === -1) throw new Error("Node not found");

    const updatedBranches = [...mindMap.branches];
    const updatedNodes = [...branch.subNodes];
    updatedNodes[nodeIndex] = {
      ...updatedNodes[nodeIndex],
      ...(args.label && { label: args.label }),
      ...(args.details !== undefined && { details: args.details }),
    };

    updatedBranches[branchIndex] = {
      ...branch,
      subNodes: updatedNodes,
    };

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      updatedAt: getCurrentTimestamp(),
    });

    return args.nodeId;
  },
});

// Update branch
export const updateBranch = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branchId: v.string(),
    label: v.optional(v.string()),
    color: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("product"),
        v.literal("audience"),
        v.literal("challenge"),
        v.literal("opportunity"),
        v.literal("competitor"),
        v.literal("expansion")
      )
    ),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const branchIndex = mindMap.branches.findIndex((b) => b.id === args.branchId);
    if (branchIndex === -1) throw new Error("Branch not found");

    const updatedBranches = [...mindMap.branches];
    updatedBranches[branchIndex] = {
      ...updatedBranches[branchIndex],
      ...(args.label && { label: args.label }),
      ...(args.color && { color: args.color }),
      ...(args.category && { category: args.category }),
    };

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      updatedAt: getCurrentTimestamp(),
    });

    return args.branchId;
  },
});

// Remove branch
export const removeBranch = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branchId: v.string(),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const updatedBranches = mindMap.branches.filter((b) => b.id !== args.branchId);

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      updatedAt: getCurrentTimestamp(),
    });

    return { success: true };
  },
});

// Remove node from branch
export const removeNode = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    branchId: v.string(),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const branchIndex = mindMap.branches.findIndex((b) => b.id === args.branchId);
    if (branchIndex === -1) throw new Error("Branch not found");

    const updatedBranches = [...mindMap.branches];
    const branch = updatedBranches[branchIndex];
    updatedBranches[branchIndex] = {
      ...branch,
      subNodes: branch.subNodes.filter((n) => n.id !== args.nodeId),
    };

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      updatedAt: getCurrentTimestamp(),
    });

    return { success: true };
  },
});

// Auto-expand from email
export const expandFromEmail = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
    emailId: v.id("emailThreads"),
    newBranches: v.optional(v.array(mindMapBranchValidator)),
    newNodes: v.optional(
      v.array(
        v.object({
          branchId: v.string(),
          node: mindMapNodeValidator,
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const now = getCurrentTimestamp();
    let updatedBranches = [...mindMap.branches];

    // Add new branches if provided
    if (args.newBranches) {
      for (const branch of args.newBranches) {
        const branchId = branch.id || generateNodeId("branch");
        updatedBranches.push({
          ...branch,
          id: branchId,
          createdAt: now,
          color: branch.color || getRandomColor(),
        });
      }
    }

    // Add new nodes to existing branches
    if (args.newNodes) {
      for (const { branchId, node } of args.newNodes) {
        const branchIndex = updatedBranches.findIndex((b) => b.id === branchId);
        if (branchIndex !== -1) {
          const nodeId = node.id || generateNodeId("node");
          updatedBranches[branchIndex] = {
            ...updatedBranches[branchIndex],
            subNodes: [
              ...updatedBranches[branchIndex].subNodes,
              {
                ...node,
                id: nodeId,
                sourceEmailId: args.emailId,
                addedAt: now,
              },
            ],
          };
        }
      }
    }

    await ctx.db.patch(args.mindMapId, {
      branches: updatedBranches,
      autoExpandedFromEmails: [...mindMap.autoExpandedFromEmails, args.emailId],
      updatedAt: now,
    });

    return args.mindMapId;
  },
});

// Create new version
export const createVersion = mutation({
  args: {
    mindMapId: v.id("mindMaps"),
  },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const now = getCurrentTimestamp();
    const newVersion = mindMap.version + 1;

    const newMindMapId = await ctx.db.insert("mindMaps", {
      ...mindMap,
      version: newVersion,
      createdAt: now,
      updatedAt: now,
    });

    return newMindMapId;
  },
});

// Delete mind map
export const remove = mutation({
  args: { mindMapId: v.id("mindMaps") },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    await ctx.db.delete(args.mindMapId);
    return { success: true };
  },
});

// Get mind map stats
export const getStats = query({
  args: { mindMapId: v.id("mindMaps") },
  handler: async (ctx, args) => {
    const mindMap = await ctx.db.get(args.mindMapId);
    if (!mindMap) throw new Error("Mind map not found");

    const totalNodes = mindMap.branches.reduce(
      (sum, branch) => sum + branch.subNodes.length,
      0
    );

    const nodesByCategory = mindMap.branches.reduce((acc, branch) => {
      acc[branch.category] = (acc[branch.category] || 0) + branch.subNodes.length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBranches: mindMap.branches.length,
      totalNodes,
      nodesByCategory,
      autoExpandedCount: mindMap.autoExpandedFromEmails.length,
      version: mindMap.version,
    };
  },
});
