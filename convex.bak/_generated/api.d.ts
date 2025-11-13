/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_contactIntelligence from "../agents/contactIntelligence.js";
import type * as agents_contentGenerator from "../agents/contentGenerator.js";
import type * as agents_emailProcessor from "../agents/emailProcessor.js";
import type * as contacts from "../contacts.js";
import type * as content from "../content.js";
import type * as emails from "../emails.js";
import type * as organizations from "../organizations.js";
import type * as seed from "../seed.js";
import type * as system from "../system.js";
import type * as testAgents from "../testAgents.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/contactIntelligence": typeof agents_contactIntelligence;
  "agents/contentGenerator": typeof agents_contentGenerator;
  "agents/emailProcessor": typeof agents_emailProcessor;
  contacts: typeof contacts;
  content: typeof content;
  emails: typeof emails;
  organizations: typeof organizations;
  seed: typeof seed;
  system: typeof system;
  testAgents: typeof testAgents;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
