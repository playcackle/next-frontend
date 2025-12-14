"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function syncPlayerToBackend({
  backendUrl,
  userId,
  name,
  email,
}: {
  backendUrl: string;
  userId: string;
  name: string;
  email: string;
}) {
  try {
    const response = await fetch(`${backendUrl}/players/sync-from-supabase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        name,
        email,
      }),
    });

    if (response.ok) return { warning: null };

    const errorData = await response.json().catch(() => ({}));
    const detail = errorData?.detail as string | undefined;

    // Treat conflicts as non-fatal (e.g., player already exists)
    if (response.status === 409) {
      return {
        warning:
          detail ||
          "Player already exists on the game server. Continuing with your existing profile.",
      };
    }

    return {
      warning:
        detail ||
        "Account created but we could not sync with the game server. Please try logging in again.",
    };
  } catch (syncError) {
    console.error("Error syncing player:", syncError);
    return {
      warning:
        "Account created but we could not reach the game server. Please try logging in again.",
    };
  }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const emailRedirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : undefined;

  if (!backendUrl) {
    return { error: "Backend URL is not configured. Please contact support." };
  }

  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        name, // Store name in user metadata
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Signup failed - no user created" };
  }

  // Check if email confirmation is required
  const needsEmailConfirmation = data.user && !data.session;

  // Sync player to backend database (non-fatal; warnings surfaced)
  const { warning: syncWarning } = await syncPlayerToBackend({
    backendUrl,
    userId: data.user.id,
    name,
    email,
  });

  revalidatePath("/", "layout");

  // Return appropriate message based on email confirmation status
  if (needsEmailConfirmation) {
    return {
      success: true,
      message: "Account created! Please check your email to confirm your account before logging in.",
      warning: syncWarning || undefined,
    };
  }

  // If auto-logged in and we have a warning, redirect but log the warning
  if (syncWarning) {
    console.warn("Signup sync warning:", syncWarning);
  }

  // User is auto-logged in, redirect to home
  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl && data.user) {
    await syncPlayerToBackend({
      backendUrl,
      userId: data.user.id,
      name: (data.user.user_metadata as { name?: string })?.name || data.user.email || "",
      email: data.user.email || "",
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
