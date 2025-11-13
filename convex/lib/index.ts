/**
 * Convex Library Utilities
 *
 * Shared utilities for Convex queries and mutations.
 * These helpers ensure consistent client validation and data access patterns.
 *
 * @module convex/lib
 */

export {
  validateClientAccess,
  ensureClientId,
  getValidatedClient,
  isClientId,
  filterByClient,
} from "./withClientFilter";
