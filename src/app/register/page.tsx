"use client";

import { Box, Button, Flex } from "@radix-ui/themes";
import { AtSign, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { signUp } from "../../actions/auth";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(""); // Clear previous errors
    setSuccess("");
    setWarning("");
    setLoading(true);

    try {
      const result = await signUp(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.message) {
        // Email confirmation required
        setSuccess(result.message);
        if (result?.warning) {
          setWarning(result.warning);
        }
        setName("");
        setEmail("");
        setPassword("");
        ref.current?.reset();
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
        <p>So, a new challenger? Cute.</p>

        {error && (
          <div style={{
            color: "#ff0055",
            backgroundColor: "rgba(255, 0, 85, 0.1)",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
            border: "1px solid #ff0055"
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            color: "#00ff88",
            backgroundColor: "rgba(0, 255, 136, 0.1)",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
            border: "1px solid #00ff88"
          }}>
            ✅ {success}
          </div>
        )}

        {warning && (
          <div style={{
            color: "#ffb400",
            backgroundColor: "rgba(255, 180, 0, 0.1)",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
            border: "1px solid #ffb400"
          }}>
            ⚠️ {warning}
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
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Pick a username. Make it less embarrassing than your last one."
                required
              />
            </div>
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

          <Button type="submit" className={styles.submitButton} disabled={loading}>
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
