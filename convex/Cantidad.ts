import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Cantidad ---
export const createCantidad = mutation({
  args: {
    fecha_caducidad: v.number(),
    cantidad: v.number(),
    producto_id: v.id("Producto"),
    sucursal_id: v.id("Sucursal"),
    fecha_registro: v.number(),
  },
  handler: async (ctx, args) => {
    const cantidadId = await ctx.db.insert("Cantidad", args);
    return cantidadId;
  },
});

// --- Leer Cantidades ---
// Obtener todas las cantidades
export const getCantidades = query({
  handler: async (ctx) => {
    return await ctx.db.query("Cantidad").collect();
  },
});

// Obtener una cantidad por su ID
export const getCantidadById = query({
  args: { cantidadId: v.id("Cantidad") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cantidadId);
  },
});

// --- Actualizar Cantidad ---
export const updateCantidad = mutation({
  args: {
    id: v.id("Cantidad"),
    fecha_caducidad: v.optional(v.number()),
    cantidad: v.optional(v.number()),
    producto_id: v.optional(v.id("Producto")),
    sucursal_id: v.optional(v.id("Sucursal")),
    fecha_registro: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Cantidad ---
export const deleteCantidad = mutation({
  args: { id: v.id("Cantidad") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});