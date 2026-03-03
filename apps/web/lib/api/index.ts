/**
 * API Client Exports
 *
 * Central export point for all API functionality.
 */

export { apiClient, createClient, ApiClientError } from "./client";
export { serverApiClient, createClient as createServerClient } from "./server";
export { authApi } from "./auth";
export { updateSession } from "./middleware";

export type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "./auth";
export type { ApiError } from "./client";
