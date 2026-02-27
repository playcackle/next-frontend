# Phase 2: Chat UX - Research

**Researched:** 2026-02-27
**Domain:** React CSS Modules styling, Jotai state, unified message feed visual differentiation
**Confidence:** HIGH

## Summary

Phase 2 is a pure styling/UX phase with no new data plumbing required. The backend already sends a `unified_message` socket event with a `message_type` field (`chat`, `answer_attempt`, `successful_answer`, `failed_answer`) and a `submission_result` field (`success`, `too_slow`, `incorrect`, `already_snapped`). The `UnifiedMessages` component already calls `getMessageTypeClass()` which maps these types to CSS Module classes. The work is to make those CSS classes produce clearly distinct, game-appropriate visual treatments — and to address the "duplicate/already-answered" case which currently has no dedicated `message_type` (it arrives as `failed_answer` with `submission_result === "already_snapped"`).

Bot Bob messages already arrive in the unified feed because the `addUnifiedMessageAtom` atom detects `player_id === "botbob"` or `display_name.toLowerCase() === "botbob"` and sets `botBobLastMessageAtom` for the pinned banner. However, Bot Bob messages that appear in the scrolling feed use the default `chatMessage` CSS class with a purple left border — they are not visually distinct from regular player chat messages in the feed itself. The pinned banner exists but the feed row does not differentiate Bot Bob from humans.

All work stays within the existing stack: Next.js 16, React 19, Jotai, CSS Modules, Radix UI Flex, `animate.css`. No new libraries are needed. Performance mode must be respected — any new animations must be skipped when `performanceModeAtom` is true.

**Primary recommendation:** Add dedicated CSS classes for each of the four message variants (correct answer, Bot Bob hint, duplicate attempt, regular failed attempt), and add a `botbob` detection branch in `getMessageTypeClass()`. Apply a badge/icon label prefix inside each message row to supplement color so players without color perception can distinguish types at a glance.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | Correct answer submissions are visually distinguished in the unified chat feed (distinct color or animation) | `successful_answer` message_type already exists and has `.successfulAnswerMessage` CSS class — needs stronger visual treatment: icon badge + gold glow |
| CHAT-02 | Bot Bob hint messages are visually distinguished in the unified chat feed | Bot Bob detection exists in atom (`player_id === "botbob"`), but `getMessageTypeClass()` in UnifiedMessages doesn't branch on it — need a `botbob` CSS class and icon badge in the feed row |
| CHAT-03 | Duplicate answer attempts (already submitted/correct) are visually distinguished from regular attempts | `submission_result === "already_snapped"` is in the type system but not mapped to a distinct CSS class — currently renders same as `failedAnswerMessage`; need dedicated class |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Modules (`gameroom.module.css`) | built-in | Per-component scoped styles | Project convention — all gameroom styles live here |
| Jotai | 2.15.2 | Read `performanceModeAtom` to suppress animations | Already used everywhere in gameroom |
| `animate.css` | latest | Entrance animations for message rows | Already a project dependency |
| Radix UI Themes (`Flex`) | latest | Layout within message rows | Already used in `UnifiedMessages.tsx` |
| Lucide React | 0.555.0 | Icon badges (check, bot, duplicate indicator) | Already installed — use `CheckCircle`, `Bot`, `Copy` icons |

### No New Installs Required

This phase requires zero new dependencies. Everything needed is already installed.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure

No new files needed beyond CSS additions. All changes are to existing files:

```
src/app/gameroom/
├── components/
│   └── UnifiedMessages.tsx     # Add botbob branch in getMessageTypeClass(), add icon badges
├── gameroom.module.css          # Add CSS classes: botBobMessage, duplicateMessage, improve existing
└── store/
    └── gameAtoms.ts             # No changes needed — message_type already correct
```

### Pattern 1: CSS Module Class per Message Type

**What:** Each `message_type` value maps to a single CSS class via `getMessageTypeClass()`. The class provides background tint, border-left color, and optional glow animation.

**When to use:** This is the existing pattern — extend it, do not replace it.

**Current implementation in `UnifiedMessages.tsx`:**
```typescript
const getMessageTypeClass = (messageType: string) => {
  switch (messageType) {
    case "answer_attempt":
      return styles.answerMessage;
    case "successful_answer":
      return styles.successfulAnswerMessage;
    case "failed_answer":
      return styles.failedAnswerMessage;
    default:
      return styles.chatMessage;
  }
};
```

