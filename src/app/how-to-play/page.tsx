"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function HowToPlayPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.heading}>
        <h1 className={styles.title}>How to Play</h1>
        <p className={styles.subtitle}>
          A quick tour of the game room — find answers, beat the clock, climb
          the board.
        </p>
      </div>

      {/* ── Annotated UI ── */}
      <div className={styles.scene}>
        {/* ─── Callout 1: Round topic — top-left ─── */}
        <div className={`${styles.callout} ${styles.callout1}`}>
          <div className={styles.calloutNumber}>1</div>
          <div className={styles.calloutBody}>
            <h3 className={styles.calloutTitle}>Round topic</h3>
            <p>
              Each game has <strong>X rounds</strong>. Every round has a{" "}
              <strong>topic</strong>. Type answers that fit the topic.
            </p>
          </div>
          <div className={`${styles.calloutTail} ${styles.tailBottomRight}`} />
        </div>

        {/* ─── Callout 4: BotBob — top-right ─── */}
        <div className={`${styles.callout} ${styles.callout4}`}>
          <div className={styles.calloutNumber}>4</div>
          <div className={styles.calloutBody}>
            <h3 className={styles.calloutTitle}>BotBob &amp; Hints</h3>
            <p>
              Stuck? <strong>Hints may drop mid-round.</strong> Sometimes they
              come from <strong>BotBob</strong>, our AI trickster who likes to
              stir chaos.
            </p>
          </div>
          <div className={`${styles.calloutTail} ${styles.tailBottomLeft}`} />
        </div>

        {/* ─── Frozen game UI ─── */}
        <div className={styles.gameFrame}>
          {/* Header bar */}
          <div className={styles.uiHeader}>
            <span className={styles.uiRoomName}>MAMMALS</span>
          </div>

          {/* Stats row */}
          <div className={styles.uiStatsRow} data-zone="stats">
            <div className={styles.uiStatTile}>
              <span className={styles.uiStatLabel}>Looking for</span>
              <span className={styles.uiStatValue}>MAMMALS</span>
            </div>
            <div className={styles.uiStatTile}>
              <span className={styles.uiStatLabel}>Answer with</span>
              <span className={styles.uiStatValue}>
                Things from this category
              </span>
            </div>
            <div className={styles.uiStatTile}>
              <span className={styles.uiStatLabel}>Timer</span>
              <span className={`${styles.uiStatValue} ${styles.timerVal}`}>
                00:44
              </span>
            </div>
            <div className={styles.uiStatTile}>
              <span className={styles.uiStatLabel}>Don&apos;t miss up</span>
              <span className={styles.uiStatValue}>1 / 1</span>
            </div>
            <div className={styles.uiStatTile}>
              <span className={styles.uiStatLabel}>Roles in arena</span>
              <span className={styles.uiStatValue}>7</span>
            </div>
          </div>

          {/* Content row */}
          <div className={styles.uiContentRow}>
            {/* Chat column */}
            <div className={styles.uiChatCol} data-zone="chat">
              <div className={styles.uiMessages}>
                {["cat", "dog", "lion", "whale", "bear", "fox"].map((m) => (
                  <div key={m} className={styles.uiMessage}>
                    {m}
                  </div>
                ))}
              </div>
              <div className={styles.uiInput}>Type...</div>
            </div>

            {/* Slots column */}
            <div className={styles.uiSlotsCol} data-zone="slots">
              <div className={styles.uiSlotsHeader}>
                <span className={styles.uiSlotsCount}>10</span>
                <span className={styles.uiSlotsLabel}>10 answers found</span>
                <div className={styles.uiSlotsDots}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`${styles.uiSlotDot} ${i < 7 ? styles.dotFilled : ""} ${i === 4 ? styles.dotPurple : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.uiSlotsGrid}>
                {[
                  { label: "CAT", player: "player_1" },
                  { label: "DOG", player: "player_2" },
                  { label: "LION", player: "player_3", purple: true },
                  { label: "WHALE", player: "player_4" },
                  { label: "BEAR", player: "player_1" },
                  { label: "FOX", player: "player_2" },
                  { label: "?", empty: true },
                  { label: "?", empty: true },
                  { label: "?", empty: true },
                  { label: "?", empty: true },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className={`${styles.uiSlot} ${slot.purple ? styles.uiSlotPurple : ""} ${slot.empty ? styles.uiSlotEmpty : ""}`}
                  >
                    {!slot.empty ? (
                      <>
                        <span className={styles.uiSlotAnswer}>
                          {slot.label}
                        </span>
                        <span className={styles.uiSlotPlayer}>
                          {slot.player}
                        </span>
                      </>
                    ) : (
                      <span className={styles.uiSlotQ}>?</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard column */}
            <div className={styles.uiLeaderCol} data-zone="leaderboard">
              <div className={styles.uiLeaderTitle}>Leaderboard</div>
              {[
                { name: "player_1", score: 240 },
                { name: "player_2", score: 190 },
                { name: "player_3", score: 155 },
                { name: "player_4", score: 120 },
                { name: "player_5", score: 80 },
              ].map((p, i) => (
                <div key={p.name} className={styles.uiLeaderRow}>
                  <span
                    className={`${styles.uiLeaderRank} ${i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : i === 2 ? styles.rankBronze : ""}`}
                  >
                    {i + 1}
                  </span>
                  <span className={styles.uiLeaderName}>{p.name}</span>
                  <span className={styles.uiLeaderScore}>{p.score}</span>
                </div>
              ))}
              <div className={styles.uiLeaderMore}>see full leaderboard</div>
            </div>
          </div>
        </div>

        {/* ─── Callout 3: Type fast — bottom-left ─── */}
        <div className={`${styles.callout} ${styles.callout3}`}>
          <div className={styles.calloutNumber}>3</div>
          <div className={styles.calloutBody}>
            <h3 className={styles.calloutTitle}>Type fast</h3>
            <p>
              Type answers directly in the chat.{" "}
              <strong>No submit button. No turns.</strong> If your answer is
              correct, <strong>it instantly fills a slot.</strong> If
              you&apos;re first — <strong>you claim it.</strong>
            </p>
          </div>
          <div className={`${styles.calloutTail} ${styles.tailTopRight}`} />
        </div>

        {/* ─── Callout 2: Find the answers — bottom-center ─── */}
        <div className={`${styles.callout} ${styles.callout2}`}>
          <div className={styles.calloutNumber}>2</div>
          <div className={styles.calloutBody}>
            <h3 className={styles.calloutTitle}>Find the answers</h3>
            <p>
              Each round has a <strong>set number of answers</strong> to
              uncover. Every correct answer{" "}
              <strong>fills a slot on the board</strong>. Look for{" "}
              <strong className={styles.purpleText}>purple slots</strong> —
              those answers are <strong>rare and worth extra points</strong>.
            </p>
          </div>
          <div className={`${styles.calloutTail} ${styles.tailTopCenter}`} />
        </div>

        {/* ─── Callout 5: Beat the clock — bottom-right ─── */}
        <div className={`${styles.callout} ${styles.callout5}`}>
          <div className={styles.calloutNumber}>5</div>
          <div className={styles.calloutBody}>
            <h3 className={styles.calloutTitle}>Beat the clock</h3>
            <p>
              Every room has a <strong>countdown timer</strong>. Find as many
              answers as you can <strong>before time runs out.</strong>
            </p>
            <p className={styles.calloutCoda}>
              Then watch the leaderboard explode.
            </p>
          </div>
          <div className={`${styles.calloutTail} ${styles.tailTopLeft}`} />
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <Link href="/" className={styles.ctaBtn}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
