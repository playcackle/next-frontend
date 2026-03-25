"use client";

import { createClient } from "@/lib/supabase/client";
import { Box, Button, Flex } from "@radix-ui/themes";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AtSign, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../login/auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  // Show callback errors from URL params
  useEffect(() => {
    const errorDesc = searchParams.get("error_description");
    if (errorDesc) setError(errorDesc);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    // Use getSession (local, no API call) to avoid rate limiting
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (data.session) {
        router.replace("/");
      }
    };
    checkSession();

    // Redirect as soon as Supabase reports SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        if (event === "SIGNED_IN") {
          router.replace("/");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Navigate immediately; auth listener is a fallback
      router.replace("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex align="center" direction="column">
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={styles.formContainer}
        autoComplete="off"
        suppressHydrationWarning
      >
        <h1 className={styles.title}>
          <span className={styles.neonText}>Back for more?</span>
          <span className={styles.neonTextPink}>Didn't expect that.</span>
        </h1>

        {error && (
          <div
            style={{
              color: "#ff0055",
              backgroundColor: "rgba(255, 0, 85, 0.1)",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "10px",
              border: "1px solid #ff0055",
            }}
          >
            {error}
          </div>
        )}

        <div className={styles.socialButtons}>
          <button
            type="button"
            className={`${styles.socialButton} ${styles.discordButton}`}
            onClick={async () => {
              setError("");
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "discord",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) setError(error.message);
            }}
          >
            <svg width="20" height="15" viewBox="0 0 71 55" fill="none">
              <path
                d="M60.1 4.9A58.5 58.5 0 0 0 45.4.2a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.4 37.4 0 0 0 25.4.3a.2.2 0 0 0-.2-.1 58.4 58.4 0 0 0-14.7 4.6.2.2 0 0 0-.1.1C1.5 18.7-.9 32 .3 45.1v.2a58.9 58.9 0 0 0 17.8 9 .2.2 0 0 0 .3-.1 42.2 42.2 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.8 38.8 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0 42 42 0 0 0 35.8 0 .2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36.4 36.4 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47.3 47.3 0 0 0 3.6 5.9.2.2 0 0 0 .3.1A58.7 58.7 0 0 0 70.7 45.3v-.2c1.4-15-2.3-28-9.8-39.6a.2.2 0 0 0-.1-.1ZM23.7 37c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.1 6.3 7-2.8 7-6.3 7Zm23.3 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.1 6.3 7-2.8 7-6.3 7Z"
                fill="currentColor"
              />
            </svg>
            Sign in with Discord
          </button>
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <Box className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <AtSign className={styles.inputIcon} size={18} />
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                data-lpignore="true"
                data-1p-ignore="true"
                data-dashlaneignore="true"
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-dashlaneignore="true"
                suppressHydrationWarning
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Your super-secret password… that you always forget."
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Fine, let's go"}
          </Button>
        </Box>

        <p className={styles.switchText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.switchLink}>
            Register
          </Link>
        </p>
      </form>
    </Flex>
  );
}
