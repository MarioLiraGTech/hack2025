/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as Cantidad from "../Cantidad.js";
import type * as Carrito from "../Carrito.js";
import type * as Distribuidor from "../Distribuidor.js";
import type * as Producto from "../Producto.js";
import type * as Sucursal from "../Sucursal.js";
import type * as Vuelo from "../Vuelo.js";
import type * as http from "../http.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  Cantidad: typeof Cantidad;
  Carrito: typeof Carrito;
  Distribuidor: typeof Distribuidor;
  Producto: typeof Producto;
  Sucursal: typeof Sucursal;
  Vuelo: typeof Vuelo;
  http: typeof http;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
