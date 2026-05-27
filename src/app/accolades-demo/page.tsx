import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BadgeCheck,
  Crosshair,
  Donut,
  Flame,
  Keyboard,
  Magnet,
  Search,
  Shield,
  Skull,
  Sword,
  Swords,
  Target,
  Timer,
  Trash2,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import styles from "./page.module.css";

interface AccoladeEntry {
  key: string;
  title: string;
  description: string;
  rule: string;
  icon: LucideIcon;
  color: string;
}

const ROUND_ACCOLADES: AccoladeEntry[] = [
  {
    key: "first_blood",
    title: "First Blood",
    description: "First correct answer of the round.",
    rule: "Granted to whoever lands the opening hit. Bot Bob respects the player who makes the lobby nervous first.",
    icon: Sword,
    color: "#8b0000",
  },
  {
    key: "double_tap",
    title: "Double Tap",
    description: "Two correct answers within ten seconds.",
    rule: "Hit two slots back-to-back before the room can breathe. Greedy little gremlin behavior.",
    icon: Zap,
    color: "#ff6b00",
  },
  {
    key: "absolutely_feral",
    title: "Absolutely Feral",
    description: "Most correct answers in the round.",
    rule: "Awarded to the player who tears through the board harder than anyone else. Someone check their keyboard.",
    icon: Flame,
    color: "#ff1493",
  },
  {
    key: "the_cleaner",
    title: "The Cleaner",
    description: "Snapped the last remaining slot.",
    rule: "You mopped up the final unsolved answer. Not glamorous, but the board needed a janitor.",
    icon: Trash2,
    color: "#9b59b6",
  },
  {
    key: "ice_cold",
    title: "Ice Cold",
    description: "Claimed a rare slot in the final seconds.",
    rule: "A high-value rare slot, 30 seconds or less on the clock, and somehow you didn't panic. Disgusting composure.",
    icon: Timer,
    color: "#1e90ff",
  },
  {
    key: "almost_famous",
    title: "Almost Famous",
    description: "Highest near-miss rate this round.",
    rule: "You were nearly right a worrying amount of the time. Inspirationally wrong, but Bot Bob noticed.",
    icon: AlertCircle,
    color: "#ffa500",
  },
  {
    key: "donut",
    title: "Donut",
    description: "Zero points this round.",
    rule: "A bold minimalist performance. No points, no pressure, no evidence of gameplay.",
    icon: Donut,
    color: "#ff8fb1",
  },
];

const LIVE_MOMENTS: AccoladeEntry[] = [
  {
    key: "sniper_moment",
    title: "Sniper",
    description: "Stole another player's near-miss.",
    rule: "Not a normal round award anymore — Bot Bob calls it out when it happens, then it feeds postgame awards like Hunting Season and Piñata.",
    icon: Swords,
    color: "#9932cc",
  },
  {
    key: "fumble_recovery",
    title: "Fumble Recovery",
    description: "Recovered your own near-miss.",
    rule: "You almost threw it, then fixed it. Bot Bob may comment live, but this mainly feeds clutch/grit stats.",
    icon: Shield,
    color: "#00bfff",
  },
  {
    key: "vendetta",
    title: "Vendetta",
    description: "Sniped the same player repeatedly.",
    rule: "If one player steals from the same victim multiple times, Bot Bob starts asking questions. That's not strategy — that's a personal problem.",
    icon: Crosshair,
    color: "#c0392b",
  },
];

