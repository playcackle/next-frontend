# Phase 11: Error Boundaries - Research

**Researched:** 2026-03-18
**Domain:** React error boundaries, Next.js App Router error files, Sentry integration, silent recovery pattern
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OBS-03 | Global error boundary catches unexpected React render crashes at app level | `global-error.tsx` already exists from Phase 10; needs Sentry wiring verified; non-gameroom pages need `error.tsx` at root app segment |
| OBS-04 | Gameroom error boundary silently attempts recovery; shows minimal fallback only if crash is unrecoverable | Custom class-based boundary or `react-error-boundary` wrapping `GameroomPage`; auto-reset on first crash; Sentry capture via `captureException` from `src/lib/sentry.ts` with game room context |
</phase_requirements>

---

## Summary

Phase 10 already delivered `src/app/global-error.tsx` — a Next.js App Router global error boundary that calls `Sentry.captureException` directly. This satisfies OBS-03 partially: the global boundary exists and fires for root-layout crashes. However, the global boundary is the **last resort** (it fires only when `app/layout.tsx` itself crashes). For non-gameroom pages (login, profile, collections, etc.), crashes in page content will show a white screen unless a segment-level `error.tsx` is also present at the root `app/` level. This is the gap OBS-03 requires closing.

OBS-04 requires a gameroom-specific error boundary with a distinct behaviour: on first crash it silently attempts recovery (calls `reset()` automatically after a short delay), and only renders a fallback UI if the recovery fails. This cannot be a plain `error.tsx` file because Next.js `error.tsx` renders the fallback immediately without a silent-first-attempt. A custom React class component (or `react-error-boundary` with `onError` + `resetKeys`) placed around `GameroomPage` in `src/app/gameroom/layout.tsx` is the correct implementation point.

Both boundaries must report to Sentry via `captureException` from `src/lib/sentry.ts` (the project abstraction), not via direct `@sentry/nextjs` imports — with the sole existing exception of `global-error.tsx` which was intentionally allowed to import Sentry directly (documented in Phase 10).