**Required additions:**
```typescript
// The function must also accept the full message to detect botbob and already_snapped
const getMessageTypeClass = (msg: UnifiedMessage) => {
  // Bot Bob detection — must precede other checks
  if (msg.player_id === "botbob" || msg.display_name.toLowerCase() === "botbob") {
    return styles.botBobMessage;
  }
  switch (msg.message_type) {
    case "answer_attempt":
      // Distinguish already_snapped from incorrect/too_slow
      if (msg.submission_result === "already_snapped") {
        return styles.duplicateMessage;
      }
      return styles.answerMessage;
    case "successful_answer":
      return styles.successfulAnswerMessage;
    case "failed_answer":
      return styles.failedAnswerMessage;
    default:
      return styles.chatMessage;
  }
};
```

**Signature change:** Function must receive the full `UnifiedMessage` object, not just `msg.message_type`. Update the call site:
```tsx
// Before:
className={`${styles.unifiedMessage} ${getMessageTypeClass(msg.message_type)} ...`}
// After:
className={`${styles.unifiedMessage} ${getMessageTypeClass(msg)} ...`}
```

### Pattern 2: Icon Badge Label in Message Row

**What:** Add a small icon + label prefix before the message content to give non-color visual differentiation.

**When to use:** All non-chat message types. Chat messages get no badge (they are baseline).

**Implementation:** Add a helper that returns `{ icon: React.ReactNode; label: string } | null`:
```tsx
// In UnifiedMessages.tsx — a helper to render a type badge
const getMessageBadge = (msg: UnifiedMessage): React.ReactNode | null => {
  if (msg.player_id === "botbob" || msg.display_name.toLowerCase() === "botbob") {
    return <span className={styles.messageBadge + " " + styles.messageBadgeBot}>BOT</span>;
  }
  if (msg.message_type === "successful_answer") {
    return <span className={styles.messageBadge + " " + styles.messageBadgeCorrect}>CORRECT</span>;
  }
  if (msg.message_type === "answer_attempt" && msg.submission_result === "already_snapped") {
    return <span className={styles.messageBadge + " " + styles.messageBadgeDuplicate}>TAKEN</span>;
  }
  if (msg.message_type === "failed_answer" || msg.message_type === "answer_attempt") {
    return <span className={styles.messageBadge + " " + styles.messageBadgeFailed}>MISS</span>;
  }
  return null;
};
```

Render the badge inside `.messageContentWrapper` above the message content.

### Pattern 3: CSS Neon Palette Alignment

**What:** New CSS classes must use the existing neon color variables, not hardcoded hex values.

**Available CSS variables (from gameroom.module.css inspection and project convention):**
- `var(--neon-blue)` — `#00DDFF`
- `var(--neon-pink)` — `#FF00AA`
- `var(--neon-green)` — `#00FF66`
- `var(--neon-purple)` — `#B700FF`
- `#FFD700` — gold (already used for `.successfulAnswerMessage`)

**New classes to add in `gameroom.module.css`:**
```css
/* Bot Bob message in feed — distinct purple-teal treatment */
.botBobMessage {
  border-left-color: var(--neon-purple);
  background-color: rgba(183, 0, 255, 0.12);
  box-shadow: inset 3px 0 8px rgba(183, 0, 255, 0.15);
}

/* Duplicate / already-snapped attempt — muted amber, not red */
.duplicateMessage {
  border-left-color: #FF8C00;
  background-color: rgba(255, 140, 0, 0.08);
  opacity: 0.75;
}

/* Badge base */
.messageBadge {
  display: inline-block;
  font-size: 0.6rem;
  font-family: var(--retro-font);
  font-weight: bold;
  letter-spacing: 0.5px;
  padding: 0.1rem 0.3rem;
  border-radius: 2px;
  text-transform: uppercase;
  vertical-align: middle;
  margin-right: 0.3rem;
  flex-shrink: 0;
}

.messageBadgeBot {
  background-color: rgba(183, 0, 255, 0.3);
  color: var(--neon-purple);
  border: 1px solid rgba(183, 0, 255, 0.5);
  text-shadow: 0 0 6px rgba(183, 0, 255, 0.7);
}

.messageBadgeCorrect {
  background-color: rgba(255, 215, 0, 0.25);
  color: #FFD700;
  border: 1px solid rgba(255, 215, 0, 0.5);
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.7);
}

.messageBadgeDuplicate {
  background-color: rgba(255, 140, 0, 0.2);
  color: #FF8C00;
  border: 1px solid rgba(255, 140, 0, 0.4);
}

.messageBadgeFailed {
  background-color: rgba(255, 68, 68, 0.2);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}
```

