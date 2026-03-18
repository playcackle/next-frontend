# Architecture Research

**Domain:** Sentry integration + error boundaries + performance profiling in Next.js 16 App Router (React 19)
**Researched:** 2026-03-17
**Confidence:** MEDIUM — Sentry Next.js SDK v8 patterns are well-established as of August 2025. React 19 + Next.js 16 specifics verified from codebase inspection; Sentry API verified from SDK documentation patterns (web tools unavailable; flagged below).

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                           │
│                                                                      │
│  src/app/global-error.tsx          ← App Router global error page   │
│  src/app/layout.tsx                ← Wraps GlobalErrorBoundary       │
│  src/app/error.tsx                 ← Route-segment fallback (opt-in) │
├──────────────────────────────────────────────────────────────────────┤
│                        Sentry Config Layer                           │
│                                                                      │
│  sentry.client.config.ts           ← Browser SDK init (DSN, scope)  │
│  sentry.server.config.ts           ← Node/Edge SDK init             │
│  sentry.edge.config.ts             ← Edge runtime (middleware)      │
│  instrumentation.ts (src/)         ← Next.js hook loads server conf │
├──────────────────────────────────────────────────────────────────────┤
│                          Build Pipeline                              │
│                                                                      │
│  next.config.mjs                   ← withSentryConfig wrapper       │
├──────────────────────────────────────────────────────────────────────┤
│                       Gameroom Error Layer                           │
│                                                                      │
│  src/components/GameroomErrorBoundary.tsx   ← Class-based boundary  │
│  src/app/gameroom/page.tsx                  ← Wrapped by above      │
├──────────────────────────────────────────────────────────────────────┤
│                       Identity / Context                             │
│                                                                      │
│  src/lib/sentry.ts                 ← setUser(), setContext() helpers │
│  src/hooks/useUser.ts              ← Existing Supabase user hook     │
│  src/app/provider.tsx              ← Mounts SentryUserSync          │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `sentry.client.config.ts` | Browser-side SDK init: DSN, release, environment, replay, tracing | `Sentry.init()` called once at module load; included via `next.config.mjs` instrumentation |
| `sentry.server.config.ts` | Server-side SDK init: same options minus Replay; source map upload | `Sentry.init()` with `integrations: [nodeProfilingIntegration()]` |
| `instrumentation.ts` | Next.js 15/16 lifecycle hook; imports server config when `runtime !== 'edge'` | `export async function register()` — the only supported hook point for server-side Sentry init in App Router |
| `next.config.mjs` (modified) | Wraps config with `withSentryConfig` to enable source map upload, bundle plugin, and `autoInstrumentServerFunctions` | ESM wrapper around existing `nextConfig` export |
| `src/app/global-error.tsx` | App Router's top-level React error boundary; catches any uncaught render error in the entire tree | Must be a Client Component (`"use client"`); receives `error` and `reset` props; calls `Sentry.captureException(error)` in `useEffect` |
| `src/app/error.tsx` | Route-segment error boundary; optional but can catch errors scoped to `/app` without destroying the entire layout | Same pattern as `global-error.tsx` but keeps Header/SynthwaveBackground alive |
| `GameroomErrorBoundary.tsx` | Class-based React error boundary wrapping only the gameroom; attempts silent recovery; shows minimal fallback only on unrecoverable crash | Extends `React.Component`; `componentDidCatch` calls `Sentry.captureException` with gameroom context tag |
| `src/lib/sentry.ts` | Thin helpers: `setSentryUser(user)`, `setSentryGameContext(roomId)`, `clearSentryUser()` | Wraps `Sentry.setUser()` and `Sentry.setContext()` so components never import Sentry directly |
| `SentryUserSync` (client component) | Mounts in `provider.tsx`; subscribes to Supabase auth state and calls `setSentryUser` / `clearSentryUser` on change | Small `useEffect`-only component; no UI output |

---

## Recommended Project Structure

