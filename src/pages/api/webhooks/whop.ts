import type { APIRoute } from "astro";
import { verifyWebhookSignature } from "whop-kit/whop";
import { createSubscriptionHelpers } from "whop-kit/subscriptions";
import { prismaDbAdapter } from "@/lib/adapters/prisma";
import { prisma } from "@/lib/db";
import { PLAN_KEYS, DEFAULT_PLAN } from "@/lib/constants";

export const prerender = false;

const subs = createSubscriptionHelpers(prismaDbAdapter(prisma), DEFAULT_PLAN, PLAN_KEYS);

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const isValid = await verifyWebhookSignature(
    body,
    {
      "webhook-id": request.headers.get("webhook-id"),
      "webhook-signature": request.headers.get("webhook-signature"),
      "webhook-timestamp": request.headers.get("webhook-timestamp"),
    },
    webhookSecret,
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  const { action, data } = event;

  try {
    switch (action) {
      case "membership_activated": {
        const plan = data.product_id ? "pro" : DEFAULT_PLAN;
        await subs.activateMembership(data.user_id, plan, data.id);
        break;
      }
      case "membership_deactivated":
        await subs.deactivateMembership(data.user_id);
        break;
      case "membership_cancel_at_period_end_changed":
        await subs.updateCancelAtPeriodEnd(data.user_id, data.cancel_at_period_end);
        break;
    }
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return new Response("Processing error", { status: 500 });
  }
};
