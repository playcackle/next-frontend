"use client"

import React, { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { useRouter } from "next/navigation"
import styles from "./onboarding-modal.module.css"

const STEPS = [
  {
    id: 1,
    icon: "?",
    title: "Welcome to Cackle",
    body: "Trivia reinvented! Jump into a game room and get started.",
  },
  {
    id: 2,
    icon: "#",
    title: "Round Topic",
    body: "Each game has 12 rounds. Every round has a topic. Type answers that fit the topic.",
  },
  {
    id: 3,
    icon: "*",
    title: "Find the Answers",
    body: "Each round has a set number of answers to uncover. Every correct answer fills a slot on the board. Look for purple slots — those answers are rare and worth extra points.",
  },
  {
    id: 4,
    icon: ">",
    title: "Type Fast",
    body: "Type answers directly in the chat. No submit button. No turns. If your answer is correct, it instantly fills a slot. If you're first — you claim it.",
  },
  {
    id: 5,
    icon: "!",
    title: "BotBob & Hints",
    body: "Stuck? Hints may drop mid-round. Sometimes they come from BotBob, our AI trickster who likes to stir chaos.",
  },
  {
    id: 6,
    icon: "@",
    title: "Beat the Clock",
    body: "Every room has a countdown timer. Find as many answers as you can before time runs out. Then watch the leaderboard explode.",
  },
]

interface OnboardingModalProps {
  show: boolean
}

export default function OnboardingModal({ show }: OnboardingModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [show])

  const dismiss = () => {
    setOpen(false)
    // Remove the onboarding query param without adding to history
    router.replace("/")
  }

  const goTo = (next: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 180)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <Dialog.Title>How to Play</Dialog.Title>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerLabel}>HOW TO PLAY</span>
            <button
              type="button"
              className={styles.skipBtn}
              onClick={dismiss}
              aria-label="Skip onboarding"
            >
              SKIP
            </button>
          </div>

          {/* Step content */}
          <div className={`${styles.stepBody} ${animating ? styles.stepBodyHidden : styles.stepBodyVisible}`}>
            <div className={styles.stepIcon} aria-hidden="true">
              {current.icon}
            </div>
            <h2 className={styles.stepTitle}>{current.title}</h2>
            <p className={styles.stepText}>{current.body}</p>
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
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
            >
              BACK
            </button>

            {isLast ? (
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                onClick={dismiss}
              >
                {"LET'S GO"}
              </button>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