```
next-frontend/
├── sentry.client.config.ts          # Browser SDK init (project root)
├── sentry.server.config.ts          # Server/Node SDK init (project root)
├── sentry.edge.config.ts            # Edge runtime init (project root — only if middleware is used)
├── next.config.mjs                  # MODIFIED: wrap with withSentryConfig
src/
├── instrumentation.ts               # MODIFIED or CREATED: register() hook
├── app/
│   ├── global-error.tsx             # NEW: App Router global boundary
│   ├── error.tsx                    # NEW (optional): route-segment boundary
│   ├── layout.tsx                   # MODIFIED: add SentryUserSync inside Provider
│   ├── provider.tsx                 # MODIFIED: mount <SentryUserSync />
│   └── gameroom/
│       ├── page.tsx                 # MODIFIED: wrap render in GameroomErrorBoundary
│       └── layout.tsx               # OPTIONALLY: wrap here instead of page.tsx
├── components/
│   ├── GameroomErrorBoundary.tsx    # NEW: class-based boundary for gameroom
│   └── SentryUserSync.tsx           # NEW: client component syncing auth → Sentry
└── lib/
    └── sentry.ts                    # NEW: setUser/setContext/clearUser helpers
```

### Structure Rationale

- **Sentry config files at project root:** This is where the Sentry Next.js SDK wizard places them and where `withSentryConfig` expects them. Do not put them inside `src/`.
- **`src/instrumentation.ts`:** Next.js 15+ supports this path via `src/` layout. This file is the only guaranteed init point for server-side code in App Router — there is no `_app.tsx` equivalent.
- **`src/lib/sentry.ts`:** Centralising the `setUser`/`setContext` API means components never import `@sentry/nextjs` directly, making the dependency easy to swap and keeping the Sentry surface narrow.
- **`GameroomErrorBoundary.tsx` in `src/components/`:** Shared across any future use of the gameroom; not co-located in `gameroom/` because it is a cross-cutting infrastructure component.
- **`SentryUserSync.tsx` in `src/components/`:** Purely a side-effect component; lives alongside other infrastructure components (Header, SynthwaveBackground, PerformanceInitializer).

---

## Architectural Patterns

### Pattern 1: App Router Global Error Boundary

**What:** `src/app/global-error.tsx` is Next.js's designated top-level error boundary. It replaces the entire root layout when triggered.

**When to use:** Always — this is the safety net for any unhandled render error anywhere in the app tree.

**Trade-offs:** Because it replaces `layout.tsx`, the app shell (Header, background) is gone. Keep the fallback minimal. A "reload" button and a Sentry feedback form are sufficient.

**Example:**
```typescript
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
    <html>
      <body>
        <h2>Something went wrong</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
```

### Pattern 2: Class-Based Gameroom Error Boundary with Silent Recovery

**What:** A React class component wrapping `GameroomPage` that catches render errors silently, attempts a reset, and only shows a fallback after the reset also fails.

**When to use:** For the gameroom specifically — players should not see a crash screen mid-game. The boundary should capture to Sentry and attempt `this.setState({ hasError: false })` once (reset attempt counter), only falling back to UI on second consecutive failure.

**Trade-offs:** Class components are required for `componentDidCatch`; there is no hook equivalent in React 19 as of the research date. The recovery attempt means one silent re-mount before the player sees anything.

**Example:**
```typescript
import * as Sentry from "@sentry/nextjs";

interface State { hasError: boolean; attempts: number; }

export class GameroomErrorBoundary extends React.Component<
  { children: React.ReactNode; roomId?: string },
  State
> {
  state: State = { hasError: false, attempts: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "gameroom");
      if (this.props.roomId) scope.setTag("room_id", this.props.roomId);
      scope.setExtra("componentStack", info.componentStack);
      Sentry.captureException(error);
    });

    // Attempt silent recovery once
    if (this.state.attempts < 1) {
      setTimeout(() => {
        this.setState({ hasError: false, attempts: this.state.attempts + 1 });
      }, 200);
    }
  }

  render() {
    if (this.state.hasError && this.state.attempts >= 1) {
      return <div>Game room encountered an error. Please rejoin.</div>;
    }
    return this.props.children;
  }
}
```

### Pattern 3: Supabase User Identity Attached to Sentry Events

**What:** After `useUser()` resolves, call `Sentry.setUser()` so all subsequent events include user identity. Clear it on sign-out.

**When to use:** Mount once at the top of the app in a dedicated side-effect component (`SentryUserSync`) inside `Provider`, after `JotaiProvider`.

