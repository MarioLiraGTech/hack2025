import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Carrito ---
export const createCarrito = mutation({
  args: {
    tipo: v.union(v.literal("Mediano"), v.literal("Largo")),
    nombre: v.string(),
  },
  handler: async (ctx, args) => {
    const carritoId = await ctx.db.insert("Carrito", {
      ...args,
      fecha_registro: Date.now(),
    });
    return carritoId;
  },
});

// --- Leer Carritos ---
export const getCarritos = query({
  handler: async (ctx) => {
    return await ctx.db.query("Carrito").collect();
  },
});

export const getCarritoById = query({
  args: { carritoId: v.id("Carrito") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.carritoId);
  },
});

// --- Actualizar Carrito ---
export const updateCarrito = mutation({
  args: {
    id: v.id("Carrito"),
    nombre: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("Mediano"), v.literal("Largo"))),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Carrito ---
export const deleteCarrito = mutation({
  args: { id: v.id("Carrito") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});