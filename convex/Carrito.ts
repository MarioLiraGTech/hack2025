import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Carrito ---
export const createCarrito = mutation({
  args: {
    fecha_registro: v.number(),
    tipo: v.union(v.literal("Mediano"), v.literal("Largo")),
    nombre: v.string(),
  },
  handler: async (ctx, args) => {
    const carritoId = await ctx.db.insert("Carrito", {
      fecha_registro: args.fecha_registro,
      tipo: args.tipo,
      nombre: args.nombre,
    });
    return carritoId;
  },
});

// --- Leer Carritos ---
// Obtener todos los carritos
export const getCarritos = query({
  handler: async (ctx) => {
    return await ctx.db.query("Carrito").collect();
  },
});

// Obtener un carrito por su ID
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
    fecha_registro: v.optional(v.number()),
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