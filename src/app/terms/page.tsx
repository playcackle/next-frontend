import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — Cackle",
};

export default function TermsPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.meta}>Last updated: March 2026</p>
      </div>

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance</h2>
          <p>
            By creating an account or playing Cackle, you agree to these terms.
            If you do not agree, do not use the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Your Account</h2>
          <ul>
            <li>You must provide accurate information when registering.</li>
            <li>You are responsible for keeping your account secure.</li>
            <li>
              You may sign in using email/password, Google, or Discord. By using
              a third-party sign-in, you also agree to that provider&apos;s terms.
            </li>
            <li>One account per person. Do not share accounts.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Cheat, exploit bugs, or use automated bots to gain an advantage</li>
            <li>Harass, abuse, or impersonate other players</li>
            <li>Attempt to access or disrupt our servers or infrastructure</li>
            <li>Submit content that is illegal, offensive, or harmful</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Game Content</h2>
          <p>
            All trivia questions, topics, and game content are owned by Cackle.
            You may not copy, distribute, or reproduce game content without
            permission.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Leaderboards & Scores</h2>
          <p>
            Your username and scores may be displayed publicly on leaderboards.
            We reserve the right to remove scores or accounts that result from
            cheating or exploitation.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Availability</h2>
          <p>
            Cackle is provided &quot;as is&quot;. We do not guarantee uninterrupted
            availability. We may modify, suspend, or discontinue the service at
            any time without notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms. You may delete your account at any time.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Cackle is not liable for any
            indirect, incidental, or consequential damages arising from your use
            of the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of Cackle
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Contact</h2>
          <p>
            Questions? Reach out via the Cackle community or open an issue on
            our GitHub repository.
          </p>
        </section>
      </div>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>
        <Link href="/privacy" className={styles.backLink}>
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
