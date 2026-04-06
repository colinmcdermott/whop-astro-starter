import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { getSubscriptionDetails, uncancelSubscription } from "@/lib/subscription";
import { uncancelMembership } from "whop-kit/whop";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const result = await getSubscriptionDetails(session.userId);
  if (!result.hasSubscription || !result.subscription?.whopMembershipId) {
    return new Response(JSON.stringify({ error: "No subscription" }), { status: 400 });
  }

  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
  }

  const success = await uncancelMembership(result.subscription.whopMembershipId, apiKey);
  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to uncancel" }), { status: 500 });
  }

  await uncancelSubscription(session.userId);
  return new Response(JSON.stringify({ success: true }));
};
