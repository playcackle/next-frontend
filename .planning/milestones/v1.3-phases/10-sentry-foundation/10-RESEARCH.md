# Phase 10: Sentry Foundation - Research

**Researched:** 2026-03-18
**Domain:** Sentry Next.js SDK installation, source map security, tunnel route, user context, game room context
**Confidence:** MEDIUM-HIGH — Core SDK patterns verified against live Sentry docs (2026-03-18); option names confirmed; v9 breaking changes reviewed.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OBS-01 | Sentry SDK installed and configured with DSN, source maps uploaded securely, quota-safe sampling, and tunnel route for ad-blocker users | Full stack verified: wizard install, `withSentryConfig` options (`sourcemaps.deleteSourcemapsAfterUpload` default true, `tunnelRoute`), `tracesSampleRate: 0.1` |
| OBS-02 | Unhandled errors, promise rejections, and Socket.IO connection errors automatically captured in Sentry | SDK auto-captures `window.onerror` + `unhandledrejection` on init; Socket.IO `connect_error` requires explicit `Sentry.captureException` with deduplication guard |
| OBS-05 | Sentry events include user identity (from Supabase auth) and current game room context (roomId, game phase) | `SentryUserSync` component pattern using existing `createClient()` singleton; `Sentry.setUser()` + `Sentry.setContext('gameroom', {...})` in helpers |
</phase_requirements>

---

## Summary

Phase 10 installs the Sentry Next.js SDK and wires up the complete error-reporting pipeline: SDK init across all three runtimes, source map security, tunnel route for ad-blocker users, Supabase user identity, and game room context. This phase is the prerequisite for Phase 11 (error boundaries) — `GameroomErrorBoundary.componentDidCatch` calls `Sentry.captureException`, which only works after the SDK is initialized.

**Critical update from live verification (2026-03-18):** The SDK has changed significantly from the August 2025 training data. The client-side init file is now `instrumentation-client.ts` (not `sentry.client.config.ts`). The `hideSourceMaps` option has been **removed** — the SDK now hides source maps by default, and `sourcemaps.deleteSourcemapsAfterUpload` defaults to `true`. The tunnel can be configured via `tunnelRoute` in `withSentryConfig` rather than a manual API route file (though a custom path is still possible). Accept what `npx @sentry/wizard@latest -i nextjs` installs — do not pin v8 or v9 manually.

**Primary recommendation:** Run the wizard first, then layer in project-specific additions (quota config, Supabase user sync, game room context). The wizard sets all required files; post-wizard work is additive only.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sentry/nextjs` | Latest stable (wizard selects) | Error capture, performance tracing, App Router integration | Single unified SDK for browser + Node + Edge; App Router instrumentation hook support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sentry/wizard` | `@latest` | Automated project setup | Run once: `npx @sentry/wizard@latest -i nextjs`; creates all required files and patches `next.config.mjs` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wizard install | Manual install | Wizard always produces correct file names and `withSentryConfig` shape; manual install risks wrong file names or missing wrappers |
| `tunnelRoute` in `withSentryConfig` | Manual `src/app/api/sentry-tunnel/route.ts` | `tunnelRoute: "/monitoring"` is single-line; manual route gives more control over SSRF validation but is the fallback only if the built-in option is insufficient |

**Installation:**
```bash
npx @sentry/wizard@latest -i nextjs
```
The wizard installs `@sentry/nextjs`, creates all config files, and patches `next.config.mjs`. Do not run `npm install @sentry/nextjs` separately.

---

## SDK File Layout (VERIFIED 2026-03-18)

The current SDK uses a different file layout than the August 2025 training data. This is the **correct** current layout:

| File | Runtime | Notes |
|------|---------|-------|
| `instrumentation-client.ts` (root or `src/`) | Browser | Client-side SDK init — **replaces** `sentry.client.config.ts` |
| `sentry.server.config.ts` (root or `src/`) | Node.js | Server-side SDK init — name unchanged |
| `sentry.edge.config.ts` (root or `src/`) | Edge | Edge runtime init — name unchanged |
| `instrumentation.ts` (root or `src/`) | Next.js hook | `register()` function loads server/edge configs; Next.js 15/16 supports both root and `src/` placement |
| `next.config.mjs` | Build | Wrapped with `withSentryConfig` |
| `src/app/global-error.tsx` | App Router | Top-level React error boundary; required by Sentry docs |

