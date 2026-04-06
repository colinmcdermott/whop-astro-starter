import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 401 });
  }
  return new Response(JSON.stringify({ authenticated: true, ...session }));
};
