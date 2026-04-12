/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _storage from "../_storage.js";
import type * as _utils from "../_utils.js";
import type * as assets from "../assets.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as garage from "../garage.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as preOrders from "../preOrders.js";
import type * as products from "../products.js";
import type * as settings from "../settings.js";
import type * as stockReservations from "../stockReservations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _storage: typeof _storage;
  _utils: typeof _utils;
  assets: typeof assets;
  crons: typeof crons;
  emails: typeof emails;
  garage: typeof garage;
  http: typeof http;
  orders: typeof orders;
  preOrders: typeof preOrders;
  products: typeof products;
  settings: typeof settings;
  stockReservations: typeof stockReservations;
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