**This project uses `src/` layout.** Wizard may place files at root or `src/` — verify after running wizard.

---

## Architecture Patterns

### Recommended Project Structure

```
next-frontend/
├── instrumentation-client.ts     # Browser SDK init (wizard creates)
├── sentry.server.config.ts       # Server SDK init (wizard creates)
├── sentry.edge.config.ts         # Edge SDK init (wizard creates)
├── instrumentation.ts            # register() hook (wizard creates)
├── next.config.mjs               # MODIFIED: withSentryConfig wrapper
src/
├── app/
│   ├── global-error.tsx          # NEW: App Router top-level boundary
│   ├── provider.tsx              # MODIFIED: add <SentryUserSync />
│   └── gameroom/
│       ├── page.tsx              # MODIFIED: game room context call
│       └── hooks/
│           ├── useGameSocket.ts  # MODIFIED: captureException in connect_error
│           └── useChatWs.ts      # MODIFIED: captureException in socket.on("error")
├── components/
│   └── SentryUserSync.tsx        # NEW: syncs Supabase auth → Sentry.setUser
└── lib/
    └── sentry.ts                 # NEW: setSentryUser, setSentryGameContext, clearSentryUser helpers
```

### Pattern 1: SDK Init via Wizard + Post-Wizard Additions

**What:** Run wizard to get correct file structure, then make project-specific additions.

**When to use:** Always — do not manually create the config files.

**Post-wizard additions to `instrumentation-client.ts`:**
```typescript
// instrumentation-client.ts (wizard generates base; add these)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,          // REQUIRED: never 1.0 for a real-time app
  sampleRate: 1.0,                // keep all errors (don't sample errors away)
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Drop expected transport noise
    if (event.exception?.values?.[0]?.value?.includes("xhr poll error")) {
      return null;
    }
    return event;
  },
});
```

### Pattern 2: withSentryConfig — Source Maps and Tunnel (VERIFIED)

**What:** Wrap `next.config.mjs` export with `withSentryConfig` using verified current option names.

**Critical:** `hideSourceMaps` no longer exists — SDK hides source maps by default. `sourcemaps.deleteSourcemapsAfterUpload` defaults to `true`. The `tunnelRoute` option generates a built-in proxy route.

```javascript
// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,

  // Tunnel — routes Sentry events through /monitoring on your domain
  // Ad blockers cannot block *.ingest.sentry.io if requests go via your domain
  tunnelRoute: "/monitoring",

  // Source maps: deleteSourcemapsAfterUpload defaults to true.
  // No hideSourceMaps needed — SDK hides them by default.
  // Only configure if you need non-default behavior:
  // sourcemaps: { deleteSourcemapsAfterUpload: true }
});
```

**Source:** Sentry docs verified 2026-03-18 — `deleteSourcemapsAfterUpload` default is `true`; `hideSourceMaps` option removed.

**If `@next/bundle-analyzer` is later added (Phase 12):** Wrap innermost — `withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions)`.

### Pattern 3: lib/sentry.ts — Thin Wrappers

**What:** All Sentry API calls from application code route through helpers. No component imports `@sentry/nextjs` directly.

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";
import type { User } from "@supabase/supabase-js";

export function setSentryUser(user: User) {
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
  });
}

export function setSentryGameContext(roomId: string, phase?: string) {
  Sentry.setContext("gameroom", {
    roomId,
    phase: phase ?? "unknown",
  });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}
```

**Why:** Prevents Sentry import in Server Components (build error), makes mocking in tests straightforward, and keeps the Sentry surface narrow.

### Pattern 4: SentryUserSync — Supabase Auth to Sentry Context

**What:** Client Component mounted in `provider.tsx` that subscribes to Supabase auth state and calls helpers. Uses the existing `createClient()` singleton from `src/lib/supabase/client.ts`.

```typescript
// src/components/SentryUserSync.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setSentryUser, clearSentryUser } from "@/lib/sentry";

