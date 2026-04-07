import { definePlans } from "whop-kit/core";
export type { BillingInterval, PlanMetadataEntry } from "whop-kit/core";

export const APP_NAME = "Whop Astro Starter";
export const APP_DESCRIPTION = "A modern SaaS starter built with Astro and Whop";

export const LINKS = {
  github: "https://github.com/whopio/whop-saas-starter",
  terms: "/terms",
  privacy: "/privacy",
} as const;

export const plans = definePlans({
  free: {
    name: "Free",
    description: "Get started with the basics",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Up to 3 projects", "Basic analytics", "Community support", "1 GB storage"],
    highlighted: false,
  },
  starter: {
    name: "Starter",
    description: "For growing teams and businesses",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "100 GB storage", "Custom integrations", "Team collaboration"],
    highlighted: true,
  },
  pro: {
    name: "Pro",
    description: "For power users and larger teams",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Everything in Starter", "Unlimited storage", "Dedicated support", "Custom SLA", "SSO & advanced security", "Audit logs", "API access"],
    highlighted: false,
  },
});

export const PLAN_METADATA = plans.metadata;
export type PlanKey = keyof typeof PLAN_METADATA;
export const PLAN_KEYS = plans.keys;
export const PLAN_RANK = plans.ranks as Record<string, number>;
export const DEFAULT_PLAN = plans.defaultPlan;

export const getPlanBillingIntervals = plans.getBillingIntervals;
export const planConfigKey = plans.configKey;
export const planConfigKeyYearly = plans.configKeyYearly;

/** Env var naming convention: WHOP_{PLAN_KEY}_PLAN_ID */
export function planEnvVar(planKey: PlanKey): string {
  return `WHOP_${planKey.toUpperCase()}_PLAN_ID`;
}
export function planEnvVarYearly(planKey: PlanKey): string {
  return `WHOP_${planKey.toUpperCase()}_PLAN_ID_YEARLY`;
}
