import type { APIRoute } from "astro";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  if (body.confirmation !== "DELETE") {
    return new Response(
      JSON.stringify({ error: 'Confirmation required. Send { "confirmation": "DELETE" }' }),
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: session.userId } });
  await clearSessionCookie(cookies);

  return new Response(JSON.stringify({ deleted: true }));
};