**Primary recommendation:** Add a segment-level `app/error.tsx` for OBS-03, and a custom `GameroomErrorBoundary` class component wrapping children in `app/gameroom/layout.tsx` for OBS-04.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (built-in) | 19.2.1 (project) | `getDerivedStateFromError` + `componentDidCatch` for class-based boundary | Still the only way to implement error boundaries; no functional component equivalent exists in React 19 |
| Next.js `error.tsx` convention | 16.x (project) | Segment-level error boundary wired by Next.js automatically | Zero-config; App Router wraps each segment's page with the nearest `error.tsx` boundary |
| Next.js `global-error.tsx` | already exists at `src/app/global-error.tsx` | Catches crashes that reach root layout | Already implemented in Phase 10 |
| `src/lib/sentry.ts` | project abstraction | `captureException` helper | Project convention — all app code imports from here, not `@sentry/nextjs` directly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-error-boundary` | 6.1.1 (latest) | Thin wrapper eliminating need to hand-write class boundary | If team prefers not to write a class component; adds `onError`, `onReset`, `resetKeys` API; React 19 compatible |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom class boundary | `react-error-boundary` | react-error-boundary is well-tested but adds a dependency for ~30 lines of code; custom class gives full control of the silent-retry state machine without an extra package |
| `error.tsx` for gameroom | Custom boundary in layout | `error.tsx` shows fallback immediately — can't do silent-first-attempt; custom boundary is required for OBS-04 |

**Installation (only if using react-error-boundary):**
```bash
npm install react-error-boundary
```

---

## Architecture Patterns

### Recommended Project Structure

Two files to create, one file to modify:

```
src/app/
├── error.tsx                        # NEW — segment boundary for all non-gameroom pages (OBS-03)
├── global-error.tsx                 # EXISTS — root layout boundary (Phase 10, do not modify)
├── gameroom/
│   ├── layout.tsx                   # MODIFY — mount GameroomErrorBoundary around children
│   └── components/
│       └── GameroomErrorBoundary.tsx  # NEW — silent-retry class boundary (OBS-04)
```

### Pattern 1: Segment-level `error.tsx` (OBS-03)

**What:** A `"use client"` component placed at `src/app/error.tsx`. Next.js App Router automatically wraps every page component below the root layout with this boundary. It is activated for crashes in pages like `/login`, `/profile`, `/gamerooms`, etc. — but NOT for `GameroomPage` (which gets its own boundary).

**When to use:** Any route that does not have a closer `error.tsx` file further down the segment tree.

**Example:**
```typescript
// src/app/error.tsx
// Source: Next.js App Router error.js convention (nextjs.org/docs/app/getting-started/error-handling)
"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/sentry";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <h2>Something went wrong</h2>
      <button onClick={reset} style={{ marginTop: "1rem", cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
```

Note: Uses `captureException` from `src/lib/sentry.ts` — consistent with project convention. The existing `global-error.tsx` is the only file that imports `@sentry/nextjs` directly.

### Pattern 2: Gameroom Silent-Recovery Boundary (OBS-04)

**What:** A React class component that on first error: (a) calls `captureException` to Sentry, (b) schedules an automatic `reset()` via `setTimeout`, and (c) renders nothing (or a spinner) during the recovery window. If recovery succeeds, the user never sees a fallback. If recovery fails (second crash), it renders a minimal fallback UI.

**When to use:** Wraps `GameroomPage` in `src/app/gameroom/layout.tsx`.

**How to implement "silent first attempt":**

The boundary tracks two state fields: `hasError: boolean` and `recoveryAttempted: boolean`. On first catch, `hasError = true, recoveryAttempted = false` — render nothing (silent). In `componentDidCatch`, schedule `this.setState({ hasError: false })` after 0ms (microtask flush) or a very short timeout. This causes React to attempt re-render of the children. If it crashes again, the boundary catches it with `recoveryAttempted = true` and renders the fallback.

**Example:**
```typescript
// src/app/gameroom/components/GameroomErrorBoundary.tsx
"use client";

import React from "react";
import { captureException } from "@/lib/sentry";

interface State {
  hasError: boolean;
  recoveryAttempted: boolean;
}

export class GameroomErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, recoveryAttempted: false };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      tags: { boundary: "gameroom", componentStack: info.componentStack ?? "" },
    });

    if (!this.state.recoveryAttempted) {
      // Silent recovery: attempt to remount the tree immediately
      setTimeout(() => {
        this.setState({ hasError: false, recoveryAttempted: true });
      }, 0);
    }
  }

  render() {
    if (this.state.hasError && this.state.recoveryAttempted) {
      // Unrecoverable — show minimal fallback, no stack trace
      return (
        <div style={{ padding: "2rem", color: "white", background: "#0a0a1f" }}>
          <h2>Game connection lost</h2>
          <p>Return to lobby and rejoin.</p>
        </div>
      );
    }

    if (this.state.hasError && !this.state.recoveryAttempted) {
      // Silent recovery in progress — render nothing
      return null;
    }

    return this.props.children;
  }
}
```

**Mounting in layout:**
```typescript
// src/app/gameroom/layout.tsx — modified
import { ReactNode } from "react";
import { GameroomErrorBoundary } from "./components/GameroomErrorBoundary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GameroomLayout({ children }: { children: ReactNode }) {
  return <GameroomErrorBoundary>{children}</GameroomErrorBoundary>;
}
```

### Anti-Patterns to Avoid

- **Exposing `error.stack` or `error.message` in fallback UI:** Stack traces can leak internal implementation details. Fallback UI must show only user-safe copy.
- **Importing `@sentry/nextjs` directly in new boundaries:** Project convention: use `captureException` from `src/lib/sentry.ts`. Only `global-error.tsx` is the permitted exception.
- **Using `error.tsx` for the gameroom boundary:** Next.js `error.tsx` renders the fallback immediately — silent retry is impossible with this convention.
- **Auto-resetting indefinitely:** The recovery attempt must be gated by `recoveryAttempted` state. Without this guard the boundary will loop forever if the error is persistent.
- **Passing `componentStack` as a Sentry tag directly:** `componentStack` is multi-line and tags must be scalar strings. Either truncate it or attach it as extra context, not a tag.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sentry capture from boundary | Custom fetch to Sentry API | `captureException` from `src/lib/sentry.ts` | Already built in Phase 10; context (user, gameroom) is already attached to Sentry scope |
| TypeScript class boundary boilerplate | Bespoke getDerivedStateFromError class | `react-error-boundary@6` (if dependency is acceptable) | Well-tested; handles edge cases around error propagation; React 19 compatible |

**Key insight:** The hard part of OBS-04 is the state machine for silent retry, not the class boundary boilerplate. The two-state machine (`hasError` + `recoveryAttempted`) is the novel piece; the rest is standard class component.

---

## Common Pitfalls

### Pitfall 1: `error.tsx` at `app/gameroom/error.tsx` instead of custom boundary

**What goes wrong:** If someone creates `app/gameroom/error.tsx`, Next.js shows the fallback immediately on any render crash. The silent recovery requirement of OBS-04 is not met — there is no mechanism in the `error.tsx` convention to attempt re-render before showing the fallback.

**Why it happens:** `error.tsx` is the first search hit for "Next.js error boundary" and looks like the obvious solution.

**How to avoid:** The custom `GameroomErrorBoundary` class component must wrap children in `layout.tsx`. Do not create `app/gameroom/error.tsx` — it would shadow the custom boundary or conflict with it.

### Pitfall 2: Silent retry loop

**What goes wrong:** If `componentDidCatch` resets the boundary unconditionally (no `recoveryAttempted` guard), a persistent render error causes infinite setState → crash → setState cycles. The browser tab becomes unresponsive.

**Why it happens:** The auto-reset pattern is shown in isolation in many blog posts without the "attempt once" guard.

**How to avoid:** Gate the auto-reset on `!this.state.recoveryAttempted` as shown in the example above.

**Warning signs:** Browser tab memory/CPU spike after a crash; fallback UI never renders even for persistent errors.

### Pitfall 3: Sentry captures `componentStack` as a tag

**What goes wrong:** `componentStack` is a multi-line string. Sentry tags are indexed key-value scalars; multi-line values are truncated or cause ingestion errors.

**Why it happens:** `componentDidCatch` provides `info.componentStack` and it's tempting to forward it directly.

**How to avoid:** Do not pass `componentStack` as a tag value. Either omit it (Sentry's React integration attaches it automatically via `LinkedErrors`) or attach it as extra context using `Sentry.withScope` if explicit attachment is desired.

### Pitfall 4: `global-error.tsx` vs `app/error.tsx` coverage gap

**What goes wrong:** `global-error.tsx` only fires when the root layout itself crashes. Crashes in page components (login, profile, etc.) are not covered by `global-error.tsx`. They need a segment-level `app/error.tsx`.

**Why it happens:** The naming "global-error" implies it catches everything, but it only catches root layout failures.

**How to avoid:** Add `src/app/error.tsx` for page-level crashes. This is OBS-03's actual gap.

### Pitfall 5: Sentry not receiving gameroom context on boundary catch

**What goes wrong:** The Sentry gameroom context (`setSentryGameContext`) is set in `GameroomPage` via `useEffect`, which fires after render. If the component crashes on first render before `useEffect` runs, the Sentry scope may not have the room context attached yet.

**Why it happens:** `useEffect` is deferred to after paint; a crash in initial render fires before it.

**How to avoid:** This is inherent to the timing of the Sentry context approach used in Phase 10. The boundary should still call `captureException` — Sentry will capture whatever context is available. For the gameroom boundary specifically, the `game_ws_url` is available in `gameRoomAtom` before the page renders (the redirect guard `if (!gameroom)` runs first), so in most real crashes the context should be set. Document this timing limitation rather than trying to pre-set scope inside the boundary.

---

## Code Examples

Verified patterns from official sources:

### Next.js `error.tsx` segment boundary
```typescript
// Source: https://nextjs.org/docs/app/getting-started/error-handling
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### React class boundary with `getDerivedStateFromError`
```typescript
// Source: https://react.dev/reference/react/Component#static-getderivedstatefromerror
static getDerivedStateFromError(error: Error) {
  // Update state to render fallback UI on next render
  return { hasError: true };
}

componentDidCatch(error: Error, info: React.ErrorInfo) {
  // Log to error reporting service
  logError(error, info.componentStack);
}
```

