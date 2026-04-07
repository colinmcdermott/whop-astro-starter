import type { APIRoute } from "astro";
import { buildAuthorizationUrl } from "whop-kit/whop";

export const prerender = false;

function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL || "http://localhost:4321";
}

export const GET: APIRoute = async ({ cookies, request }) => {
  const clientId = process.env.WHOP_APP_ID;
  if (!clientId) {
    return new Response("WHOP_APP_ID not configured", { status: 500 });
  }

  const origin = getOrigin(request);
  const redirectUri = `${origin}/api/auth/callback`;
  const { url: authUrl, codeVerifier, state, nonce } = await buildAuthorizationUrl(redirectUri, clientId);

  // Store PKCE state in a cookie
  cookies.set("pkce", JSON.stringify({ codeVerifier, state, nonce }), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return new Response(null, { status: 302, headers: { Location: authUrl } });
};