export function SentryUserSync() {
  useEffect(() => {
    const supabase = createClient();

    // Set user on mount if already signed in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSentryUser(data.user);
    });

    // Keep in sync with auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setSentryUser(session.user);
        } else {
          clearSentryUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
```

**Mount in `provider.tsx`:**
```typescript
// src/app/provider.tsx — add after JotaiProvider + PerformanceInitializer
import { SentryUserSync } from "@/components/SentryUserSync";

export const Provider = ({ children }: Props) => {
  return (
    <JotaiProvider>
      <PerformanceInitializer />
      <SentryUserSync />          {/* ADD THIS */}
      <PerformanceModal />
      {children}
    </JotaiProvider>
  );
};
```

### Pattern 5: Game Room Context

**What:** Call `setSentryGameContext` in `GameroomPage` when the gameroom atom is resolved so all subsequent events are tagged with `roomId`.

**Where in `gameroom/page.tsx`:**
```typescript
// In GameroomPage — after gameroom atom is available
import { setSentryGameContext } from "@/lib/sentry";

// Inside useEffect when gameroom loads:
useEffect(() => {
  if (gameroom?.id) {
    setSentryGameContext(gameroom.id);
  }
}, [gameroom?.id]);
```

**Note:** This is a client-side-only call. `setSentryGameContext` from `lib/sentry.ts` is safe to call in a Client Component.

### Pattern 6: Socket.IO connect_error Capture with Deduplication

**What:** The existing `connect_error` handler in `useGameSocket.ts` (line 164) only updates React state. Add `Sentry.captureException` with a 30-second deduplication guard so 5 rapid reconnect attempts produce one Sentry event, not five.

**Current state (no Sentry):**
```typescript
socket.on("connect_error", (error) => {
  setSocketState((prev) => ({ ...prev, ... }));
  scheduleReconnect();
});
```

**Modified:**
```typescript
// Outside initializeSocket — module-level deduplication
let lastConnectErrorCapture = 0;

// Inside initializeSocket — connect_error handler
socket.on("connect_error", (error) => {
  const now = Date.now();
  if (now - lastConnectErrorCapture > 30_000) {
    // Import through lib/sentry.ts to avoid direct @sentry/nextjs import
    import("@/lib/sentry").then(({ captureException }) => {
      captureException(error, { tags: { source: "socket_connect_error" } });
    });
    lastConnectErrorCapture = now;
  }
  setSocketState((prev) => ({ ...prev, ... }));
  scheduleReconnect();
});
```

**Alternatively** (simpler for a Client Component context): export a `captureException` re-export from `src/lib/sentry.ts` and import it synchronously — the hook is already `"use client"`.

**For `useChatWs.ts`** — add the same pattern to the `socket.on("error", ...)` handler (line 63-70 in current code):
```typescript
socket.on("error", (err) => {
  import("@/lib/sentry").then(({ captureException }) =>
    captureException(err, { tags: { source: "chat_socket_error" } })
  );
  // ... existing state update
});
```

### Pattern 7: global-error.tsx

**What:** App Router's top-level React boundary. Required by Sentry setup guides. Captures the error to Sentry then shows a minimal fallback.

```typescript
// src/app/global-error.tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", color: "white", background: "#0a0a1f" }}>
          <h2>Something went wrong</h2>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
```

**Note:** `global-error.tsx` replaces the entire root layout including `<html>` and `<body>` — it must include those tags. This is Phase 10's responsibility per the phase scope. The layered `GameroomErrorBoundary` is Phase 11.

### Anti-Patterns to Avoid

- **`hideSourceMaps: true` in withSentryConfig:** This option no longer exists. The SDK hides source maps by default. Using it will likely produce a config validation error or be silently ignored.
- **`tracesSampleRate: 1.0` in production:** Will exhaust Sentry quota within hours during active gameplay. Use `0.1`.
- **Direct `@sentry/nextjs` import in components:** Server Components cannot use browser SDK. Route all calls through `src/lib/sentry.ts`.
- **Manual `sentry-tunnel` API route when `tunnelRoute` option exists:** More code, same result. Use `tunnelRoute` in `withSentryConfig` unless you need custom SSRF validation logic the built-in does not provide.
- **Calling `captureException` inside high-frequency event handlers (`lobby_tick`):** Use `addBreadcrumb` for event-level errors; reserve `captureException` for `connect_error` and unrecoverable states.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ad-blocker bypass for Sentry events | Custom proxy API route | `tunnelRoute` in `withSentryConfig` | Built-in option handles routing; one config line vs a full route.ts file |
| Source map privacy | Custom webpack plugin or Next.js config | `withSentryConfig` default behavior | SDK hides maps by default; `sourcemaps.deleteSourcemapsAfterUpload` defaults to true |
| Error capture global handler | `window.onerror` / `unhandledrejection` listener | `@sentry/nextjs` SDK init | SDK wraps these automatically; custom handler risks double-reporting |
| User identity in errors | Custom error metadata | `Sentry.setUser()` via `lib/sentry.ts` | SDK attaches user scope to all subsequent events automatically |

**Key insight:** The SDK does the hard work. Phase 10 work is configuration and wiring, not building.

---

## Common Pitfalls

### Pitfall 1: Wrong Client Config Filename

**What goes wrong:** Creating `sentry.client.config.ts` (the v8-era name) instead of `instrumentation-client.ts` (current). The browser SDK is not initialized and client-side errors are never captured.

**Why it happens:** Training data, blog posts, and old Stack Overflow answers reference the old file name.

**How to avoid:** Use the wizard — it creates the correct file name. If writing manually, use `instrumentation-client.ts`.

**Warning signs:** No Sentry events from browser sessions; server errors appear but client errors do not.

### Pitfall 2: Using hideSourceMaps Option That No Longer Exists

**What goes wrong:** Adding `hideSourceMaps: true` to `withSentryConfig` — the option was removed. Developers add it from old documentation, thinking source maps need explicit hiding.

**Why it happens:** The option existed in v7/v8. Guides and blog posts written before its removal still recommend it.

**How to avoid:** Do not add `hideSourceMaps`. Verify source map security after production build: `find .next -name "*.map"` — expect zero results. The SDK hides them by default.

**Warning signs:** Build warnings about unknown config option, or false confidence that maps are hidden when the build check hasn't been run.

### Pitfall 3: Sentry Events Blocked by Ad Blockers (No Tunnel)

**What goes wrong:** Source map security satisfied but events never reach Sentry for ad-blocker users — silent data loss. For a consumer game platform, a significant fraction of users run ad blockers.

**How to avoid:** Add `tunnelRoute: "/monitoring"` (or similar path) to `withSentryConfig`. Verify by testing with uBlock Origin enabled.

**Warning signs:** Low Sentry event volume relative to active user count; no `tunnelRoute` key in `withSentryConfig` options.

### Pitfall 4: Event Flood from Socket.IO Errors

**What goes wrong:** `connect_error` fires up to 5 times per disconnection episode (MAX_RECONNECT_ATTEMPTS = 5 in `useGameSocket.ts`). Without a deduplication guard, a brief network hiccup generates 5 Sentry events per user.

**How to avoid:** Deduplication guard — capture at most once per 30 seconds per socket. See Pattern 6 above.

**Warning signs:** `tracesSampleRate: 1.0` in config; no deduplication guard in `connect_error` handler; Sentry issues list dominated by `connect_error` with thousands of occurrences.

### Pitfall 5: Setting Sentry Context in the Wrong Place

**What goes wrong:** Calling `Sentry.setUser()` in a Server Component (build error), in middleware (edge-only, different runtime than browser SDK), or in a component that mounts late (events before mount have no user context).

**How to avoid:** `SentryUserSync` mounts early in `provider.tsx` inside `JotaiProvider`. It uses `supabase.auth.getUser()` on mount for existing sessions, and `onAuthStateChange` for future changes. This covers the case where the user is already signed in when the app loads.

**Warning signs:** Sentry events showing anonymous user even for signed-in sessions; TypeScript error about `@sentry/nextjs` being unavailable in Server Component.

### Pitfall 6: Skipping the Production Build Verification

**What goes wrong:** Assuming source maps are hidden without verifying. The default is correct, but a misconfiguration in `withSentryConfig` or a Webpack plugin conflict could leave maps public.

**How to avoid:** Verification step in the success criteria — run `next build` in production mode and `find .next -name "*.map"` — must return zero results before phase is marked complete.

**Warning signs:** Skipping this check is itself the warning sign.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### withSentryConfig (current option names)

```javascript
// next.config.mjs
// Source: Sentry Build Options docs, verified 2026-03-18
import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  {
    output: "standalone",
    // other next config options
  },
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    tunnelRoute: "/monitoring",
    // sourcemaps.deleteSourcemapsAfterUpload defaults to true — no explicit config needed
  }
);
```

### instrumentation-client.ts (current filename — not sentry.client.config.ts)

```typescript
// instrumentation-client.ts
// Source: Sentry Manual Setup docs, verified 2026-03-18
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sampleRate: 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes("xhr poll error")) {
      return null;
    }
    return event;
  },
});
```

### instrumentation.ts register() hook

```typescript
// instrumentation.ts (root or src/)
// Source: Next.js Instrumentation docs + Sentry Manual Setup
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