### Sentry `ErrorBoundary` component (if using `@sentry/react` directly)
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/
// NOTE: @sentry/nextjs re-exports this from @sentry/react
import * as Sentry from "@sentry/nextjs";

<Sentry.ErrorBoundary
  fallback={({ error, resetError }) => (
    <button onClick={resetError}>Reset</button>
  )}
  beforeCapture={(scope) => {
    scope.setTag("boundary", "gameroom");
  }}
>
  <GameroomPage />
</Sentry.ErrorBoundary>
```
Note: This pattern is an alternative to the custom class boundary. Project convention requires importing via `src/lib/sentry.ts`, but `Sentry.ErrorBoundary` is a component, not the `captureException` function, so direct import of the component may be acceptable. Confirm with project convention before using — the custom class approach avoids this ambiguity entirely.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/_error.js` for custom error pages | `app/error.tsx` + `app/global-error.tsx` per segment | Next.js 13 (App Router) | File-based, segment-scoped boundaries; no manual wiring needed |
| React 18 root-level error hooks missing | React 19 `onCaughtError`, `onUncaughtError`, `onRecoverableError` on `createRoot` | React 19 (Dec 2024) | Sentry v9+ integrates via `reactErrorHandler`; not directly used in this phase |
| `react-error-boundary` v3 API | v4+ API with `useErrorBoundary` hook | 2023 | Hook allows throwing errors from within functional components to be caught by nearest boundary |

