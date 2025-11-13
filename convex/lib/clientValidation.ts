import { Id } from "../_generated/dataModel";

/**
 * CLIENT VALIDATION UTILITIES
 * Helper functions for validating client access and permissions
 */

/**
 * Validate that a client exists and belongs to the specified organization
 * @param ctx Convex query/mutation context
 * @param clientId Client ID to validate
 * @param orgId Organization ID to check against
 * @returns The validated client document
 * @throws Error if client not found or doesn't belong to organization
 */
export async function validateClientAccess(
  ctx: any,
  clientId: Id<"clients">,
  orgId: Id<"organizations">
) {
  const client = await ctx.db.get(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  if (client.orgId !== orgId) {
    throw new Error("Access denied: Client does not belong to this organization");
  }

  return client;
}

/**
 * Validate that a client exists and is active
 * @param ctx Convex query/mutation context
 * @param clientId Client ID to validate
 * @returns The validated client document
 * @throws Error if client not found or inactive
 */
export async function validateActiveClient(ctx: any, clientId: Id<"clients">) {
  const client = await ctx.db.get(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  if (client.status !== "active") {
    throw new Error(`Client is ${client.status}. Only active clients can perform this action.`);
  }

  return client;
}

/**
 * Validate that a client exists and has a specific package tier or higher
 * @param ctx Convex query/mutation context
 * @param clientId Client ID to validate
 * @param requiredTier Minimum required tier ("starter" or "professional")
 * @returns The validated client document
 * @throws Error if client not found or doesn't have required tier
 */
export async function validateClientTier(
  ctx: any,
  clientId: Id<"clients">,
  requiredTier: "starter" | "professional"
) {
  const client = await ctx.db.get(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  // Professional tier has access to everything
  if (client.packageTier === "professional") {
    return client;
  }

  // If professional is required but client has starter
  if (requiredTier === "professional" && client.packageTier === "starter") {
    throw new Error("This feature requires Professional plan. Please upgrade to access.");
  }

  return client;
}

/**
 * Validate that an organization exists
 * @param ctx Convex query/mutation context
 * @param orgId Organization ID to validate
 * @returns The validated organization document
 * @throws Error if organization not found
 */
export async function validateOrganization(
  ctx: any,
  orgId: Id<"organizations">
) {
  const org = await ctx.db.get(orgId);

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

/**
 * Check if a client belongs to an organization without throwing errors
 * @param ctx Convex query/mutation context
 * @param clientId Client ID to check
 * @param orgId Organization ID to check against
 * @returns True if client belongs to organization, false otherwise
 */
export async function clientBelongsToOrg(
  ctx: any,
  clientId: Id<"clients">,
  orgId: Id<"organizations">
): Promise<boolean> {
  const client = await ctx.db.get(clientId);
  return client ? client.orgId === orgId : false;
}

/**
 * Get all clients for an organization
 * @param ctx Convex query/mutation context
 * @param orgId Organization ID
 * @returns Array of clients belonging to the organization
 */
export async function getOrgClients(ctx: any, orgId: Id<"organizations">) {
  return await ctx.db
    .query("clients")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();
}

/**
 * Count clients by status for an organization
 * @param ctx Convex query/mutation context
 * @param orgId Organization ID
 * @returns Object with counts by status
 */
export async function countClientsByStatus(
  ctx: any,
  orgId: Id<"organizations">
) {
  const clients = await getOrgClients(ctx, orgId);

  return {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    onboarding: clients.filter((c) => c.status === "onboarding").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
  };
}

/**
 * Validate client email uniqueness within organization
 * @param ctx Convex query/mutation context
 * @param email Email to check
 * @param orgId Organization ID
 * @param excludeClientId Optional client ID to exclude from check (for updates)
 * @returns True if email is available, false if already in use
 */
export async function isClientEmailAvailable(
  ctx: any,
  email: string,
  orgId: Id<"organizations">,
  excludeClientId?: Id<"clients">
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  const existingClient = await ctx.db
    .query("clients")
    .withIndex("by_email", (q) => q.eq("primaryEmail", normalizedEmail))
    .first();

  if (!existingClient) {
    return true; // Email is available
  }

  // If updating, check if the existing client is the one being updated
  if (excludeClientId && existingClient._id === excludeClientId) {
    return true;
  }

  // Check if it belongs to the same organization
  return existingClient.orgId !== orgId;
}
