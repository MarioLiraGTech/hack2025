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
});