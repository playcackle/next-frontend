import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo =
    requestUrl.searchParams.get("redirect_to") ||
    requestUrl.searchParams.get("next") ||
    "/";

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  if (!code) {
    const fallbackUrl = new URL("/login", requestUrl.origin);
    fallbackUrl.searchParams.set("error", "missing_code");
    fallbackUrl.searchParams.set(
      "error_description",
      "Unable to complete sign-in. Please request a new link."
    );
    return NextResponse.redirect(fallbackUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/login", requestUrl.origin);
    errorUrl.searchParams.set("error", "callback_error");
    errorUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
}
