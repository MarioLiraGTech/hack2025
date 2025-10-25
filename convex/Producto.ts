import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Producto ---
export const createProducto = mutation({
  args: {
    fecha_registro: v.number(),
    nombre: v.string(),
    distribuidor: v.id("Distribuidor"),
  },
  handler: async (ctx, args) => {
    const productoId = await ctx.db.insert("Producto", {
      fecha_registro: args.fecha_registro,
      nombre: args.nombre,
      distribuidor: args.distribuidor,
    });
    return productoId;
  },
});

// --- Leer Productos ---
// Obtener todos los productos
export const getProductos = query({
  handler: async (ctx) => {
    return await ctx.db.query("Producto").collect();
  },
});

// Obtener un producto por su ID
export const getProductoById = query({
  args: { productoId: v.id("Producto") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productoId);
  },
});

// --- Actualizar Producto ---
export const updateProducto = mutation({
  args: {
    id: v.id("Producto"),
    nombre: v.optional(v.string()),
    distribuidor: v.optional(v.id("Distribuidor")),
    fecha_registro: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Producto ---
export const deleteProducto = mutation({
  args: { id: v.id("Producto") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});