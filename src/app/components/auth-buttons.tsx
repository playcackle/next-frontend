"use client";

import Link from "next/link";
import styles from "./auth-buttons.module.css";

export function AuthButtons() {
  return (
    <div className={styles.authButtonsContainer}>
      <div className={styles.authMessage}>
        <h2 className={styles.authTitle}>Join the Retro Quiz Revolution</h2>
        <p className={styles.authDescription}>
          Sign up or log in to access our rad collection of 80s-themed quiz
          rooms and challenge your knowledge!
        </p>
      </div>

      <div className={styles.buttonsContainer}>
        <Link href="/register" className={styles.signupButton}>
          <div className={styles.buttonContent}>
            <span className={styles.buttonIcon}>✨</span>
            <div className={styles.buttonTextContainer}>
              <span className={styles.buttonTitle}>SIGN UP</span>
              <span className={styles.buttonSubtitle}>
                Create a new account
              </span>
            </div>
          </div>
        </Link>

        <Link href="/login" className={styles.loginButton}>
          <div className={styles.buttonContent}>
            <span className={styles.buttonIcon}>🔑</span>
            <div className={styles.buttonTextContainer}>
              <span className={styles.buttonTitle}>LOGIN</span>
              <span className={styles.buttonSubtitle}>Join the chaos!</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
