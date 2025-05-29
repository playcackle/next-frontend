"use client";

import Header from "@/app/components/header";
import SynthwaveBackground from "@/app/components/synthwave-background";
import { Button } from "@radix-ui/themes";
import Link from "next/link";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <SynthwaveBackground />
      <Header />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.neonText}>RETRO</span>
            <span className={styles.neonTextPink}>QUIZ</span>
          </h1>
          <p className={styles.subtitle}>
            Step into the 80s and test your knowledge
          </p>
          <div className={styles.ctaContainer}>
            <Button className={styles.ctaButton} size="3">
              <Link href="/">PLAY NOW</Link>
            </Button>
          </div>
        </section>

        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>80s Themed Quizzes</h3>
              <p className={styles.featureDesc}>
                Test your knowledge of music, movies, technology, and pop
                culture from the radical decade
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Retro Aesthetic</h3>
              <p className={styles.featureDesc}>
                Immerse yourself in neon lights, grid backgrounds, and the
                unmistakable style of the 1980s
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Competitive Leaderboards</h3>
              <p className={styles.featureDesc}>
                Compete with friends and players worldwide to see who knows the
                80s best
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>
                Multiple Difficulty Levels
              </h3>
              <p className={styles.featureDesc}>
                From casual fans to 80s experts, there's a challenge level for
                everyone
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Retro Quiz | All Rights Reserved</p>
      </footer>
    </div>
  );
}