### Pattern 4: Performance Mode Guard

**What:** Animations added to message types must not run when `performanceModeAtom` is true.

**How it works:** The project applies a `.performance-mode` class to `document.body`. CSS animations can be conditionally disabled with:
```css
/* In gameroom.module.css — guard for any new glow animations */
:global(.performance-mode) .successfulAnswerMessage {
  animation: none;
  box-shadow: none;
}
```

**Alternative (if adding React-controlled animation):** Read `useAtomValue(performanceModeAtom)` and skip animation class when true.

For this phase, the CSS-only guard approach is sufficient — no React-level performance reads needed unless adding canvas-confetti or JS-driven effects.

### Anti-Patterns to Avoid

- **Changing `message_type` value from the backend:** The `unified_message` event is emitted by the backend game server (external). Do not attempt to re-map or re-classify message types on the frontend — use what the backend sends.
- **Re-detecting botbob in CSS only:** Bot Bob detection must happen in `getMessageTypeClass()` (TypeScript), not purely via CSS attribute selectors, because we don't have a `data-sender` attribute on message rows currently.
- **Adding a new atom for badge state:** Badges are display-only derivations of existing message data. Derive from the message object inline — no new atoms needed.
- **Styling the pinned `BotBobPinnedMessage` as the CHAT-02 solution:** The pinned banner is already present. CHAT-02 requires Bot Bob messages to be distinguishable IN THE SCROLLING FEED, not just in the pinned section.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon for BOT badge | SVG from scratch | `Bot` from `lucide-react` | Already installed; consistent with project icons |
| Icon for correct answer badge | Custom SVG | `CheckCircle` from `lucide-react` | Same reason |
| Animation keyframes for successful answer | New @keyframes | Extend existing `correctAnswerGlow` keyframe already in CSS | Reuse prevents drift |
| Color generation for botbob | New utility | Detect via existing `player_id === "botbob"` check (already in `addUnifiedMessageAtom`) | Same logic already exists in three places |

**Key insight:** This phase is almost entirely additive CSS. The data model is already correct. Building a new message processing pipeline would be over-engineering.

---

## Common Pitfalls

### Pitfall 1: `failed_answer` Covers Both "wrong" and "already snapped"
**What goes wrong:** A developer adds CSS for `failedAnswerMessage` and thinks that covers CHAT-03 (duplicate attempts). It does not. `already_snapped` and `incorrect` both arrive as `failed_answer` type with `submission_result` distinguishing them. Without branching on `submission_result`, duplicate attempts look identical to wrong answers.
**Why it happens:** The `message_type` field has only 4 values; `submission_result` carries the sub-classification.
**How to avoid:** `getMessageTypeClass()` must check `msg.submission_result === "already_snapped"` before returning `failedAnswerMessage`.
**Warning signs:** If CHAT-03 acceptance test shows "duplicate looks the same as miss" — this is the cause.

### Pitfall 2: Bot Bob In-Feed Not Styled (Pinned Banner vs Feed Row)
**What goes wrong:** Developer points to `BotBobPinnedMessage` as the CHAT-02 implementation. The pinned banner is a separate component above the scroll area. Bot Bob messages also appear as rows in the scrolling feed where they use the default `chatMessage` style with a purple border — indistinguishable from player chat messages unless you read the sender name.
**Why it happens:** Two separate rendering paths: the pinned banner (`BotBobPinnedMessage`) and the scrolling message rows in `UnifiedMessages.tsx`. The atom correctly identifies Bot Bob and sets `botBobLastMessageAtom`, but that only drives the pinned banner.
**How to avoid:** `getMessageTypeClass()` must check `msg.player_id === "botbob"` and return a distinct `botBobMessage` class. The same `botbob` detection logic already exists in three places — replicate consistently.
**Warning signs:** Bot Bob hint row in the feed has no visual distinction beyond the sender name text.