const POSTGAME_ACCOLADES: AccoladeEntry[] = [
  {
    key: "board_lord",
    title: "Board Lord",
    description: "Highest total score in the game.",
    rule: "The final leaderboard winner. Everyone else was decorative.",
    icon: Trophy,
    color: "#f1c40f",
  },
  {
    key: "aimbot",
    title: "Aimbot",
    description: "Best accuracy across the whole game.",
    rule: "Highest accuracy or typing precision over all rounds. Annoyingly clean. Suspiciously clean.",
    icon: Target,
    color: "#00ff66",
  },
  {
    key: "flawless",
    title: "Flawless",
    description: "No wrong submissions all game.",
    rule: "Every submission was a hit. Minimum activity required, because hiding in a corner is not perfection.",
    icon: BadgeCheck,
    color: "#00ffff",
  },
  {
    key: "loot_goblin",
    title: "Loot Goblin",
    description: "Most rare slots claimed.",
    rule: "Hoarded more high-value rare slots than anyone else. Share the wealth, goblin.",
    icon: Magnet,
    color: "#8e44ad",
  },
  {
    key: "prompt_dependent",
    title: "Prompt Dependent",
    description: "Most hint-assisted correct answers.",
    rule: "Bot Bob dropped the hints, and you followed the trail. Useful? Yes. Dignified? Debatable.",
    icon: Search,
    color: "#556b2f",
  },
  {
    key: "hunting_season",
    title: "Hunting Season",
    description: "Most snipes dealt.",
    rule: "Stole more near-misses than anyone else across the game. The lobby was not safe.",
    icon: Crosshair,
    color: "#c0392b",
  },
  {
    key: "pinata",
    title: "Piñata",
    description: "Got sniped the most.",
    rule: "Your near-misses got cracked open more than anyone else's. Candy for the lobby.",
    icon: Skull,
    color: "#2c3e50",
  },
  {
    key: "dial_up",
    title: "Dial-Up",
    description: "Slowest successful scorer.",
    rule: "You did answer correctly. Eventually. Bot Bob and several geological eras were waiting.",
    icon: Timer,
    color: "#c7b56e",
  },
  {
    key: "still_typing",
    title: "Still Typing",
    description: "Most too-slow attempts.",
    rule: "You knew the answers, just after everyone else. Technically knowledge. Practically tragic.",
    icon: Keyboard,
    color: "#ff8c00",
  },
  {
    key: "bakery_run",
    title: "Bakery Run",
    description: "Most zero-point rounds.",
    rule: "Collected the most donuts across the game. Deliciously tragic.",
    icon: Donut,
    color: "#ff8fb1",
  },
];

function AccoladeCard({ accolade }: { accolade: AccoladeEntry }) {
  const Icon = accolade.icon;
  return (
    <div
      className={styles.card}
      style={
        {
          "--accent": accolade.color,
        } as React.CSSProperties
      }
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className={styles.cardTitleWrap}>
          <p className={styles.cardTitle}>{accolade.title}</p>
          <code className={styles.cardKey}>{accolade.key}</code>
        </div>
      </div>

      <p className={styles.cardDescription}>{accolade.description}</p>

      <div className={styles.ruleBlock}>
        <span className={styles.ruleLabel}>How to earn</span>
        <p className={styles.ruleText}>{accolade.rule}</p>
      </div>
    </div>
  );
}

export default function AccoladesDemoPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>ACCOLADES</span>
          <Link to="/" className={styles.backBtn}>
            BACK TO HOME
          </Link>
        </div>

        <div className={styles.intro}>
          <h1 className={styles.title}>Beta Accolades</h1>
          <p className={styles.subtitle}>
            Bot Bob names your crimes between rounds, then delivers the final verdict at game end.
            The postgame awards are the priority: memorable, spicy, and not just recycled round badges.
          </p>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionLabel} ${styles.sectionLabelRound}`}>
              ROUND AWARDS
            </span>
            <p className={styles.sectionDescription}>
              Quick between-round hits. Smaller, punchier, and tied to what just happened.
            </p>
          </div>
          <div className={styles.grid}>
            {ROUND_ACCOLADES.map((accolade) => (
              <AccoladeCard key={accolade.key} accolade={accolade} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionLabel} ${styles.sectionLabelRoast}`}>
              LIVE BOT BOB MOMENTS
            </span>
            <p className={styles.sectionDescription}>
              These may be called out when they happen, but they mainly feed bigger postgame verdicts.
            </p>
          </div>
          <div className={styles.grid}>
            {LIVE_MOMENTS.map((accolade) => (
              <AccoladeCard key={accolade.key} accolade={accolade} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionLabel} ${styles.sectionLabelPostgame}`}>
              POSTGAME VERDICTS
            </span>
            <p className={styles.sectionDescription}>
              The main beta focus. Bot Bob's final read on the game: winners, goblins, victims, and lag fossils.
            </p>
          </div>
          <div className={styles.grid}>
            {POSTGAME_ACCOLADES.map((accolade) => (
              <AccoladeCard key={accolade.key} accolade={accolade} />
            ))}
          </div>
        </section>

        <p className={styles.footnote}>
          Trigger thresholds, naming, and Bot Bob copy are still being tuned.
          The goal is memorable game-end awards, not a generic achievement list.
        </p>
      </div>
    </div>
  );
}
