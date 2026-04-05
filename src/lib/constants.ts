import { definePlans } from "whop-kit/core";
export type { BillingInterval, PlanMetadataEntry } from "whop-kit/core";

export const APP_NAME = "Whop Astro Starter";

export const plans = definePlans({
  free: {
    name: "Free",
    description: "Get started with the basics",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Up to 3 projects", "Basic analytics", "Community support"],
    highlighted: false,
  },
  pro: {
    name: "Pro",
    description: "For power users",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Unlimited projects", "Priority support", "API access"],
    highlighted: true,
  },
});

export const PLAN_METADATA = plans.metadata;
export type PlanKey = keyof typeof PLAN_METADATA;
export const PLAN_KEYS = plans.keys;
export const DEFAULT_PLAN = plans.defaultPlan;