### Pitfall 3: `message_type` is Set by the Backend — Cannot be Changed Unilaterally
**What goes wrong:** A developer decides to add a new `message_type` value (e.g., `"bot_hint"`) and starts building frontend handling. The backend never sends that value — messages arrive as `chat` type for Bot Bob messages.
**Why it happens:** The `unified_message` event is backend-owned. `message_type` values are `chat | answer_attempt | successful_answer | failed_answer`.
**How to avoid:** Detect Bot Bob using `player_id`/`display_name` checks, not a new `message_type` value. The `addUnifiedMessageAtom` already does this — follow that pattern.
**Warning signs:** Bot Bob messages unexpectedly render as `chatMessage` style after style changes.

### Pitfall 4: CSS Specificity Conflict Between `.ownMessage` and New Type Classes
**What goes wrong:** `.ownMessage` overrides using `!important` will suppress new type-class backgrounds on the current player's own messages. A player who gets a correct answer sees their own message unstyled because `.ownMessage` wins.
**Why it happens:** `.ownMessage` in the CSS uses `!important`:
```css
.ownMessage {
  background-color: rgba(0, 221, 255, 0.1) !important;
  border-left-color: var(--neon-blue) !important;
}
```
**How to avoid:** For `successful_answer` by the current user, the gold glow is more important than the blue "own message" tint. Either: (a) remove `!important` from `.ownMessage` and let type classes win via order, or (b) add a combined class `.ownMessage.successfulAnswerMessage` that blends both treatments. Option (b) is safer.
**Warning signs:** Your own correct answers don't show the gold glow — only the blue border.

### Pitfall 5: Badge Text Too Verbose for Small Message Font
**What goes wrong:** Badge labels like "CORRECT ANSWER" or "BOT BOB HINT" overflow the small font-size message rows (0.7rem body).
**Why it happens:** Message rows are compact (`.unifiedMessage` is `font-size: 0.7rem`).
**How to avoid:** Keep badge labels to 3-6 characters: "BOT", "CORRECT" (7 chars — borderline), "TAKEN", "MISS". Test at 1280px width.
**Warning signs:** Badge overflows avatar or timestamp in message row.

---

## Code Examples

### Current `getMessageTypeClass` (from `UnifiedMessages.tsx`)
```typescript
// Source: src/app/gameroom/components/UnifiedMessages.tsx:41-52
const getMessageTypeClass = (messageType: string) => {
  switch (messageType) {
    case "answer_attempt":
      return styles.answerMessage;
    case "successful_answer":
      return styles.successfulAnswerMessage;
    case "failed_answer":
      return styles.failedAnswerMessage;
    default:
      return styles.chatMessage;
  }
};
```

### Current `UnifiedMessage` Type (from `gameAtoms.ts`)
```typescript
// Source: src/app/gameroom/store/gameAtoms.ts:6-17
export type UnifiedMessage = ChatMessageData & {
  message_type:
    | "chat"
    | "answer_attempt"
    | "successful_answer"
    | "failed_answer";
  submission_result?: "success" | "too_slow" | "incorrect" | "already_snapped";
  points_awarded?: number;
  is_rare?: boolean;
  canonical_text?: string;
  is_own_message?: boolean;
};
```

### Bot Bob Detection in `addUnifiedMessageAtom` (from `gameAtoms.ts`)
```typescript
// Source: src/app/gameroom/store/gameAtoms.ts:133-139
if (
  message.player_id === "botbob" ||
  message.display_name.toLowerCase() === "botbob"
) {
  set(botBobLastMessageAtom, message);
}
```

### Existing CSS for Message Types (from `gameroom.module.css`)
```css
/* Source: src/app/gameroom/gameroom.module.css */
.chatMessage {
  border-left-color: var(--neon-purple);
  background-color: rgba(183, 0, 255, 0.05);
}

.answerMessage {
  border-left-color: var(--neon-green);
  background-color: rgba(0, 255, 102, 0.05);
  font-family: var(--retro-font);
}

.successfulAnswerMessage {
  border-left-color: #ffd700;
  background-color: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
  animation: correctAnswerGlow 1s ease-out;
}

.failedAnswerMessage {
  border-left-color: #ff4444;
  background-color: rgba(255, 0, 0, 0.05);
  opacity: 0.8;
}

.ownMessage {
  background-color: rgba(0, 221, 255, 0.1) !important;
  border-left-color: var(--neon-blue) !important;
}
```

