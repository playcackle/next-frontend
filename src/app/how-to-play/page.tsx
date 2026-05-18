"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

const STEPS = [
  {
    id: 1,
    type: "text" as const,
    icon: "?",
    title: "Welcome to Cackle",
    body: "Trivia reinvented! Jump into a game room and get started.",
  },
  {
    id: 2,
    type: "text" as const,
    icon: "#",
    title: "Round Topic",
    body: "Each game has X rounds. Every round has a topic. Type answers that fit the topic.",
  },
  {
    id: 3,
    type: "text" as const,
    icon: "*",
    title: "Find the Answers",
    body: "Each round has a set number of answers to uncover. Every correct answer fills a slot on the board. Look for purple slots — those answers are rare and worth extra points.",
  },
  {
    id: 4,
    type: "text" as const,
    icon: ">",
    title: "Type Fast",
    body: "Type answers directly in the chat. No submit button. No turns. If your answer is correct, it instantly fills a slot. If you're first — you claim it.",
  },
  {
    id: 5,
    type: "text" as const,
    icon: "!",
    title: "Hints",
    body: "Stuck? Hints may drop mid-round below the answer grid as cyan chips. Bot Bob will also snipe clues in the chat — keep an eye on what he says.",
  },
  {
    id: 6,
    type: "text" as const,
    icon: "@",
    title: "Beat the Clock",
    body: "Every room has a countdown timer. Find as many answers as you can before time runs out. Between rounds and after the game, Bot Bob will announce accolades and highlight top performers in the chat.",
  },
  {
    id: 7,
    type: "tour" as const,
    title: "The Game Room",
  },
];

