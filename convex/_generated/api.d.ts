/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates from "../aggregates.js";
import type * as categories from "../categories.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as loans from "../loans.js";
import type * as logs from "../logs.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as n8n from "../n8n.js";
import type * as seed from "../seed.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aggregates: typeof aggregates;
  categories: typeof categories;
  functions: typeof functions;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  loans: typeof loans;
  logs: typeof logs;
  messages: typeof messages;
  migrations: typeof migrations;
  n8n: typeof n8n;
  seed: typeof seed;
  tools: typeof tools;
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

export declare const components: {
  returnedByBorrower: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"returnedByBorrower">;
  returnedByOwner: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"returnedByOwner">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
