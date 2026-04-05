import type { APIRoute } from "astro";
import { buildAuthorizationUrl } from "whop-kit/whop";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  const clientId = process.env.WHOP_APP_ID;
  if (!clientId) {
    return new Response("WHOP_APP_ID not configured", { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth/callback`;
  const { url: authUrl, codeVerifier, state, nonce } = await buildAuthorizationUrl(redirectUri, clientId);

  // Store PKCE state in a cookie
  cookies.set("pkce", JSON.stringify({ codeVerifier, state, nonce }), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return Response.redirect(authUrl, 302);
};
