"use client";

import { createClient } from "@/lib/supabase/client";
import { Box, Button, Flex } from "@radix-ui/themes";
import { AlertTriangle, AtSign, Check, CheckCircle, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { signUp } from "../../actions/auth";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameError, setUsernameError] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const supabase = useMemo(() => createClient(), []);

  // Real-time username validation
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 1) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    if (username.length > 30) {
      setUsernameStatus("taken");
      setUsernameError("Username must be 30 characters or less");
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_PLAYER_SERVICE_URL || "http://localhost:8004";
      const response = await fetch(
        `${backendUrl}/players/check-username/${encodeURIComponent(username)}`,
      );

      if (response.ok) {
        setUsernameStatus("available");
        setUsernameError("");
      } else if (response.status === 409) {
        setUsernameStatus("taken");
        setUsernameError(`Username "${username}" is already taken`);
      } else {
        // Handle other error responses
        console.error("Unexpected response:", response.status);
        setUsernameStatus("idle");
        setUsernameError("Could not verify username. Please try again.");
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameStatus("idle");
      setUsernameError(
        "Could not connect to server. Please check your connection.",
      );
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);

    // Debounce the username check
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
  };

  const parseSignupError = (errorMessage: string): string => {
    // Parse database trigger errors into user-friendly messages
    if (errorMessage.includes("already taken")) {
      return errorMessage; // Already user-friendly from trigger
    }
    if (errorMessage.includes("already registered")) {
      return "This email is already registered. Try logging in instead.";
    }
    if (errorMessage.includes("invalid email")) {
      return "Please enter a valid email address.";
    }
    if (errorMessage.includes("password")) {
      return "Password must be at least 6 characters long.";
    }
    if (errorMessage.includes("User already registered")) {
      return "This email is already registered. Try logging in instead.";
    }
    // Generic fallback
    return errorMessage;
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_PLAYER_SERVICE_URL || "http://localhost:8004";

      // Pre-flight check: Verify both username and email are available
      const checkResponse = await fetch(
        `${backendUrl}/players/check-availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.get("name"),
            email: formData.get("email"),
          }),
        },
      );

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json().catch(() => ({}));
        setError(errorData?.detail || "Username or email is already taken");
        return;
      }

      // If availability check passed, proceed with Supabase signup
      const result = await signUp(formData);

      if (result?.error) {
        setError(parseSignupError(result.error));
        return;
      }

      if (result?.message) {
        // Email confirmation required - show success but DON'T redirect
        setSuccess(result.message);
        setName("");
        setEmail("");
        setPassword("");
        setUsernameStatus("idle");
        ref.current?.reset();
        // Note: NOT redirecting here so user sees the confirmation message
        return;
      }

      // Signup was successful and user is auto-logged in — show onboarding
      router.push("/?onboarding=1");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex align="center" direction="column">
      <form
        ref={ref}
        action={handleSubmit}
        className={styles.formContainer}
        autoComplete="off"
        suppressHydrationWarning
      >
        <h1 className={styles.title}>
          <span className={styles.neonText}>So, a new</span>
          <span className={styles.neonTextPink}>challenger? Cute.</span>
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
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {success && (
          <div
            style={{
              color: "#00ff88",
              backgroundColor: "rgba(0, 255, 136, 0.1)",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "10px",
              border: "1px solid #00ff88",
            }}
          >
            <CheckCircle size={16} /> {success}
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
            Sign up with Discord
          </button>
          <button
            type="button"
            className={`${styles.socialButton} ${styles.googleButton}`}
            disabled
            title="Google sign-in coming soon"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <Box className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              Username
            </label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={18} />
              <input
                id="name"
                type="text"
                name="name"
                autoComplete="nickname"
                data-lpignore="true"
                data-1p-ignore="true"
                data-dashlaneignore="true"
                suppressHydrationWarning
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={styles.input}
                placeholder="Pick a username. Make it less embarrassing than your last one."
                required
                maxLength={30}
                style={{
                  borderColor:
                    usernameStatus === "taken"
                      ? "#ff0055"
                      : usernameStatus === "available"
                        ? "#00ff88"
                        : undefined,
                }}
              />
              {usernameStatus === "checking" && (
                <span
                  style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}
                >
                  Checking...
                </span>
              )}
              {usernameStatus === "available" && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#00ff88",
                    marginLeft: "8px",
                  }}
                >
                  <Check size={12} /> Available
                </span>
              )}
            </div>
            {usernameError && (
              <div
                style={{
                  color: "#ff0055",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {usernameError}
              </div>
            )}
          </div>

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
                autoComplete="email"
                data-lpignore="true"
                data-1p-ignore="true"
                data-dashlaneignore="true"
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Give me your email. I promise not to spam… much."
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
                name="password"
                type="password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-dashlaneignore="true"
                suppressHydrationWarning
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="A strong password. Yes, that means not ‘123456’."
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </Box>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.switchLink}>
            Login
          </Link>
        </p>
      </form>
    </Flex>
  );
}
