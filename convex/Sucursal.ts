import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Sucursal ---
export const createSucursal = mutation({
  args: {
    nombre: v.string(),
    direccion: v.string(),
    pais: v.string(),
    estado: v.string(),
    codigo_postal: v.string(),
    telefono: v.optional(v.string()),
    correo: v.optional(v.string()),
    fecha_registro: v.number(),
  },
  handler: async (ctx, args) => {
    const sucursalId = await ctx.db.insert("Sucursal", args);
    return sucursalId;
  },
});

// --- Leer Sucursales ---
// Obtener todas las sucursales
export const getSucursales = query({
  handler: async (ctx) => {
    return await ctx.db.query("Sucursal").collect();
  },
});

// Obtener una sucursal por su ID
export const getSucursalById = query({
  args: { sucursalId: v.id("Sucursal") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sucursalId);
  },
});

// --- Actualizar Sucursal ---
export const updateSucursal = mutation({
  args: {
    id: v.id("Sucursal"),
    nombre: v.optional(v.string()),
    direccion: v.optional(v.string()),
    pais: v.optional(v.string()),
    estado: v.optional(v.string()),
    codigo_postal: v.optional(v.string()),
    telefono: v.optional(v.string()),
    correo: v.optional(v.string()),
    fecha_registro: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Sucursal ---
export const deleteSucursal = mutation({
  args: { id: v.id("Sucursal") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});