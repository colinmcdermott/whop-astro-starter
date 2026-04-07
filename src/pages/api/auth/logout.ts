import type { APIRoute } from "astro";
import { clearSessionCookie } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  await clearSessionCookie(cookies);
  return new Response(null, { status: 302, headers: { Location: "/" } });
};
