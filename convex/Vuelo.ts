import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Consultar Vuelos ---
// Obtener todos los vuelos
export const getVuelos = query({
  handler: async (ctx) => {
    return await ctx.db.query("Vuelo").collect();
  },
});

// Obtener un vuelo específico por su ID
export const getVueloById = query({
  args: { vueloId: v.id("Vuelo") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vueloId);
  },
});


// --- Crear Vuelo (Inicia el traslado) ---
// Esta mutación crea el registro del vuelo y descuenta el inventario de la sucursal de origen.
export const createVuelo = mutation({
  args: {
    carrito_id: v.id("Carrito"),
    sucursal_origen: v.id("Sucursal"),
    sucursal_destino: v.id("Sucursal"),
    // El array de cantidad inicial no debe incluir el campo 'sobrante'
    cantidad: v.array(
      v.object({
        cantidad: v.number(),
        producto: v.id("Cantidad"),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Validar que las sucursales no sean la misma
    if (args.sucursal_origen === args.sucursal_destino) {
      throw new Error("La sucursal de origen y destino no pueden ser la misma.");
    }

    // 2. Iterar sobre cada producto para descontar del inventario de origen
    for (const item of args.cantidad) {
      const cantidadEnOrigen = await ctx.db.get(item.producto);

      // Validar que el registro de Cantidad exista y pertenezca a la sucursal de origen
      if (!cantidadEnOrigen) {
        throw new Error(`El producto con ID ${item.producto} no fue encontrado.`);
      }
      if (cantidadEnOrigen.sucursal_id !== args.sucursal_origen) {
        throw new Error(`El producto ${cantidadEnOrigen._id} no pertenece a la sucursal de origen.`);
      }
      if (cantidadEnOrigen.cantidad < item.cantidad) {
        throw new Error(`No hay suficiente stock para el producto ${cantidadEnOrigen._id}. Stock actual: ${cantidadEnOrigen.cantidad}.`);
      }

      // Descontar la cantidad
      await ctx.db.patch(item.producto, {
        cantidad: cantidadEnOrigen.cantidad - item.cantidad,
      });
    }

    const vueloId = await ctx.db.insert("Vuelo", {
      ...args,
      fecha_registro: Date.now(),
      completado: false,
    });

    return vueloId;
  },
});


// --- Completar Vuelo (Finaliza el traslado) ---
// Esta mutación marca el vuelo como completado y añade el inventario 'sobrante' a la sucursal de destino.
export const completeVuelo = mutation({
  args: {
    vueloId: v.id("Vuelo"),
    // Ahora el array debe incluir el campo 'sobrante'
    cantidad: v.array(
      v.object({
        cantidad: v.number(),
        producto: v.id("Cantidad"), // Sigue siendo el ID del registro de Cantidad original
        sobrante: v.number(), // Cantidad que realmente llegó
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Obtener el vuelo a completar
    const vuelo = await ctx.db.get(args.vueloId);
    if (!vuelo) {
      throw new Error("Vuelo no encontrado.");
    }
    if (vuelo.completado) {
      throw new Error("Este vuelo ya ha sido completado.");
    }

    // 2. Iterar sobre los productos para registrar el sobrante en el destino
    for (const item of args.cantidad) {
      // Si no sobró nada, no hay nada que agregar al inventario de destino.
      if (item.sobrante <= 0) {
        continue;
      }

      // Obtener la información del producto original para saber su fecha de caducidad
      const cantidadOriginal = await ctx.db.get(item.producto);
      if (!cantidadOriginal) {
        throw new Error(`El registro de cantidad original ${item.producto} no fue encontrado.`);
      }

      // Buscar si ya existe un lote del mismo producto con la misma fecha de caducidad en el destino
      const cantidadEnDestino = await ctx.db
        .query("Cantidad")
        .withIndex("by_producto_sucursal_caducidad") // <-- ¡IMPORTANTE! Necesitas crear este índice.
        .filter((q) =>
          q.and(
            q.eq(q.field("producto_id"), cantidadOriginal.producto_id),
            q.eq(q.field("sucursal_id"), vuelo.sucursal_destino),
            q.eq(q.field("fecha_caducidad"), cantidadOriginal.fecha_caducidad)
          )
        )
        .unique();

      if (cantidadEnDestino) {
        // Si existe, se le suma la cantidad sobrante
        await ctx.db.patch(cantidadEnDestino._id, {
          cantidad: cantidadEnDestino.cantidad + item.sobrante,
        });
      } else {
        // Si no existe, se crea un nuevo registro de Cantidad en la sucursal de destino
        await ctx.db.insert("Cantidad", {
          producto_id: cantidadOriginal.producto_id,
          sucursal_id: vuelo.sucursal_destino,
          fecha_caducidad: cantidadOriginal.fecha_caducidad,
          cantidad: item.sobrante,
          fecha_registro: Date.now(),
        });
      }
    }

    // 3. Actualizar el vuelo a 'completado' y guardar la información del sobrante
    await ctx.db.patch(args.vueloId, {
      completado: true,
      cantidad: args.cantidad,
    });

    return { success: true };
  },
});