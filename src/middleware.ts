import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Protect /dashboard routes — check for session cookie
  if (context.url.pathname.startsWith("/dashboard")) {
    const sessionCookie = context.cookies.get("session");
    if (!sessionCookie?.value) {
      return context.redirect("/login");
    }
  }
  return next();
});