### sentry.server.config.ts

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sentry.client.config.ts` | `instrumentation-client.ts` | SDK v8+ (App Router focus) | Wrong filename = no browser error capture |
| `hideSourceMaps: true` in config | Not needed — SDK hides by default | Removed in recent SDK | Adding deprecated option = config warning or silent no-op |
| Manual tunnel API route (`/api/sentry-tunnel/route.ts`) | `tunnelRoute: "/monitoring"` in `withSentryConfig` | Built-in support added | Single config line vs full API route file |
| `deleteSourcemapsAfterUpload: true` explicit | Default is `true` | Recent SDK default change | No explicit config needed; maps are deleted after upload automatically |

**Deprecated/outdated:**
- `hideSourceMaps` option: removed from SDK; source maps hidden by default
- `sentry.client.config.ts` filename: superseded by `instrumentation-client.ts` for browser runtime
- Split `@sentry/react` + `@sentry/node` SDKs: use `@sentry/nextjs` (unified) only

---

## Open Questions

1. **Exact files wizard creates in a src/ project**
   - What we know: Wizard supports root and `src/` layouts for `instrumentation.ts`; will create `instrumentation-client.ts` (current name)
   - What's unclear: Whether wizard places files in `src/` automatically or always at root when `src/` layout is detected
   - Recommendation: Run wizard first, note exactly which files it creates and where, then proceed with post-wizard additions. Do not create files preemptively.

2. **`tunnelRoute` built-in vs manual route for SSRF safety**
   - What we know: `tunnelRoute` option generates a proxy route automatically; manual route allows explicit DSN host validation
   - What's unclear: Whether the built-in `tunnelRoute` includes SSRF host validation internally
   - Recommendation: Use built-in `tunnelRoute: "/monitoring"` first. If SSRF validation is a security requirement, inspect the generated route or fall back to manual implementation.

3. **`sendDefaultPii` for user IP addresses (v9 breaking change)**
   - What we know: v9 no longer infers IP addresses by default; requires `sendDefaultPii: true` to restore
   - What's unclear: Whether this project requires IP-based event grouping
   - Recommendation: Omit `sendDefaultPii` — user ID from Supabase auth is sufficient context for this project; IP-based grouping is not needed.

---

## Validation Architecture

`nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest/vitest/playwright config files exist |
| Config file | None — Wave 0 must install a test runner if automated tests are required |
| Quick run command | N/A — see Wave 0 Gaps |
| Full suite command | N/A — see Wave 0 Gaps |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-01 | Source maps absent from `.next/` after production build | smoke (build check) | `next build && find .next -name "*.map" \| wc -l` (expect 0) | Manual verification — no test file |
| OBS-01 | `tunnelRoute` endpoint responds to POST | smoke | `curl -s -o /dev/null -w "%{http_code}" -X POST /monitoring` | Manual verification |
| OBS-01 | `tracesSampleRate` is not 1.0 | manual | Inspect `instrumentation-client.ts` value | Manual code review |
| OBS-02 | Unhandled error appears in Sentry with readable stack trace | e2e / manual | Throw test error in browser, verify Sentry dashboard | Manual only — no e2e framework |
| OBS-02 | Socket `connect_error` appears in Sentry (once per episode) | manual | Disconnect network, check Sentry | Manual only |
| OBS-05 | Sentry event includes user ID (not anonymous) | manual | Sign in, trigger error, check Sentry event user field | Manual only |
| OBS-05 | Sentry event includes `roomId` in gameroom context | manual | Enter gameroom, trigger error, check Sentry event context | Manual only |

