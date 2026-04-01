"use client";

import styles from "./pre-launch-cta.module.css";

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/ZFHaCs7ut6";

export default function PreLaunchCta() {
  return (
    <div className={styles.container}>
      <div className={styles.message}>
        <h2 className={styles.title}>
          We&rsquo;re Not Ready...{" "}
          <span className={styles.accent}>But You Should Be</span>
        </h2>
        <p className={styles.description}>
          Yeah, we&rsquo;re launching soon. No, we won&rsquo;t tell you exactly
          when. Join Discord if you want the inside scoop (and some chaos).
        </p>
      </div>

      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.discordButton}
      >
        <div className={styles.buttonContent}>
          <span className={styles.buttonIcon}>💬</span>
          <div className={styles.buttonTextContainer}>
            <span className={styles.buttonTitle}>JOIN THE DISCORD</span>
            <span className={styles.buttonSubtitle}>
              Where the dorks hang out
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