**Trade-offs:** The component must be a Client Component. It re-runs on every auth state change via `supabase.auth.onAuthStateChange`, which is already tracked in `useUser.ts`. Duplicating the subscription is clean — `SentryUserSync` owns only the Sentry side-effect.

**Example:**
```typescript
"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setSentryUser, clearSentryUser } from "@/lib/sentry";

export function SentryUserSync() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSentryUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

### Pattern 4: Socket.IO Error Capture

**What:** Both `useGameSocket` and `useChatSocket` catch errors in their listener loops via `try/catch` and log to `console.error`. These need to be forwarded to Sentry without disrupting the existing debounced-error-log pattern.

**When to use:** In the `connect_error` and per-event `try/catch` blocks inside both socket hooks.

**Trade-offs:** Do not use `Sentry.captureException` in high-frequency paths (e.g., inside `lobby_tick` listeners) — it adds network overhead per call. Use `Sentry.captureException` only for `connect_error` (fatal) and unrecoverable states (`connectionStatus === "error"` after max reconnect). For listener-level errors, use `Sentry.addBreadcrumb` instead — it is local and captured with the next real exception.

**Example:**
```typescript
// In useGameSocket — connect_error handler
socket.on("connect_error", (error) => {
  // Capture fatal connection failures
  Sentry.withScope((scope) => {
    scope.setTag("socket", "game");
    scope.setExtra("reconnectAttempts", prev.reconnectAttempts);
    Sentry.captureException(error);
  });
  // ... existing state update
});

// In event listener loop — add breadcrumb, not captureException
try {
  callback(data);
} catch (error) {
  Sentry.addBreadcrumb({
    category: "socket.event",
    message: `Error in ${eventName} listener`,
    level: "error",
    data: { eventName },
  });
  debouncedErrorLog(`Error in ${eventName} listener:`, error);
}
```

---

## Data Flow

### Error Capture Flow

```
Render Error (any component)
    ↓
GameroomErrorBoundary.componentDidCatch (if inside gameroom)
    OR
global-error.tsx (if outside gameroom or GEB re-throws)
    ↓
Sentry.captureException(error, { tags: { boundary, room_id } })
    ↓
Sentry event enriched with: user identity (set by SentryUserSync)
                              gameroom context (set by GameroomErrorBoundary)
    ↓
Sentry ingestion endpoint
```

### Socket Error Capture Flow

```
socket.on("connect_error", error)
    ↓
Sentry.captureException → full event with user + room context

socket.on(eventName, data) → callback throws
    ↓
Sentry.addBreadcrumb → low-cost local record
    ↓
If another exception fires → breadcrumb trail visible in Sentry
```

### User Identity Flow

```
App boots → SentryUserSync mounts (inside Provider)
    ↓
supabase.auth.getUser() resolves
    ↓
setSentryUser({ id: user.id, email: user.email })  [lib/sentry.ts]
    ↓
All subsequent Sentry events tagged with user identity
    ↓
Auth state change (SIGNED_OUT) → clearSentryUser()
```

### Build Pipeline Flow

```
next.config.mjs
    ↓
withSentryConfig(nextConfig, { org, project, authToken })
    ↓
Sentry webpack plugin: uploads source maps → Sentry after each build
                        instruments server functions automatically
