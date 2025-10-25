import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Crear Sucursal ---
export const createSucursal = mutation({
  // Se elimina `fecha_registro` de los args. El cliente ya no necesita enviarla.
  args: {
    nombre: v.string(),
    direccion: v.string(),
    pais: v.string(),
    estado: v.string(),
    codigo_postal: v.string(),
    telefono: v.optional(v.string()),
    correo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Se añade la fecha de registro aquí, en el backend, usando Date.now()
    const sucursalId = await ctx.db.insert("Sucursal", {
      ...args, // <--- Se toman todos los argumentos del cliente
      fecha_registro: Date.now(), // <--- CAMBIO CLAVE: Se añade la fecha en el servidor
    });
    return sucursalId;
  },
});

// --- Leer Sucursales ---
// (Sin cambios, ya estaba correcto)
export const getSucursales = query({
  handler: async (ctx) => {
    return await ctx.db.query("Sucursal").collect();
  },
});

export const getSucursalById = query({
  args: { sucursalId: v.id("Sucursal") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sucursalId);
  },
});


// --- Actualizar Sucursal ---
export const updateSucursal = mutation({
  // <--- CAMBIO CLAVE: Se elimina `fecha_registro` de aquí.
  // La fecha de creación NUNCA debería poder actualizarse.
  args: {
    id: v.id("Sucursal"),
    nombre: v.optional(v.string()),
    direccion: v.optional(v.string()),
    pais: v.optional(v.string()),
    estado: v.optional(v.string()),
    codigo_postal: v.optional(v.string()),
    telefono: v.optional(v.string()),
    correo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return await ctx.db.get(id);
  },
});

// --- Eliminar Sucursal ---
// (Sin cambios, ya estaba correcto)
export const deleteSucursal = mutation({
  args: { id: v.id("Sucursal") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});