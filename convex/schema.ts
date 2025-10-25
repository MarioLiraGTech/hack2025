import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    Usuarios: defineTable({
        nombreCompleto: v.string(),
        correo: v.string(),
        clerkId: v.string(),
        fechaRegistro: v.number(),
        fechaActualizacion: v.number(),
        rol: v.optional(v.id("Roles")),
    })
        .index("by_correo", ["correo"])
        .index("by_clerkId", ["clerkId"]),

    //////////////////////////////Inventario///////////////////////////////
    Carrito: defineTable({
        fecha_registro: v.number(),
        tipo: v.union(
            v.literal("Mediano"),
            v.literal("Largo"),
        ),
        nombre: v.string()
    }),

    Producto: defineTable({
        fecha_registro: v.number(),
        nombre: v.string(),
        distribuidor: v.id("Distribuidor")
    }),

    Distribuidor: defineTable({
        fecha_registro: v.number(),
        nombre: v.string(),
        correo: v.optional(v.string()),
        telefono: v.optional(v.string()),
        direccion: v.optional(v.string()),
    }),

    Sucursal: defineTable({
        nombre:v.string(),
        direccion: v.string(),
        pais: v.string(),
        estado: v.string(),
        codigo_postal: v.string(),
        telefono: v.optional(v.string()),
        correo: v.optional(v.string()),
        fecha_registro: v.number(),
    }),

    Cantidad: defineTable({
        fecha_caducidad: v.number(),
        cantidad: v.number(),
        producto_id: v.id("Producto"),
        sucursal_id: v.id("Sucursal"),
        lote: v.string(),
        fecha_registro: v.number(),
    })
    .index("by_producto_sucursal_caducidad", [
        "producto_id",
        "sucursal_id",
        "fecha_caducidad",
    ]),

    Vuelo: defineTable({
        carrito_id: v.id("Carrito"),
        cantidad: v.array(
            v.object({
                cantidad: v.number(),
                producto: v.id("Cantidad"),
                sobrante: v.optional(v.number()),
            })
        ),
        sucursal_origen: v.id("Sucursal"),
        sucursal_destino: v.id("Sucursal"),
        fecha_registro: v.number(),
        completado: v.boolean(),
    }),
});