```

---

## New vs Modified Files

### New Files (do not exist yet)

| File | Type | Purpose |
|------|------|---------|
| `sentry.client.config.ts` (root) | New | Browser SDK init: DSN, Replay, tracing |
| `sentry.server.config.ts` (root) | New | Server SDK init: DSN, profiling |
| `sentry.edge.config.ts` (root) | New (optional) | Edge SDK init — only needed if middleware.ts exists |
| `src/instrumentation.ts` | New | register() hook to load server config in App Router |
| `src/app/global-error.tsx` | New | Top-level React error boundary (replaces root layout on crash) |
| `src/app/error.tsx` | New (optional) | Route-segment boundary — keeps layout shell alive for non-root errors |
| `src/components/GameroomErrorBoundary.tsx` | New | Class-based boundary with silent recovery + Sentry capture |
| `src/components/SentryUserSync.tsx` | New | Mounts in Provider; syncs Supabase auth → Sentry.setUser |
| `src/lib/sentry.ts` | New | Thin wrappers: setSentryUser, setSentryGameContext, clearSentryUser |

### Modified Files (already exist)

| File | Change |
|------|--------|
| `next.config.mjs` | Wrap export with `withSentryConfig(nextConfig, sentryOptions)` |
| `src/app/provider.tsx` | Add `<SentryUserSync />` after `<PerformanceInitializer />` |
| `src/app/gameroom/page.tsx` | Wrap return in `<GameroomErrorBoundary roomId={gameroom?.id}>` |
| `src/app/gameroom/hooks/useGameSocket.ts` | Add `Sentry.captureException` in `connect_error`; add `Sentry.addBreadcrumb` in event listener catches |
| `src/app/gameroom/hooks/useChatWs.ts` | Add `Sentry.captureException` in `socket.on("error", ...)` handler |

---

## Build Order (Dependency-Aware)

Phase ordering matters because `GameroomErrorBoundary` depends on `src/lib/sentry.ts`, and socket captures depend on the SDK being initialised.

```
1. Install SDK + write sentry config files
   sentry.client.config.ts
   sentry.server.config.ts
   src/instrumentation.ts
   Modify: next.config.mjs

2. Write lib/sentry.ts helpers
   (no dependencies — pure wrappers)

3. Write SentryUserSync + modify Provider
   Depends on: lib/sentry.ts, supabase client

4. Write global-error.tsx
   Depends on: Sentry SDK init

5. Write GameroomErrorBoundary
   Depends on: lib/sentry.ts

6. Modify gameroom/page.tsx to use boundary
   Depends on: GameroomErrorBoundary

7. Modify socket hooks for error capture
   Depends on: Sentry SDK init, lib/sentry.ts

8. Optional: src/app/error.tsx
   Depends on: Sentry SDK init
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sentry ingestion | `@sentry/nextjs` SDK via `Sentry.captureException` / `Sentry.addBreadcrumb` | SDK handles batching, envelope transport; no direct HTTP calls needed |
| Sentry source maps | `withSentryConfig` webpack plugin at build time | Requires `SENTRY_AUTH_TOKEN` in CI env; `authToken` in `withSentryConfig` options |
| Supabase auth | `supabase.auth.getUser()` + `onAuthStateChange` in `SentryUserSync` | Reuses existing `createClient()` from `src/lib/supabase/client.ts` — no new Supabase setup |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `SentryUserSync` → Sentry | `lib/sentry.ts` helpers | Never call `Sentry.setUser` directly in components — route through helpers |
| `GameroomErrorBoundary` → Sentry | `Sentry.withScope` + `captureException` inside `componentDidCatch` | `withScope` ensures room_id tag is scoped to this event only |
| `useGameSocket` / `useChatWs` → Sentry | `captureException` for connection errors; `addBreadcrumb` for listener errors | Keep high-frequency paths on `addBreadcrumb` to avoid cost |
| `global-error.tsx` → Sentry | `Sentry.captureException(error)` in `useEffect` | `useEffect` is required because App Router error components cannot run server-side capture directly |

---

## Anti-Patterns

### Anti-Pattern 1: Calling Sentry.captureException in High-Frequency Event Handlers

**What people do:** Add `Sentry.captureException` directly inside `lobby_tick` listeners or other debounced game-event loops.

**Why it's wrong:** `lobby_tick` fires multiple times per second. Each `captureException` call enqueues a network request to Sentry. This kills performance and floods the Sentry quota.

**Do this instead:** Use `Sentry.addBreadcrumb` for event-level errors. Only call `captureException` for connection-level failures (`connect_error`, max reconnect exceeded) — these are infrequent and genuinely diagnostic.

### Anti-Pattern 2: Placing Error Boundaries as Siblings Instead of Wrappers

**What people do:** Put `<GameroomErrorBoundary>` at the same level as the content it should protect, or outside the component tree rather than wrapping it.

**Why it's wrong:** A boundary only catches errors thrown by its children during render. A sibling boundary catches nothing. In `page.tsx`, the boundary must be the outermost wrapper of all gameroom JSX.

**Do this instead:** `<GameroomErrorBoundary roomId={gameroom?.id}>{/* all game UI */}</GameroomErrorBoundary>` as the outermost element in the return.

