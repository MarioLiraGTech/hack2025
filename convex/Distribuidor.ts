import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Distribuidor ---
export const createDistribuidor = mutation({
  args: {
    nombre: v.string(),
    correo: v.optional(v.string()),
    telefono: v.optional(v.string()),
    direccion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const distribuidorId = await ctx.db.insert("Distribuidor", {
      ...args,
      fecha_registro: Date.now(),
    });
    return distribuidorId;
  },
});

// --- Leer Distribuidores ---
export const getDistribuidores = query({
  handler: async (ctx) => {
    return await ctx.db.query("Distribuidor").collect();
  },
});

export const getDistribuidorById = query({
  args: { distribuidorId: v.id("Distribuidor") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.distribuidorId);
  },
});

// --- Actualizar Distribuidor ---
export const updateDistribuidor = mutation({
  args: {
    id: v.id("Distribuidor"),
    nombre: v.optional(v.string()),
    correo: v.optional(v.string()),
    telefono: v.optional(v.string()),
    direccion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Distribuidor ---
export const deleteDistribuidor = mutation({
  args: { id: v.id("Distribuidor") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});