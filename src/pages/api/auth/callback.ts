import type { APIRoute } from "astro";
import { exchangeCodeForTokens, getWhopUser } from "whop-kit/whop";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL || "http://localhost:4321";
}

export const GET: APIRoute = async ({ url, cookies, request }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=missing_params" } });
  }

  // Retrieve PKCE state
  const pkceCookie = cookies.get("pkce")?.value;
  if (!pkceCookie) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=missing_pkce" } });
  }

  const pkce = JSON.parse(pkceCookie);
  if (pkce.state !== state) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=state_mismatch" } });
  }

  cookies.delete("pkce", { path: "/" });

  const clientId = process.env.WHOP_APP_ID;
  if (!clientId) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=not_configured" } });
  }

  try {
    const origin = getOrigin(request);
    const redirectUri = `${origin}/api/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, pkce.codeVerifier, redirectUri, clientId);
    const whopUser = await getWhopUser(tokens.access_token);

    // Upsert user
    const existingCount = await prisma.user.count();
    const user = await prisma.user.upsert({
      where: { whopUserId: whopUser.sub },
      update: {
        email: whopUser.email ?? null,
        name: whopUser.name ?? null,
        profileImageUrl: whopUser.picture ?? null,
      },
      create: {
        whopUserId: whopUser.sub,
        email: whopUser.email ?? null,
        name: whopUser.name ?? null,
        profileImageUrl: whopUser.picture ?? null,
        isAdmin: existingCount === 0, // first user is admin
      },
    });

    await setSessionCookie(
      {
        userId: user.id,
        whopUserId: user.whopUserId,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        plan: user.plan as "free" | "pro",
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        isAdmin: user.isAdmin,
      },
      cookies,
    );

    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  } catch (err) {
    console.error("[Auth] Callback error:", err);
    return new Response(null, { status: 302, headers: { Location: "/login?error=auth_failed" } });
  }
};
