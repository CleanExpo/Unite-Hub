import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Validates that a client ID exists and is accessible
 *
 * This function performs comprehensive validation:
 * 1. Checks that clientId is provided (not null/undefined)
 * 2. Verifies the client exists in the database
 * 3. Ensures the client is not inactive
 *
 * Use this as the first step in ANY query or mutation that operates on client data.
 *
 * @example
 * ```typescript
 * export const myQuery = query({
 *   args: { clientId: v.id("clients") },
 *   handler: async (ctx, args) => {
 *     // Validate client first
 *     await validateClientAccess(ctx, args.clientId);
 *
 *     // Now safe to proceed with client operations
 *     const data = await ctx.db
 *       .query("someTable")
 *       .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
 *       .collect();
 *
 *     return data;
 *   },
 * });
 * ```
 *
 * @param {QueryCtx | MutationCtx} ctx - Convex context with database access
 * @param {Id<"clients">} clientId - The client ID to validate
 * @throws {ConvexError} If clientId is missing, client not found, or client is inactive
 * @returns {Promise<void>}
 */
export async function validateClientAccess(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"clients">
): Promise<void> {
  if (!clientId) {
    throw new ConvexError("Client ID is required");
  }

  const client = await ctx.db.get(clientId);

  if (!client) {
    throw new ConvexError("Client not found");
  }

  if (client.status === "inactive") {
    throw new ConvexError("Client is inactive. Please activate the client to continue.");
  }
}

/**
 * Ensures a client ID is provided, throwing an error if not
 *
 * This is a lightweight validation that only checks for presence of clientId.
 * Use this when you need to validate the parameter exists before any database calls.
 *
 * **When to use:**
 * - At the start of a function to fail fast if clientId is missing
 * - When you need type narrowing from `Id<"clients"> | undefined` to `Id<"clients">`
 * - Before passing clientId to other functions
 *
 * **When NOT to use:**
 * - When you also need to verify the client exists (use `validateClientAccess` instead)
 * - When you need the full client document (use `getValidatedClient` instead)
 *
 * @example
 * ```typescript
 * export const quickCheck = mutation({
 *   args: { clientId: v.optional(v.id("clients")) },
 *   handler: async (ctx, args) => {
 *     // Narrow type and ensure it's provided
 *     const clientId = ensureClientId(args.clientId);
 *
 *     // Now clientId is guaranteed to be Id<"clients"> not undefined
 *     await doSomething(clientId);
 *   },
 * });
 * ```
 *
 * @param {Id<"clients"> | undefined | null} clientId - The client ID to check
 * @throws {ConvexError} If clientId is null or undefined
 * @returns {Id<"clients">} The validated client ID
 */
export function ensureClientId(
  clientId: Id<"clients"> | undefined | null
): Id<"clients"> {
  if (!clientId) {
    throw new ConvexError("Client ID is required");
  }
  return clientId;
}

/**
 * Retrieves a client document and validates it in a single operation
 *
 * This is the most comprehensive validation function. It:
 * 1. Fetches the client from the database
 * 2. Validates the client exists
 * 3. Ensures the client is not inactive
 * 4. Returns the full client document
 *
 * Use this when you need both validation AND the client data.
 *
 * @example
 * ```typescript
 * export const updateClientSettings = mutation({
 *   args: {
 *     clientId: v.id("clients"),
 *     settings: v.object({ /* ... *\/ })
 *   },
 *   handler: async (ctx, args) => {
 *     // Get and validate client in one step
 *     const client = await getValidatedClient(ctx, args.clientId);
 *
 *     // Can now use client data
 *     console.log(`Updating settings for ${client.businessName}`);
 *
 *     // Proceed with mutation
 *     await ctx.db.patch(args.clientId, {
 *       ...args.settings,
 *       updatedAt: Date.now(),
 *     });
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Checking client tier before operation
 * export const premiumFeature = mutation({
 *   args: { clientId: v.id("clients") },
 *   handler: async (ctx, args) => {
 *     const client = await getValidatedClient(ctx, args.clientId);
 *
 *     if (client.packageTier !== "professional") {
 *       throw new ConvexError("This feature requires a Professional package");
 *     }
 *
 *     // Proceed with premium feature
 *   },
 * });
 * ```
 *
 * @param {QueryCtx | MutationCtx} ctx - Convex context with database access
 * @param {Id<"clients">} clientId - The client ID to retrieve and validate
 * @throws {ConvexError} If client not found or is inactive
 * @returns {Promise<Doc<"clients">>} The validated client document
 */
export async function getValidatedClient(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"clients">
) {
  const client = await ctx.db.get(clientId);

  if (!client) {
    throw new ConvexError("Client not found");
  }

  if (client.status === "inactive") {
    throw new ConvexError("Client is inactive. Please activate the client to continue.");
  }

  return client;
}

/**
 * Type guard to check if a value is a valid client ID
 *
 * Useful for runtime type checking when working with dynamic data
 * or when TypeScript inference isn't available.
 *
 * @example
 * ```typescript
 * function processData(data: unknown) {
 *   if (isClientId(data.clientId)) {
 *     // TypeScript now knows data.clientId is Id<"clients">
 *     await validateClientAccess(ctx, data.clientId);
 *   }
 * }
 * ```
 *
 * @param {unknown} value - The value to check
 * @returns {boolean} True if value is a valid client ID
 */
export function isClientId(value: unknown): value is Id<"clients"> {
  return typeof value === "string" && value.length > 0;
}

/**
 * Filters an array of documents to only include those belonging to a specific client
 *
 * Type-safe utility for filtering collections by client ID.
 *
 * @example
 * ```typescript
 * const allDocuments = await ctx.db.query("documents").collect();
 * const clientDocuments = filterByClient(allDocuments, clientId);
 * ```
 *
 * @template T - Document type that includes a clientId field
 * @param {T[]} documents - Array of documents to filter
 * @param {Id<"clients">} clientId - The client ID to filter by
 * @returns {T[]} Filtered array containing only documents for the specified client
 */
export function filterByClient<T extends { clientId: Id<"clients"> }>(
  documents: T[],
  clientId: Id<"clients">
): T[] {
  return documents.filter((doc) => doc.clientId === clientId);
}
