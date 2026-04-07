// ---------------------------------------------------------------------------
// Plan config — reads plan IDs and prices from environment variables
// ---------------------------------------------------------------------------

import { PLAN_METADATA, PLAN_KEYS, type PlanKey } from "./constants";
import type { BillingInterval } from "./constants";

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  whopPlanId: string;
  whopPlanIdYearly: string;
  features: readonly string[];
  highlighted: boolean;
  billingIntervals: BillingInterval[];
}

export type PlansConfig = Record<PlanKey, PlanConfig>;

/** Env var naming: WHOP_{KEY}_PLAN_ID, WHOP_{KEY}_PLAN_ID_YEARLY */
function planEnvVar(key: string) {
  return `WHOP_${key.toUpperCase()}_PLAN_ID`;
}
function planEnvVarYearly(key: string) {
  return `WHOP_${key.toUpperCase()}_PLAN_ID_YEARLY`;
}

/** Build plan config by merging static metadata with plan IDs from env vars. */
export function getPlansConfig(): PlansConfig {
  const result = {} as PlansConfig;

  for (const key of PLAN_KEYS) {
    const meta = PLAN_METADATA[key];
    const monthlyId = process.env[planEnvVar(key)] ?? "";
    const yearlyId = process.env[planEnvVarYearly(key)] ?? monthlyId;

    result[key] = {
      ...meta,
      priceMonthly: meta.priceMonthly,
      priceYearly: meta.priceYearly,
      billingIntervals: ["monthly", "yearly"],
      whopPlanId: monthlyId,
      whopPlanIdYearly: yearlyId,
    };
  }

  return result;
}
