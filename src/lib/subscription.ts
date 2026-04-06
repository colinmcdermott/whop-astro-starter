import { createSubscriptionHelpers } from "whop-kit/subscriptions";
import { prisma } from "./db";
import { prismaDbAdapter } from "./adapters/prisma";
import { DEFAULT_PLAN, PLAN_KEYS } from "./constants";

export type { SubscriptionStatus, SubscriptionDetails, SubscriptionDetailsResult } from "whop-kit/subscriptions";

const helpers = createSubscriptionHelpers(prismaDbAdapter(prisma), DEFAULT_PLAN, PLAN_KEYS);

export const getSubscriptionDetails = helpers.getSubscriptionDetails;
export const isUserSubscribed = helpers.isUserSubscribed;
export const getUserSubscriptionStatus = helpers.getUserSubscriptionStatus;
export const activateMembership = helpers.activateMembership;
export const deactivateMembership = helpers.deactivateMembership;
export const updateCancelAtPeriodEnd = helpers.updateCancelAtPeriodEnd;
export const uncancelSubscription = helpers.uncancelSubscription;