**Note on test automation:** Phase 10 requirements are primarily verified through Sentry dashboard inspection and build-time checks rather than automated unit tests. The build check (`find .next -name "*.map"`) is the most automatable — it can be added as a post-build script in `package.json`.

### Sampling Rate

- **Per task commit:** Build check: `next build && find .next -name "*.map"` (returns 0)
- **Per wave merge:** Full build check + manual Sentry event verification
- **Phase gate:** All manual checks in the test map above verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test framework installed — this phase does not require unit tests; all validation is build-check + manual Sentry dashboard
- [ ] Add build check script to `package.json`: `"check:sourcemaps": "find .next -name '*.map' | wc -l"` — covers OBS-01 source map gate
- [ ] Consider adding `"build:check": "next build && npm run check:sourcemaps"` for CI use

*(If automated test infrastructure were needed for future phases, vitest would be the appropriate choice for this Next.js 16 + React 19 stack.)*

---

## Sources

### Primary (HIGH confidence)
- Sentry Build Options docs (verified 2026-03-18): https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/ — confirmed `tunnelRoute`, `sourcemaps.deleteSourcemapsAfterUpload` default `true`, `hideSourceMaps` absent
- Sentry Manual Setup docs (verified 2026-03-18): https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/ — confirmed `instrumentation-client.ts` as current client init file, `src/` layout support
- Sentry v8→v9 Migration docs (verified 2026-03-18): https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v8-to-v9/ — confirmed `sendDefaultPii` IP inference change; no config filename breaking changes in this guide
- Codebase analysis: `useGameSocket.ts`, `useChatWs.ts`, `provider.tsx`, `layout.tsx`, `src/lib/supabase/client.ts`, `src/hooks/useUser.ts` — direct inspection of hook structure and integration points