### Performance Mode CSS Guard Pattern (from `atoms/performance-atom.ts`)
```typescript
// Performance mode sets class on document.body:
document.body.classList.add("performance-mode");

// CSS guard pattern (in CSS Modules with :global):
// :global(.performance-mode) .successfulAnswerMessage {
//   animation: none;
//   box-shadow: 0 0 4px rgba(255, 215, 0, 0.2); /* Static fallback */
// }
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Color-only differentiation (CSS only) | Color + icon badge label | Accessibility — color-blind players can distinguish message types |
| Bot Bob only in pinned banner | Bot Bob in pinned banner + distinct style in feed | CHAT-02 — players don't have to read sender name to spot hint |
| All failed answers styled identically | Separate duplicate class vs miss class | CHAT-03 — players understand why their input was rejected |

**Not deprecated:**
- Existing CSS classes (`chatMessage`, `answerMessage`, etc.) — extend, not replace
- `getMessageTypeClass()` function — refactor signature, not replace

---

## Open Questions

1. **Does the backend send `submission_result` on all `answer_attempt` messages, or only some?**
   - What we know: `submission_result` is typed as optional (`?`) in `UnifiedMessage`. The type includes `"already_snapped"` as a possible value.
   - What's unclear: Whether the backend always populates it, or only for the submitting player's own message. The chat feed is shared — other players may not receive the `submission_result` context for a third party's duplicate attempt.
   - Recommendation: Handle the case where `submission_result` is `undefined` — fall back to `answerMessage` class. Only the submitting player's own duplicate attempt is guaranteed to have `submission_result === "already_snapped"`. For other players' failed attempts, the distinction may not be knowable from the frontend alone.

2. **Should Bot Bob messages in the scrolling feed also show differently from the pinned banner, or only one of the two needs work?**
   - What we know: CHAT-02 says "immediately recognizable in the feed without reading the sender name." The pinned banner already exists. The scrolling feed does NOT distinguish Bot Bob.
   - Recommendation: Style Bot Bob rows in the scrolling feed as a distinct class. This is the gap that CHAT-02 is addressing.

3. **Is `is_own_message` field on `UnifiedMessage` reliably set?**
   - What we know: The field is typed as optional (`is_own_message?: boolean`). The `UnifiedMessages` component currently uses `msg.player_id === user?.id` for own-message detection instead.
   - Recommendation: Continue using the `player_id === user?.id` check, not `is_own_message`, for consistency with the existing pattern.

---

## Sources

### Primary (HIGH confidence)
- `src/app/gameroom/components/UnifiedMessages.tsx` — direct codebase read, current implementation of `getMessageTypeClass()` and message rendering
- `src/app/gameroom/store/gameAtoms.ts` — direct codebase read, `UnifiedMessage` type and `addUnifiedMessageAtom` Bot Bob detection
- `src/app/gameroom/gameroom.module.css` — direct codebase read, all existing CSS classes and CSS variable names
- `src/app/gameroom/types/payloads.ts` — direct codebase read, `SubmissionFeedbackPayload` status values including `already_snapped`
- `src/atoms/performance-atom.ts` — direct codebase read, performance mode pattern
- `.planning/STATE.md` — project decision: "Visual differentiation via existing `message_type` field — add styling layer only"

### Secondary (MEDIUM confidence)
- `package.json` — confirmed `lucide-react@0.555.0` and `animate.css` already installed
- `src/app/gameroom/utils.ts` — confirmed `getPlayerAvatar()` Bot Bob detection pattern at `player_id === "botbob"`

### Tertiary (LOW confidence — inference only)
- Backend behavior of `submission_result` field population for third-party messages: cannot be verified from frontend code alone. Treat as unreliable for non-own-messages.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed in package.json, no new installs needed
- Architecture: HIGH — existing CSS class pattern confirmed from source; refactor scope clearly bounded
- Pitfalls: HIGH for items 1-3 (confirmed from code); MEDIUM for item 4 (CSS specificity analysis from read source); MEDIUM for item 5 (layout inference)

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable — no fast-moving dependencies involved)
