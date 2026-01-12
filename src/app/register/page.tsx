"use client";

import { Box, Button, Flex } from "@radix-ui/themes";
import { AtSign, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signUp } from "../../actions/auth";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameError, setUsernameError] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

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
      const backendUrl = process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL || "http://localhost:8001";
      const response = await fetch(`${backendUrl}/players/check-username/${encodeURIComponent(username)}`);

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
      setUsernameError("Could not connect to server. Please check your connection.");
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
      const backendUrl = process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL || "http://localhost:8001";

      // Pre-flight check: Verify both username and email are available
      const checkResponse = await fetch(`${backendUrl}/players/check-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("name"),
          email: formData.get("email")
        })
      });

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

      // If no result (redirect happened), signup was successful and user is auto-logged in
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
          <span className={styles.neonText}>REG</span>
          <span className={styles.neonTextPink}>ISTER</span>
        </h1>
        <p style={{ color: "white" }}>So, a new challenger? Cute.</p>

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
            ⚠️ {error}
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
            ✅ {success}
          </div>
        )}

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
                    usernameStatus === "taken" ? "#ff0055" :
                    usernameStatus === "available" ? "#00ff88" :
                    undefined
                }}
              />
              {usernameStatus === "checking" && (
                <span style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}>
                  Checking...
                </span>
              )}
              {usernameStatus === "available" && (
                <span style={{ fontSize: "12px", color: "#00ff88", marginLeft: "8px" }}>
                  ✓ Available
                </span>
              )}
            </div>
            {usernameError && (
              <div style={{
                color: "#ff0055",
                fontSize: "12px",
                marginTop: "4px"
              }}>
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
