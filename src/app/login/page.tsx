"use client";

import { Box, Button, Flex } from "@radix-ui/themes";
import { AtSign, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import styles from "../login/auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    // If already signed in (e.g., email link), bounce to home
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (data.user) {
        router.replace("/");
      }
    };
    checkUser();

    // Redirect as soon as Supabase reports SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;
      if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });

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

        {error && <p style={{ color: "red" }}>{error}</p>}

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

          <Button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Logging in..." : "Fine, let's go"}
          </Button>
        </Box>
      </form>
    </Flex>
  );
}