### Secondary (MEDIUM confidence)
- Sentry Source Maps docs (verified 2026-03-18): https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/ — `deleteSourcemapsAfterUpload` default true confirmed; `hideSourceMaps` not mentioned (confirmed removed)
- Training knowledge (August 2025): `Sentry.setUser()`, `Sentry.setContext()`, `Sentry.withScope()` API — stable SDK primitives, HIGH confidence individually

### Tertiary (LOW confidence)
- WebSearch result claiming `hideSourceMaps` was "removed without replacement" — verified indirectly by absence in current official docs; flag for confirmation when wizard runs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Wizard install path confirmed; `@sentry/nextjs` unified SDK is canonical
- Config option names: HIGH — `tunnelRoute`, `sourcemaps.deleteSourcemapsAfterUpload` verified against live docs 2026-03-18; `hideSourceMaps` absence confirmed
- Architecture: HIGH — File placement, `instrumentation-client.ts` name, `global-error.tsx` contract all verified
- Pitfalls: HIGH — Source map security, event flood, wrong filename all grounded in verified API behavior
- Socket error capture pattern: MEDIUM — `connect_error` API is stable (Socket.IO v4); deduplication guard pattern is correct; exact import style (`dynamic import` vs synchronous) may need adjustment based on hook context

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (Sentry docs are moderately stable; re-verify `tunnelRoute` behavior if wizard output differs from expected)
