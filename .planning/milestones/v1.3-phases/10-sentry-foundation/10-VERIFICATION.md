---
phase: 10-sentry-foundation
verified: 2026-03-18T11:00:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "All application code routes Sentry calls through src/lib/sentry.ts — wizard-generated example files deleted; only src/instrumentation.ts, src/instrumentation-client.ts, src/lib/sentry.ts, and src/app/global-error.tsx import @sentry/nextjs directly, all of which are permitted"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Sign in and trigger a test error in the browser console"
    expected: "Sentry event arrives in dashboard with user id in the User section (not anonymous)"
    why_human: "Cannot inspect live Sentry dashboard state programmatically"
  - test: "Join a game room, trigger a test error via DevTools"
    expected: "Sentry event shows a 'gameroom' context with a non-null roomId (game_ws_url value)"
    why_human: "Cannot inspect Sentry context payload without a live event"
  - test: "Run npm run build:check and inspect output"
    expected: "Script exits 0 and outputs '0' for the source map count"
    why_human: "Build requires Sentry auth token present in environment — cannot run in static verification"
---

# Phase 10: Sentry Foundation Verification Report

**Phase Goal:** Establish Sentry error monitoring foundation — SDK installed, configured for production safety, user identity wired, and game room context attached.
**Verified:** 2026-03-18T11:00:00Z
**Status:** human_needed — all automated checks pass, 3 items require live environment confirmation
**Re-verification:** Yes — after gap closure (wizard-generated example files deleted)

---

## Re-Verification Summary

**Previous status:** gaps_found (9/10)
**Current status:** human_needed (10/10 automated)

**Gap closed:** The single blocker from the initial verification — direct `@sentry/nextjs` imports in wizard-generated scaffold files — is resolved. Both `src/app/sentry-example-page/page.tsx` and `src/app/api/sentry-example-api/route.ts` have been deleted. A full scan of `src/**/*.{ts,tsx}` confirms the only files importing `@sentry/nextjs` directly are the four permitted files:

- `src/instrumentation.ts` (SDK loader)
- `src/instrumentation-client.ts` (browser SDK init)
- `src/lib/sentry.ts` (abstraction library — permitted origin)
- `src/app/global-error.tsx` (boundary file — documented exception)

**Regressions:** None. All six key indicators from the plan's verification section remain intact.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SDK initialised for browser, Node.js, and Edge runtimes | VERIFIED | src/instrumentation-client.ts (browser), sentry.server.config.ts (Node), sentry.edge.config.ts (Edge) — all have Sentry.init() with dsn + tracesSampleRate: 0.1 |
| 2 | Production build leaves zero .map files — source maps uploaded to Sentry and deleted | HUMAN NEEDED | check:sourcemaps script exists in package.json; cannot run build without live Sentry auth token in env |
| 3 | Tunnel route /monitoring is active — Sentry events bypass ad-blocker blocks | VERIFIED | next.config.mjs line 19: `tunnelRoute: "/monitoring"` inside withSentryConfig |
| 4 | Unhandled top-level render crash captured by global-error.tsx and reported to Sentry | VERIFIED | src/app/global-error.tsx: useEffect calls Sentry.captureException(error) on mount, wraps html+body |
| 5 | All application code routes Sentry calls through src/lib/sentry.ts — no direct @sentry/nextjs imports in components | VERIFIED | Gap closed — both example files deleted; full src scan confirms only four permitted files import @sentry/nextjs directly |
| 6 | Signed-in user identity attached to every Sentry event automatically | VERIFIED | SentryUserSync.tsx subscribes to onAuthStateChange, calls setSentryUser/clearSentryUser; mounted globally in provider.tsx |
| 7 | Game room ID and phase attached to Sentry events when inside the gameroom | VERIFIED | gameroom/page.tsx line 100: useEffect calls setSentryGameContext(gameroom.game_ws_url) when ws_url changes |
| 8 | Socket connect_error produces at most one Sentry event per 30-second window | VERIFIED | useGameSocket.ts lines 25 and 170–172: module-level `lastConnectErrorCapture` guard with 30_000ms window |
| 9 | Chat socket error is captured to Sentry with a source tag | VERIFIED | useChatWs.ts line 66: captureException(err, { tags: { source: "chat_socket_error" } }) |
| 10 | User identity is cleared from Sentry scope when the user signs out | VERIFIED | SentryUserSync.tsx: onAuthStateChange calls clearSentryUser() when session is null |

