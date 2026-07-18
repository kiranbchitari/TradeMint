import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-link callback. Supabase redirects here with a `code`
 * which we exchange for a session, then forward to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Supabase appends error params when a link is expired/invalid.
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");
  if (errorCode) {
    const message =
      errorCode === "otp_expired" || errorCode === "access_denied"
        ? "Your email link has expired or was already used. Please request a new one."
        : "Could not sign you in. Please try again.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not sign you in. Please try again.")}`,
  );
}
