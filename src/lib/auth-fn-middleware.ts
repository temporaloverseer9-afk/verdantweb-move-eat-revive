import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Attaches the Supabase bearer token to every server-function call.
 * Unlike the generated attacher, it retries once via refreshSession when the
 * session hasn't hydrated yet (avoids "Unauthorized: No authorization header"
 * blank screens right after load), and bounces to /auth when there is truly
 * no session.
 */
export const attachAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  let token: string | undefined;

  if (typeof window !== "undefined") {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;

    if (!token) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      token = refreshed.session?.access_token;
    }

    if (!token && window.location.pathname !== "/auth") {
      window.location.replace("/auth");
      throw new Error("Your session expired — please sign in again.");
    }
  }

  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
