import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Cackle",
};

export default function PrivacyPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.meta}>Last updated: March 2026</p>
      </div>

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. What We Collect</h2>
          <p>When you sign up or sign in to Cackle, we collect:</p>
          <ul>
            <li>Your email address</li>
            <li>Your display name (from your account or OAuth provider)</li>
            <li>Your profile picture URL (if provided by your OAuth provider)</li>
            <li>Game activity: answers submitted, scores, and leaderboard positions</li>
          </ul>
          <p>
            When you sign in with Google or Discord, your OAuth provider shares
            your basic profile information (name, email, avatar) with us. We do
            not receive your password from these providers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. How We Use Your Data</h2>
          <ul>
            <li>To create and manage your player account</li>
            <li>To display your name and score on leaderboards</li>
            <li>To improve game content and performance</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Data Storage</h2>
          <p>
            Your data is stored securely using Supabase. Authentication is
            handled by Supabase Auth. We retain your data for as long as your
            account is active. You may request deletion of your account and data
            at any time by contacting us.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — database and authentication (
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                privacy policy
              </a>
              )
            </li>
            <li>
              <strong>Google OAuth</strong> — optional sign-in (
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                privacy policy
              </a>
              )
            </li>
            <li>
              <strong>Discord OAuth</strong> — optional sign-in (
              <a
                href="https://discord.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                privacy policy
              </a>
              )
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Cookies</h2>
          <p>
            We use cookies solely to manage your authentication session. No
            tracking or advertising cookies are used.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Your Rights</h2>
          <p>You may request to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data</li>
          </ul>
          <p>
            To exercise these rights, contact us at the address below.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Contact</h2>
          <p>
            Questions about this policy? Reach out via the Cackle community or
            open an issue on our GitHub repository.
          </p>
        </section>
      </div>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>
        <Link href="/terms" className={styles.backLink}>
          Terms of Service →
        </Link>
      </div>
    </div>
  );
}
