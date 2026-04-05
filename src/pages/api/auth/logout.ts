import type { APIRoute } from "astro";
import { clearSessionCookie } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  await clearSessionCookie(cookies);
  return Response.redirect(new URL("/", url.origin), 302);
};