function TourStep() {
  return (
    <div className={styles.tourWrapper}>
      {/* Top callouts */}
      <div className={styles.tourTopRow}>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>1</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Round topic</strong>
            <p>
              Each game has <strong>12 rounds</strong>. Every round has a{" "}
              <strong>topic</strong>. Type answers that fit the topic.
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownRight}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>2</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Beat the clock</strong>
            <p>
              The <strong className={styles.tourYellow}>timer</strong> counts
              down each round. Find as many answers as you can{" "}
              <strong>before it hits zero</strong>.
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownCenter}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>3</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>
              Find the answers
            </strong>
            <p>
              Each round has a <strong>set number of answers</strong> to
              uncover. Every correct answer{" "}
              <strong>fills a slot on the board</strong>. Look for{" "}
              <strong className={styles.tourPurple}>purple slots</strong> —
              those answers are <strong>rare and worth extra points</strong>.
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownLeft}`} />
        </div>
      </div>

      {/* Frozen game UI */}
      <div className={styles.tourGame}>
        {/* Stats row */}
        <div className={styles.tourStatsRow}>
          {[
            { label: "Looking for:", value: "MAMMALS" },
            { label: "Example, n00b:", value: "Dog" },
            { label: "Hurry up.", value: "00:28", accent: true },
            { label: "Don't mess up.", value: "1 / 12" },
            { label: "Dorks in arena:", value: "7" },
            { label: "Gameroom:", value: "fun-room" },
          ].map((s) => (
            <div
              key={s.label}
              className={`${styles.tourStatTile} ${s.accent ? styles.tourStatTileTimer : ""}`}
            >
              <span className={styles.tourStatLabel}>{s.label}</span>
              <span
                className={`${styles.tourStatValue} ${s.accent ? styles.tourStatAccent : ""}`}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
        {/* Content */}
        <div className={styles.tourContentRow}>
          {/* Chat */}
          <div className={styles.tourChat}>
            <div className={styles.tourMessages}>
              {["cat", "dog", "lion", "whale", "bear", "fox"].map((m) => (
                <div key={m} className={styles.tourMsg}>
                  {m}
                </div>
              ))}
            </div>
            <div className={styles.tourInput}>Type...</div>
          </div>
          {/* Answer grid with hints below */}
          <div className={styles.tourSlotsWrapper}>
            {/* Hero: progress ring + status */}
            <div className={styles.tourAnswerHero}>
              <div className={styles.tourProgressRing}>
                <svg viewBox="0 0 100 100" className={styles.tourProgressSvg}>
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="var(--neon-pink)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="276.46"
                    strokeDashoffset="82.94"
                    className={styles.tourProgressFill}
                  />
                </svg>
                <div className={styles.tourProgressLabel}>
                  <span className={styles.tourProgressCount}>7</span>
                  <span className={styles.tourProgressTotal}>/ 10</span>
                </div>
              </div>
              <div className={styles.tourAnswerStatus}>
                <p className={styles.tourAnswerTitle}>7 answers found</p>
                <p className={styles.tourAnswerSub}>
                  3 still to find — keep typing!
                </p>
              </div>
            </div>
            {/* Dot row */}
            <div className={styles.tourDotRow}>
              {[
                { found: true },
                { found: true },
                { found: true, purple: true },
                { found: true },
                { found: true },
                { found: true },
                { found: true },
                { empty: true },
                { empty: true },
                { empty: true, purple: true },
              ].map((dot, i) => (
                <div
                  key={i}
                  className={`${styles.tourDot} ${dot.found ? styles.tourDotFound : styles.tourDotEmpty} ${dot.purple ? styles.tourDotPurple : ""}`}
                >
                  {dot.empty && dot.purple && (
                    <span className={styles.tourDot2x}>2x</span>
                  )}
                </div>
              ))}
            </div>
            {/* Answer chips */}
            <div className={styles.tourChipGrid}>
              {[
                { label: "CAT", player: "player_1" },
                { label: "DOG", player: "player_2" },
                { label: "LION", player: "player_1", purple: true },
                { label: "WHALE", player: "player_3" },
                { label: "BEAR", player: "player_2" },
                { label: "FOX", player: "player_1" },
                { label: "RAT", player: "player_4" },
              ].map((chip, i) => (
                <div
                  key={i}
                  className={`${styles.tourChip} ${chip.purple ? styles.tourChipPurple : ""}`}
                >
                  <div className={styles.tourChipContent}>
                    <span className={styles.tourChipText}>{chip.label}</span>
                    <span className={styles.tourChipPlayer}>{chip.player}</span>
                  </div>
                  {chip.purple && (
                    <span className={styles.tourChipMultiplier}>2x</span>
                  )}
                </div>
              ))}
            </div>
            {/* Hints strip */}
            <div className={styles.tourHintsStrip}>
              <span className={styles.tourHintsLabel}>
                Fine. Here&apos;s your help, loser
              </span>
              <div className={styles.tourHintsChips}>
                <span className={styles.tourHintChip}>has whiskers</span>
                <span className={styles.tourHintChip}>lives in the sea</span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className={styles.tourLeader}>
            <div className={styles.tourLeaderTitle}>Leaderboard</div>
            {[
              { name: "player_1", score: 240 },
              { name: "player_2", score: 190 },
              { name: "player_3", score: 155 },
              { name: "player_4", score: 120 },
              { name: "player_5", score: 80 },
            ].map((p, i) => (
              <div key={p.name} className={styles.tourLeaderRow}>
                <span
                  className={`${styles.tourRank} ${i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : i === 2 ? styles.rankBronze : ""}`}
                >
                  {i + 1}
                </span>
                <span className={styles.tourLeaderName}>{p.name}</span>
                <span className={styles.tourLeaderScore}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom callouts - swapped box 2 and 4 */}
      <div className={styles.tourBottomRow}>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>4</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Type fast</strong>
            <p>
              Type answers directly in the chat.{" "}
              <strong>No submit button. No turns.</strong> If your answer is
              correct, <strong>it instantly fills a slot.</strong> If
              you&apos;re first — <strong>you claim it.</strong>
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpRight}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>5</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Hints</strong>
            <p>
              Hints appear as{" "}
              <strong className={styles.tourCyan}>cyan chips</strong> below the
              answer grid. Bot Bob also{" "}
              <strong>snipes clues in the chat</strong>.
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpCenter}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>6</span>

          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Leaderboard</strong>
            <p>
              Live scores update as answers are claimed. Bot Bob announces{" "}
              <strong>accolades</strong> in the chat after the game.
            </p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpCenter}`} />
        </div>
      </div>
    </div>
  );
}

export default function HowToPlayPage() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (next: number) => {
    if (animating || next < 0 || next >= STEPS.length) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isTour = current.type === "tour";

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.content} ${isTour ? styles.contentWide : ""}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerLabel}>HOW TO PLAY</span>
          <Link href="/" className={styles.skipBtn}>
            BACK TO HOME
          </Link>
        </div>

        {/* Step content */}
        <div
          className={`${styles.stepBody} ${animating ? styles.stepBodyHidden : styles.stepBodyVisible} ${isTour ? styles.stepBodyTour : ""}`}
        >
          {isTour ? (
            <TourStep />
          ) : (
            <>
              <div className={styles.stepIcon} aria-hidden="true">
                {current.icon}
              </div>
              <h2 className={styles.stepTitle}>{current.title}</h2>
              <p className={styles.stepText}>{current.body}</p>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div
          className={styles.dots}
          role="tablist"
          aria-label="Onboarding steps"
        >
          {STEPS.map((s, i) => (
            <button
              type="button"
              key={s.id}
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}`}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""} ${i < step ? styles.dotDone : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
          >
            BACK
          </button>
          {isLast ? (
            <Link
              href="/"
              className={`${styles.navBtn} ${styles.navBtnPrimary}`}
            >
              {"LET'S GO"}
            </Link>
          ) : (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navBtnPrimary}`}
              onClick={() => goTo(step + 1)}
            >
              NEXT
            </button>
          )}
        </div>

        {/* Step counter */}
        <p className={styles.stepCounter}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