### Anti-Pattern 3: Importing @sentry/nextjs Directly in Components

**What people do:** `import * as Sentry from "@sentry/nextjs"` sprinkled across multiple component files.

**Why it's wrong:** Creates a wide dependency surface; makes mocking in tests harder; Sentry import in a Server Component causes build errors because the browser SDK is not available in the Node runtime.

**Do this instead:** All Sentry calls route through `src/lib/sentry.ts`. That file can guard with `typeof window !== "undefined"` for client-only calls, and can be replaced with a no-op mock in tests.

### Anti-Pattern 4: Using global-error.tsx as the Only Error Boundary

**What people do:** Rely solely on `global-error.tsx` and skip the gameroom-level boundary.

**Why it's wrong:** `global-error.tsx` destroys the entire app shell including the root `<html>` layout. For a single gameroom crash, this means players lose navigation, background, and all UI. A gameroom-specific boundary catches the crash earlier, attempts recovery, and keeps the app shell alive.

**Do this instead:** Layered boundaries: `global-error.tsx` as the last resort, `GameroomErrorBoundary` as the first line of defence for gameroom crashes.

### Anti-Pattern 5: Initializing Sentry in a Client Component Instead of instrumentation.ts

**What people do:** Call `Sentry.init()` inside a `"use client"` component's `useEffect`, or in a custom `_app` equivalent.

**Why it's wrong:** In App Router, there is no `_app`. A Client Component `useEffect` init only runs after the first render, missing any SSR errors. Server-side Sentry init in a component never runs at all on the server.

**Do this instead:** `instrumentation.ts` with `export async function register()` is the App Router contract for server-side init. `sentry.client.config.ts` is auto-loaded by `withSentryConfig` for the browser. These are the only correct init points.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single game server) | Current architecture is sufficient. Keep Sentry sample rates conservative (tracesSampleRate: 0.1, replaysSessionSampleRate: 0.05) to avoid quota burn. |
| Multiple game servers / regions | Add `Sentry.setContext("server", { region })` at connection time in `useGameSocket`. Tag events per-server so filtering is possible. |
| High concurrent users | Consider `beforeSend` filter in Sentry config to drop known-benign errors (e.g., socket disconnects on page unload) before they hit quota. |

---

## Confidence Notes

| Claim | Confidence | Basis |
|-------|------------|-------|
| File placement (root-level sentry configs, `src/instrumentation.ts`) | MEDIUM | Established pattern in Sentry Next.js SDK v8; web verification unavailable |
| `withSentryConfig` in `next.config.mjs` (ESM) | MEDIUM | Next.js 16 uses `.mjs`; Sentry SDK v8 supports ESM `next.config.mjs`; web verification unavailable |
| `global-error.tsx` as App Router boundary | HIGH | Next.js App Router docs-defined contract; visible in codebase patterns |
| Class component required for `componentDidCatch` | HIGH | React 19 has no hook equivalent for error boundaries (confirmed as of Aug 2025) |
| `Sentry.addBreadcrumb` vs `captureException` in high-frequency paths | HIGH | Sentry SDK performance guidance; no web verification needed — this is SDK semantics |
| `SentryUserSync` using existing `createClient()` | HIGH | `src/lib/supabase/client.ts` confirmed in codebase; singleton pattern confirmed |

---

## Sources

- Sentry Next.js SDK documentation (https://docs.sentry.io/platforms/javascript/guides/nextjs/) — MEDIUM confidence, web tools unavailable, pattern verified from SDK v8 knowledge
- Next.js App Router error handling docs (https://nextjs.org/docs/app/building-your-application/routing/error-handling) — HIGH confidence for `global-error.tsx` and `error.tsx` contracts
- Codebase inspection: `src/app/gameroom/hooks/useGameSocket.ts`, `useChatWs.ts`, `useGameEvents.ts`, `page.tsx`, `provider.tsx`, `layout.tsx`, `src/lib/supabase/client.ts`, `src/hooks/useUser.ts`
- React 19 documentation: class component requirement for `componentDidCatch` unchanged

---

*Architecture research for: Sentry + error boundaries + performance profiling in Next.js 16 App Router*
*Researched: 2026-03-17*
