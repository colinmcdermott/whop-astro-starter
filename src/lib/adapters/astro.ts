// ---------------------------------------------------------------------------
// Astro cookie adapter for whop-kit
// ---------------------------------------------------------------------------

import type { CookieAdapter, CookieOptions } from "whop-kit/auth";
import type { AstroCookies } from "astro";

/**
 * Create a CookieAdapter from Astro's cookies API.
 */
export function astroCookieAdapter(cookies: AstroCookies): CookieAdapter {
  return {
    get(name: string) {
      return cookies.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      cookies.set(name, value, {
        httpOnly: options.httpOnly,
        secure: options.secure,
        sameSite: options.sameSite,
        maxAge: options.maxAge,
        path: options.path,
      });
    },
    delete(name: string) {
      cookies.delete(name, { path: "/" });
    },
  };
}