**Score: 10/10 truths verified** (3 require live environment confirmation for full OBS-01/OBS-05 coverage)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/instrumentation-client.ts` | Browser SDK init with tracesSampleRate: 0.1 and xhr-poll-error filter | VERIFIED | tracesSampleRate: 0.1, sampleRate: 1.0, beforeSend filters "xhr poll error" |
| `sentry.server.config.ts` | Node.js runtime SDK init | VERIFIED | Sentry.init with dsn, tracesSampleRate: 0.1, environment |
| `sentry.edge.config.ts` | Edge runtime SDK init | VERIFIED | Sentry.init with dsn, tracesSampleRate: 0.1, environment |
| `src/instrumentation.ts` | register() hook loading server/edge configs | VERIFIED | Branches on NEXT_RUNTIME env var, dynamic imports sentry.server.config and sentry.edge.config |
| `next.config.mjs` | withSentryConfig wrapper with tunnelRoute and source map defaults | VERIFIED | withSentryConfig is outermost export wrapper; tunnelRoute: "/monitoring"; no hideSourceMaps; standalone output preserved |
| `src/app/global-error.tsx` | App Router top-level error boundary capturing to Sentry | VERIFIED | "use client", html+body wrapper, useEffect calls Sentry.captureException(error), reset button present |
| `src/lib/sentry.ts` | setSentryUser, setSentryGameContext, clearSentryUser, captureException exports | VERIFIED | All four functions exported; captureException uses withScope for tag attachment |
| `package.json` | check:sourcemaps and build:check scripts | VERIFIED | "check:sourcemaps" and "build:check" scripts present |
| `src/components/SentryUserSync.tsx` | Client Component subscribing to Supabase auth, calls setSentryUser / clearSentryUser | VERIFIED | "use client", useEffect with getUser() + onAuthStateChange, returns null |
| `src/app/provider.tsx` | Mounts SentryUserSync inside JotaiProvider | VERIFIED | `<SentryUserSync />` mounted between PerformanceInitializer and PerformanceModal |
| `src/app/gameroom/page.tsx` | Calls setSentryGameContext when gameroom resolves | VERIFIED | useEffect on gameroom?.game_ws_url calls setSentryGameContext(gameroom.game_ws_url) |
| `src/app/gameroom/hooks/useGameSocket.ts` | connect_error handler with 30s deduplication guard | VERIFIED | Module-level lastConnectErrorCapture = 0; guard checks Date.now() - lastConnectErrorCapture > 30_000 |
| `src/app/gameroom/hooks/useChatWs.ts` | socket error handler calls captureException with source tag | VERIFIED | socket.on("error") calls captureException(err, { tags: { source: "chat_socket_error" } }) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/instrumentation.ts` | `sentry.server.config.ts` / `sentry.edge.config.ts` | dynamic import in register() on NEXT_RUNTIME | WIRED | `if (process.env.NEXT_RUNTIME === "nodejs")` → dynamic import |
| `next.config.mjs` | `@sentry/nextjs withSentryConfig` | outermost export wrapper | WIRED | `export default withSentryConfig(nextConfig, {...})` confirmed outermost |
| `src/app/global-error.tsx` | `@sentry/nextjs` | direct import (permitted exception) | WIRED | `import * as Sentry from "@sentry/nextjs"` + captureException in useEffect |
| `src/components/SentryUserSync.tsx` | `src/lib/sentry.ts` | setSentryUser, clearSentryUser imports | WIRED | `import { setSentryUser, clearSentryUser } from "@/lib/sentry"` |
| `src/app/provider.tsx` | `src/components/SentryUserSync.tsx` | JSX mount inside JotaiProvider | WIRED | `<SentryUserSync />` present between PerformanceInitializer and PerformanceModal |
| `src/app/gameroom/page.tsx` | `src/lib/sentry.ts` | setSentryGameContext in useEffect on gameroom?.game_ws_url | WIRED | `import { setSentryGameContext } from "@/lib/sentry"` + useEffect at line 100 |
| `src/app/gameroom/hooks/useGameSocket.ts` | `src/lib/sentry.ts` | captureException in connect_error with lastConnectErrorCapture guard | WIRED | `import { captureException } from "@/lib/sentry"` + module-level guard + call |
| `src/app/gameroom/hooks/useChatWs.ts` | `src/lib/sentry.ts` | captureException in socket error handler with source tag | WIRED | `import { captureException } from "@/lib/sentry"` + call at line 66 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| OBS-01 | 10-01 | SDK installed, DSN configured, source maps uploaded securely, quota-safe sampling, tunnel route | SATISFIED (partial human) | @sentry/nextjs installed; tracesSampleRate: 0.1 across all 3 runtimes; tunnelRoute: "/monitoring"; build:check script present — source map upload confirmation requires live build |
| OBS-02 | 10-01, 10-02 | Unhandled errors, promise rejections, and Socket.IO connection errors automatically captured | SATISFIED | global-error.tsx captures render crashes; connect_error handler in useGameSocket with dedup guard; chat socket error handler in useChatWs; onRequestError in instrumentation.ts captures server errors |
| OBS-05 | 10-02 | Sentry events include user identity (Supabase auth) and game room context (roomId, phase) | SATISFIED (partial human) | SentryUserSync wires auth state; setSentryGameContext wired to gameroom page; dashboard confirmation requires live event |

