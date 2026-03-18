"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./onboarding-modal.module.css";

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
    body: "Each game has 12 rounds. Every round has a topic. Type answers that fit the topic.",
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
    title: "Hints & Hot Wire",
    body: "Stuck? Hints may drop mid-round to nudge you in the right direction. Keep an eye out for Hot Wire slots — these are live wires waiting to be claimed. First player to answer correctly steals them.",
  },
  {
    id: 6,
    type: "text" as const,
    icon: "@",
    title: "Beat the Clock",
    body: "Every room has a countdown timer. Find as many answers as you can before time runs out. Then watch the leaderboard explode.",
  },
  {
    id: 7,
    type: "tour" as const,
    title: "The Game Room",
  },
];

interface OnboardingModalProps {
  show: boolean;
}

function TourStep() {
  return (
    <div className={styles.tourWrapper}>
      {/* Top callouts */}
      <div className={styles.tourTopRow}>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>1</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Round topic</strong>
            <p>Each game has <strong>12 rounds</strong>. Every round has a <strong>topic</strong>. Type answers that fit the topic.</p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownRight}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>4</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Hints</strong>
            <p>Stuck? <strong>Hints may drop mid-round</strong> to nudge you in the right direction. They appear below the answer slots.</p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownCenter}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>5</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Hot Wire slots</strong>
            <p><strong className={styles.tourOrange}>Orange slots</strong> are <strong>Hot Wire</strong> — live wires up for grabs. First correct answer <strong>steals the slot.</strong></p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailDownLeft}`} />
        </div>
      </div>

      {/* Frozen game UI */}
      <div className={styles.tourGame}>
        {/* Header */}
        <div className={styles.tourGameHeader}>
          <span className={styles.tourGameTitle}>MAMMALS</span>
        </div>
        {/* Stats row */}
        <div className={styles.tourStatsRow}>
          {[
            { label: "Looking for", value: "MAMMALS" },
            { label: "Answer with", value: "Things from this category" },
            { label: "Timer", value: "00:44", accent: true },
            { label: "Don't miss up", value: "1 / 1" },
            { label: "Roles in arena", value: "7" },
          ].map((s) => (
            <div key={s.label} className={styles.tourStatTile}>
              <span className={styles.tourStatLabel}>{s.label}</span>
              <span className={`${styles.tourStatValue} ${s.accent ? styles.tourStatAccent : ""}`}>{s.value}</span>
            </div>
          ))}
        </div>
        {/* Content */}
        <div className={styles.tourContentRow}>
          {/* Chat */}
          <div className={styles.tourChat}>
            <div className={styles.tourMessages}>
              {["cat", "dog", "lion", "whale", "bear", "fox"].map((m) => (
                <div key={m} className={styles.tourMsg}>{m}</div>
              ))}
            </div>
            <div className={styles.tourInput}>Type...</div>
          </div>
          {/* Answer grid with hints below */}
          <div className={styles.tourSlotsWrapper}>
            {/* Slots */}
            <div className={styles.tourSlots}>
              <div className={styles.tourSlotsHeader}>
                <span className={styles.tourSlotsCount}>10</span>
                <span className={styles.tourSlotsLabel}>10 answers found</span>
              </div>
              <div className={styles.tourSlotsGrid}>
                {[
                  { label: "CAT" }, { label: "DOG" }, { label: "LION", purple: true },
                  { label: "WHALE" }, { label: "BEAR" }, { label: "FOX" },
                  { label: "RAT", hotWire: true }, { empty: true }, { empty: true }, { empty: true },
                ].map((slot, i) => (
                  <div key={i} className={`${styles.tourSlot} ${slot.purple ? styles.tourSlotPurple : ""} ${slot.hotWire ? styles.tourSlotHotWire : ""} ${slot.empty ? styles.tourSlotEmpty : ""}`}>
                    {slot.empty ? <span className={styles.tourSlotQ}>?</span> : <span className={styles.tourSlotLabel}>{slot.label}</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Hints strip */}
            <div className={styles.tourHintsStrip}>
              <span className={styles.tourHintsLabel}>Hints</span>
              <div className={styles.tourHintsChips}>
                <span className={styles.tourHintChip}>has whiskers</span>
                <span className={styles.tourHintChip}>lives in the sea</span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className={styles.tourLeader}>
            <div className={styles.tourLeaderTitle}>Leaderboard</div>
            {[{ name: "player_1", score: 240 }, { name: "player_2", score: 190 }, { name: "player_3", score: 155 }, { name: "player_4", score: 120 }, { name: "player_5", score: 80 }].map((p, i) => (
              <div key={p.name} className={styles.tourLeaderRow}>
                <span className={`${styles.tourRank} ${i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : i === 2 ? styles.rankBronze : ""}`}>{i + 1}</span>
                <span className={styles.tourLeaderName}>{p.name}</span>
                <span className={styles.tourLeaderScore}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom callouts */}
      <div className={styles.tourBottomRow}>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>3</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Type fast</strong>
            <p>Type answers directly in the chat. <strong>No submit button. No turns.</strong> If your answer is correct, <strong>it instantly fills a slot.</strong> If you&apos;re first — <strong>you claim it.</strong></p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpRight}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>2</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Find the answers</strong>
            <p>Each round has a <strong>set number of answers</strong> to uncover. Every correct answer <strong>fills a slot on the board</strong>. Look for <strong className={styles.tourPurple}>purple slots</strong> — those answers are <strong>rare and worth extra points</strong>.</p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpCenter}`} />
        </div>
        <div className={styles.tourCallout}>
          <span className={styles.tourCalloutNum}>6</span>
          <div className={styles.tourCalloutBody}>
            <strong className={styles.tourCalloutTitle}>Beat the clock</strong>
            <p>Every room has a <strong>countdown timer</strong>. Find as many answers as you can <strong>before time runs out.</strong></p>
            <p className={styles.tourCoda}>Then watch the leaderboard explode.</p>
          </div>
          <div className={`${styles.tourTail} ${styles.tourTailUpLeft}`} />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingModal({ show }: OnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [show]);

  const dismiss = () => {
    setOpen(false);
    router.replace("/");
  };

  const goTo = (next: number) => {
    if (animating) return;
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
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={`${styles.content} ${isTour ? styles.contentWide : ""}`}
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>How to Play</Dialog.Title>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerLabel}>HOW TO PLAY</span>
            <button type="button" className={styles.skipBtn} onClick={dismiss} aria-label="Skip onboarding">
              SKIP
            </button>
          </div>

          {/* Step content */}
          <div className={`${styles.stepBody} ${animating ? styles.stepBodyHidden : styles.stepBodyVisible} ${isTour ? styles.stepBodyTour : ""}`}>
            {isTour ? (
              <TourStep />
            ) : (
              <>
                <div className={styles.stepIcon} aria-hidden="true">{current.icon}</div>
                <h2 className={styles.stepTitle}>{current.title}</h2>
                <p className={styles.stepText}>{current.body}</p>
              </>
            )}
          </div>

          {/* Progress dots */}
          <div className={styles.dots} role="tablist" aria-label="Onboarding steps">
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
            <button type="button" className={styles.navBtn} onClick={() => goTo(step - 1)} disabled={step === 0}>
              BACK
            </button>
            {isLast ? (
              <button type="button" className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={dismiss}>
                {"LET'S GO"}
              </button>
            ) : (
              <button type="button" className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={() => goTo(step + 1)}>
                NEXT
              </button>
            )}
          </div>

          {/* Step counter */}
          <p className={styles.stepCounter}>{step + 1} / {STEPS.length}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
