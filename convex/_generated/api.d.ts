/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as autoReplies from "../autoReplies.js";
import type * as campaigns from "../campaigns.js";
import type * as clientAssets from "../clientAssets.js";
import type * as clientEmails from "../clientEmails.js";
import type * as clients from "../clients.js";
import type * as competitors from "../competitors.js";
import type * as contentCalendar from "../contentCalendar.js";
import type * as demo_seedData from "../demo/seedData.js";
import type * as demo_testDemo from "../demo/testDemo.js";
import type * as emailSequences from "../emailSequences.js";
import type * as emailThreads from "../emailThreads.js";
import type * as emails from "../emails.js";
import type * as hooks from "../hooks.js";
import type * as imageConcepts from "../imageConcepts.js";
import type * as images from "../images.js";
import type * as landingPages from "../landingPages.js";
import type * as lib_clientValidation from "../lib/clientValidation.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_utils from "../lib/utils.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_withClientFilter from "../lib/withClientFilter.js";
import type * as mindmaps from "../mindmaps.js";
import type * as organizations from "../organizations.js";
import type * as personas from "../personas.js";
import type * as seedSequenceTemplates from "../seedSequenceTemplates.js";
import type * as socialTemplates from "../socialTemplates.js";
import type * as strategies from "../strategies.js";
import type * as subscriptions from "../subscriptions.js";
import type * as usage from "../usage.js";
import type * as usageTracking from "../usageTracking.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  autoReplies: typeof autoReplies;
  campaigns: typeof campaigns;
  clientAssets: typeof clientAssets;
  clientEmails: typeof clientEmails;
  clients: typeof clients;
  competitors: typeof competitors;
  contentCalendar: typeof contentCalendar;
  "demo/seedData": typeof demo_seedData;
  "demo/testDemo": typeof demo_testDemo;
  emailSequences: typeof emailSequences;
  emailThreads: typeof emailThreads;
  emails: typeof emails;
  hooks: typeof hooks;
  imageConcepts: typeof imageConcepts;
  images: typeof images;
  landingPages: typeof landingPages;
  "lib/clientValidation": typeof lib_clientValidation;
  "lib/index": typeof lib_index;
  "lib/permissions": typeof lib_permissions;
  "lib/utils": typeof lib_utils;
  "lib/validators": typeof lib_validators;
  "lib/withClientFilter": typeof lib_withClientFilter;
  mindmaps: typeof mindmaps;
  organizations: typeof organizations;
  personas: typeof personas;
  seedSequenceTemplates: typeof seedSequenceTemplates;
  socialTemplates: typeof socialTemplates;
  strategies: typeof strategies;
  subscriptions: typeof subscriptions;
  usage: typeof usage;
  usageTracking: typeof usageTracking;
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