No orphaned requirements — all three IDs declared across plans for this phase are accounted for. OBS-03 and OBS-04 are correctly deferred to Phase 11.

---

## Anti-Patterns Found

None. The previously flagged wizard-generated example files have been deleted. No remaining anti-patterns detected in phase-modified files.

---

## Human Verification Required

### 1. User Identity in Sentry Events (OBS-05)

**Test:** Sign in to the app. Open browser DevTools console and run: `throw new Error("Phase 10 identity test")`
**Expected:** Sentry event arrives in dashboard within 10 seconds with user id matching your Supabase account in the "User" section (not anonymous)
**Why human:** Cannot inspect live Sentry dashboard state programmatically

### 2. Game Room Context in Sentry Events (OBS-05)

**Test:** Join a game room. Run: `throw new Error("Phase 10 roomId test")` in DevTools
**Expected:** Sentry event shows a "gameroom" context key with a non-null roomId value (will be the game_ws_url string, not a UUID)
**Why human:** Cannot inspect Sentry context payload without a live event

### 3. Source Map Security (OBS-01)

**Test:** Run: `npm run build:check`
**Expected:** Script exits 0 and the check:sourcemaps step outputs "0" (no .map files left in .next/)
**Why human:** Build requires live SENTRY_AUTH_TOKEN in environment; cannot run in static verification

---

## Gaps Summary

No gaps remain. The one blocker from the initial verification (abstraction boundary violation by wizard-generated scaffold files) has been resolved by deleting both files. All 10 observable truths pass automated verification. Three items remain in the human-needed category — these are live-environment confirmations (Sentry dashboard, production build) that cannot be verified statically and were present in the initial verification as well.

**Note on gameroom context field:** `setSentryGameContext` is called with `gameroom.game_ws_url` instead of `gameroom.id` (the plan specified `gameroom?.id`, which does not exist on the `LobbyJoinSuccess` type). This is a documented auto-fixed deviation from SUMMARY-02 and is semantically correct — game_ws_url uniquely identifies the room connection.

---

_Verified: 2026-03-18T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