**Deprecated/outdated:**
- `pages/_error.js`: Only relevant in Pages Router — project uses App Router, ignore.
- `react-error-boundary` v3 `withErrorBoundary` HOC pattern: Still works but v4+ `<ErrorBoundary>` component is preferred.

---

## Open Questions

1. **`captureException` tag value for `componentStack`**
   - What we know: `componentStack` is multi-line; Sentry tags must be scalar. The project `captureException` helper accepts `tags?: Record<string, string>`.
   - What's unclear: Whether the project helper should be extended to accept extra `context` (non-indexed) data separate from `tags`.
   - Recommendation: For this phase, omit `componentStack` from tags — Sentry's `LinkedErrors` integration attaches it automatically via `error.cause` in React 17+. If explicit component stack in Sentry is later required, extend `captureException` in `src/lib/sentry.ts` to accept an optional `contexts` parameter.

2. **Recovery delay duration**
   - What we know: `setTimeout(fn, 0)` schedules after the current event loop turn; the failed render will have fully unwound by then.
   - What's unclear: Whether a 0ms timeout is always enough, or if a small delay (e.g., 100ms) better allows transient state to settle.
   - Recommendation: Use `setTimeout(fn, 0)` for the first implementation. This matches common practice and satisfies the requirement as worded.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest, vitest, or playwright config found |
| Config file | None — see Wave 0 gaps |
| Quick run command | `npx tsc --noEmit` (type-check only — no unit test runner present) |
| Full suite command | `npm run build` (build verification) |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-03 | `app/error.tsx` renders and calls `captureException` on render crash | manual-only | N/A — no test runner | N/A |
| OBS-03 | Global boundary (`global-error.tsx`) captures to Sentry on root crash | manual-only | N/A — no test runner | N/A |
| OBS-04 | Gameroom boundary silently attempts recovery on first crash | manual-only | N/A — no test runner | N/A |
| OBS-04 | Gameroom boundary renders minimal fallback on unrecoverable crash | manual-only | N/A — no test runner | N/A |
| OBS-04 | Fallback UI exposes no stack traces or internal state | visual review | `npx tsc --noEmit` (type check) | N/A |

**Note on manual verification:** No automated test runner is present in this project. Verification must use a throw-in-render technique:
- For OBS-03: temporarily add `throw new Error("test")` in a non-gameroom page component, confirm `error.tsx` fallback appears and a Sentry event is captured in the dashboard.
- For OBS-04: temporarily add `throw new Error("test")` in `GameroomPage` (inside the render), confirm: (1) nothing visible for ~16ms, (2) re-render attempted, (3) if error persists, minimal fallback shown without stack trace.

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm run build`
- **Phase gate:** Build passes + manual verification of both boundaries before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No automated test infrastructure — all validation is manual-throw pattern described above
- [ ] Vitest or Jest installation would enable unit testing `GameroomErrorBoundary` state machine — out of scope for this phase but noted for future

*(Existing infrastructure covers type checking only. Manual verification protocol defined above covers all phase requirements.)*

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (https://nextjs.org/docs/app/getting-started/error-handling) — error.tsx and global-error.tsx conventions, reset() prop, segment hierarchy
- Next.js API reference (https://nextjs.org/docs/app/api-reference/file-conventions/error) — error.js file convention
- Sentry React docs (https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/) — ErrorBoundary props: fallback, onError, beforeCapture, resetKeys
- React official docs (https://react.dev/reference/react/Component) — getDerivedStateFromError, componentDidCatch lifecycle
- Phase 10 SUMMARYs — confirms `captureException` and project import conventions

### Secondary (MEDIUM confidence)
- react-error-boundary npm registry — version 6.1.1 confirmed via `npm info react-error-boundary version`
- Sentry Next.js docs (https://docs.sentry.io/platforms/javascript/guides/nextjs/) — Next.js-specific wiring

### Tertiary (LOW confidence)
- Dev community articles on silent retry patterns — cross-referenced with official React class component docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js and React docs are authoritative; Phase 10 code is in-repo
- Architecture: HIGH — error.tsx convention is documented; class boundary pattern is verified React API
- Pitfalls: HIGH for #1-4 (all rooted in official docs); MEDIUM for #5 (timing inference from Phase 10 code review)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (Next.js and React APIs in this area are stable)
