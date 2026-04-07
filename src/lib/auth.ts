// ---------------------------------------------------------------------------
// Auth — Astro session management, powered by whop-kit
// ---------------------------------------------------------------------------

import {
  createSessionToken as _createSessionToken,
  verifySessionToken as _verifySessionToken,
  setSessionCookie as _setSessionCookie,
  clearSessionCookie as _clearSessionCookie,
  getSessionFromCookie,
  generateSecret,
  encodeSecret,
} from "whop-kit/auth";
import type { Session as BaseSession } from "whop-kit/auth";
import type { AstroCookies } from "astro";
import { astroCookieAdapter } from "./adapters/astro";
import { prisma } from "@/lib/db";
import { PLAN_KEYS, PLAN_RANK, DEFAULT_PLAN, type PlanKey } from "./constants";

export interface Session extends Omit<BaseSession, "plan"> {
  plan: PlanKey;
}

// ---------------------------------------------------------------------------
// Secret management
// ---------------------------------------------------------------------------

let cachedSecret: Uint8Array | null = null;

async function getSecret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret;

  const envSecret = process.env.SESSION_SECRET;
  if (envSecret) {
    cachedSecret = encodeSecret(envSecret);
    return cachedSecret;
  }

  const existing = await prisma.systemConfig.findUnique({
    where: { key: "session_secret" },
  });

  if (existing) {
    cachedSecret = encodeSecret(existing.value);
    return cachedSecret;
  }

  const generated = generateSecret();
  try {
    await prisma.systemConfig.create({
      data: { key: "session_secret", value: generated },
    });
  } catch {
    const raced = await prisma.systemConfig.findUnique({
      where: { key: "session_secret" },
    });
    if (raced) {
      cachedSecret = encodeSecret(raced.value);
      return cachedSecret;
    }
  }

  cachedSecret = encodeSecret(generated);
  return cachedSecret;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

const isProduction = import.meta.env.PROD;

export async function createSessionToken(session: Session): Promise<string> {
  const secret = await getSecret();
  return _createSessionToken(session, secret);
}

export async function setSessionCookie(session: Session, cookies: AstroCookies): Promise<void> {
  const secret = await getSecret();
  return _setSessionCookie(session, secret, astroCookieAdapter(cookies), isProduction);
}

export async function clearSessionCookie(cookies: AstroCookies): Promise<void> {
  return _clearSessionCookie(astroCookieAdapter(cookies), isProduction);
}

export async function getSession(cookies: AstroCookies): Promise<Session | null> {
  const secret = await getSecret();
  const base = await getSessionFromCookie(
    astroCookieAdapter(cookies),
    secret,
    PLAN_KEYS,
    DEFAULT_PLAN,
    async (userId) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, cancelAtPeriodEnd: true },
      });
      if (!user) return null;
      return { plan: user.plan, cancelAtPeriodEnd: user.cancelAtPeriodEnd };
    },
  );
  return base as Session | null;
}

// ---------------------------------------------------------------------------
// Plan gating
// ---------------------------------------------------------------------------

/**
 * Check if a user's plan meets or exceeds a minimum plan level.
 * Pure function — no DB or async needed.
 */
export function hasMinimumPlan(userPlan: PlanKey, minimumPlan: PlanKey): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[minimumPlan] ?? 0);
}

/**
 * Require a minimum plan level. Returns session or null if insufficient.
 * Use in Astro pages: if (!session) return Astro.redirect("/pricing");
 */
export async function requirePlan(
  cookies: AstroCookies,
  minimumPlan: PlanKey,
): Promise<Session | null> {
  const session = await getSession(cookies);
  if (!session) return null;
  if (!hasMinimumPlan(session.plan, minimumPlan)) return null;
  return session;
}
