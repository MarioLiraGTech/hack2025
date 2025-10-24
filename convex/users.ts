import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = internalMutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const clerkUser = args.data;

    const clerkId = clerkUser.id;
    const nombreCompleto = `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim();
    const correo = clerkUser.email_addresses?.[0]?.email_address || "";

    if (!clerkId || !correo) {
      console.error("Datos de usuario Clerk inválidos:", clerkUser);
      return;
    }

    const existente = await ctx.db
      .query("Usuarios")
      .withIndex("by_correo", (q) => q.eq("correo", correo))
      .unique();

    const ahora = Date.now();

    if (existente) {
      await ctx.db.patch(existente._id, {
        nombreCompleto,
        fechaActualizacion: ahora,
      });
      console.log(`Usuario actualizado: ${correo}`);
    } else {
      await ctx.db.insert("Usuarios", {
        nombreCompleto,
        correo,
        clerkId,
        fechaRegistro: ahora,
        fechaActualizacion: ahora,
      });
      console.log(`Usuario creado: ${correo}`);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const usuario = await ctx.db
      .query("Usuarios")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkUserId))
      .unique();

    if (!usuario) {
      console.warn(`Usuario con Clerk ID ${args.clerkUserId} no encontrado`);
      return;
    }

    await ctx.db.delete(usuario._id);
    console.log(`Usuario eliminado con Clerk ID: ${args.clerkUserId}`);
  },
});
