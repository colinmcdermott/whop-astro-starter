import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { getSubscriptionDetails } from "@/lib/subscription";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const session = await getSession(cookies);
  if (!session) return redirect("/login");

  const result = await getSubscriptionDetails(session.userId);
  if (!result.hasSubscription || !result.subscription?.whopMembershipId) {
    return redirect("/pricing");
  }

  return redirect(`https://whop.com/orders`);
};
