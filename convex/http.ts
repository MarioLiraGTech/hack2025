import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      // 1. Validar la solicitud usando el secreto del webhook de Clerk.
      const event = await validateRequest(request);
      if (!event) {
        console.error('Failed to validate webhook request');
        return new Response('Invalid webhook signature', { status: 401 });
      }

      console.log(`Processing Clerk webhook event: ${event.type}`);

      // 2. Procesar el evento según el tipo (crear, actualizar o eliminar).
      switch (event.type) {
        case 'user.created':
        case 'user.updated':
          // Llama a la mutación interna para crear o actualizar el usuario.
          await ctx.runMutation(internal.users.upsertFromClerk, {
            data: event.data,
          });

          //Test de envio por resend
          //await ctx.runMutation(internal.sendEmails.sendTestEmail, {})
          
          console.log(
            `Successfully processed ${event.type} for user: ${event.data.id}`
          );

          break;
        case 'user.deleted': {
          const clerkUserId = event.data.id!;
          // Llama a la mutación interna para eliminar el usuario.
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkUserId,
          });
          console.log(`Successfully deleted user: ${clerkUserId}`);
          break;
        }
        default:
          console.log('Ignored Clerk webhook event', event.type);
      }
      return new Response(null, { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }),
});

// Función de utilidad para validar la firma de la solicitud
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };

  // Verifica que todos los headers necesarios estén presentes
  if (
    !svixHeaders['svix-id'] ||
    !svixHeaders['svix-timestamp'] ||
    !svixHeaders['svix-signature']
  ) {
    console.error('Missing required svix headers');
    return null;
  }

  // Crea una instancia del webhook con el secreto de tu variable de entorno
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error('Error verifying webhook event', error);
    return null;
  }
}

export default http;