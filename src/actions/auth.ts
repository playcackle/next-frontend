"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const emailRedirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : undefined;

  // Sign up with Supabase (database trigger auto-creates player record)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        name, // Store name in user metadata for trigger
      },
    },
  });

  if (error) {
    // Trigger errors (like duplicate username) will surface here
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed - no user created" };
  }

  // Check if email confirmation is required
  const needsEmailConfirmation = data.user && !data.session;

  revalidatePath("/", "layout");

  // Return appropriate message based on email confirmation status
  if (needsEmailConfirmation) {
    return {
      success: true,
      message: "Account created! Please check your email to confirm your account before logging in.",
    };
  }

  // User is auto-logged in, redirect to home
  redirect("/");
}

