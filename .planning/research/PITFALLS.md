# Pitfalls Research

**Domain:** Sentry + error boundaries + performance profiling on a Next.js 16 / React 19 real-time multiplayer app
**Researched:** 2026-03-17
**Confidence:** MEDIUM — WebSearch and WebFetch unavailable; findings drawn from training knowledge (cutoff August 2025) and direct codebase analysis. Confidence levels assigned per finding. Validate against current Sentry SDK docs before phase execution.

---

## Critical Pitfalls

### Pitfall 1: Source Maps Served Publicly in Production

**What goes wrong:**
Sentry's Next.js SDK (`@sentry/nextjs`) injects source map upload into the build pipeline. If `hideSourceMaps` is not explicitly set to `true` in `sentry.config.js`, Next.js may include `.map` files in the production build output, making them publicly accessible at `/_next/static/chunks/*.js.map`. Any visitor can download them and read the original TypeScript source — including internal URLs, business logic, and environment variable names embedded as string literals.

**Why it happens:**
The Sentry wizard generates a working config that uploads maps to Sentry but does not always set `hideSourceMaps: true` in the `withSentryConfig()` wrapper. Developers assume "maps uploaded to Sentry" means "maps removed from public output," but these are independent operations. Next.js standalone output (`output: 'standalone'`, which this project uses) copies everything into `.next/standalone`, so maps that survive the build step are shipped.

**How to avoid:**
In `next.config.mjs`:
```js
export default withSentryConfig(nextConfig, {
  hideSourceMaps: true,   // strips .map from the public output
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,  // removes from server filesystem after upload
  },
});
```
Both flags are required: `hideSourceMaps` removes maps from the client bundle; `deleteSourcemapsAfterUpload` removes them from the server output directory after Sentry has ingested them. Verify with `find .next -name "*.map"` after a production build — zero results expected.

**Warning signs:**
- `curl https://yourapp.com/_next/static/chunks/[hash].js.map` returns 200 with JSON
- Build output shows `.map` files in `.next/static/chunks/`
- Sentry wizard output does not mention `hideSourceMaps`

**Phase to address:**
Phase 1 (Sentry install and configuration) — set both flags before any production deployment. Treat this as a security gate, not a follow-up.

---

### Pitfall 2: Sentry Events Blocked by Ad Blockers (Missing Tunnel Route)

**What goes wrong:**
By default, Sentry sends events to `https://o<id>.ingest.sentry.io`. Ad blockers (uBlock Origin, Privacy Badger, Brave Shield) and corporate firewalls block `*.ingest.sentry.io` by hostname. For a game platform with players who are likely to use ad blockers, this silently drops a significant fraction of error reports — you have no observability into errors for that user segment, which is often the same segment that encounters browser-specific issues.

**Why it happens:**
Sentry's SDK fires requests directly from the browser to Sentry's ingestion endpoint. Ad blockers maintain blocklists that include Sentry's domain. Without a tunnel, there is no workaround — the browser extension intercepts the XHR before it leaves the machine.

**How to avoid:**
Create a Next.js API route that proxies Sentry events through your own domain:

```ts
// src/app/api/sentry-tunnel/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const envelope = await request.text();
  const pieces = envelope.split("\n");
  const header = JSON.parse(pieces[0]);
  const dsn = new URL(header.dsn);
  const projectId = dsn.pathname.replace("/", "");
  const sentryIngestUrl = `https://${dsn.host}/api/${projectId}/envelope/`;

  const response = await fetch(sentryIngestUrl, {
    method: "POST",
    body: envelope,
  });

  return new NextResponse(null, { status: response.status });
}
```

Then in `sentry.client.config.ts`:
```ts
Sentry.init({
  tunnel: "/api/sentry-tunnel",
  // ...
});
```

The tunnel must only forward to Sentry's own ingestion URL — validate the DSN host against a whitelist to prevent SSRF.

**Warning signs:**
- Sentry event volume is suspiciously low relative to active users
- No `tunnel` key in `sentry.client.config.ts`
- Console shows `net::ERR_BLOCKED_BY_CLIENT` on sentry requests in browser devtools

**Phase to address:**
Phase 1 (Sentry install). Add the tunnel route at the same time as the Sentry init — it is a single file addition and should not be deferred.

---

### Pitfall 3: Error Boundary Silently Swallows Socket.IO Errors

**What goes wrong:**
React error boundaries only catch errors thrown during rendering, in lifecycle methods, and in constructors of class components. They do NOT catch errors thrown in:
- Event handlers (`socket.on("event", handler)`)
- Async code (`async/await`, Promise rejections)
- `useEffect` callbacks

Socket.IO errors — connection failures, event handler exceptions, malformed payloads — all happen outside React's rendering cycle. Wrapping the gameroom in an error boundary and assuming Socket.IO errors are covered is incorrect. Those errors vanish silently unless Sentry's global `captureException` or `window.onerror`/`unhandledrejection` is also wired up.

**Why it happens:**
Error boundaries are documented primarily in the context of render crashes. Developers new to error boundaries test them by throwing during render and see them work, then assume they cover all runtime errors. The distinction "render-time only" is easy to miss.

**How to avoid:**
Three layers are required together — none alone is sufficient:

1. **Error boundary** — catches render crashes, provides fallback UI
2. **Sentry automatic instrumentation** — `@sentry/nextjs` wraps `window.onerror` and `window.addEventListener("unhandledrejection")` automatically on init; this catches async and promise-based errors
3. **Explicit capture in socket error handlers:**
```ts
socket.on("connect_error", (err) => {
  Sentry.captureException(err, {
    tags: { source: "socket_connect_error", room: roomId },
  });
});
```

For this codebase's `useGameSocket.ts` and `useChatWs.ts`, add `Sentry.captureException` calls in the existing error and reconnect failure handlers.

**Warning signs:**
- Socket connection errors visible in browser console but not appearing in Sentry
- Error boundary fallback never triggered even during observed connection failures
- No `socket.on("connect_error", ...)` or `socket.on("error", ...)` handlers calling Sentry

**Phase to address:**
Phase 2 (error boundaries) — the Sentry init in Phase 1 handles automatic global coverage, but explicit socket error capture should be added when implementing the gameroom error boundary.

---

### Pitfall 4: `why-did-you-render` Leaking into Production

**What goes wrong:**
`@welldone-software/why-did-you-render` patches React internals (`React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`) to intercept every render. In production this causes measurable performance degradation (20-40% render slowdown reported in community) and produces console output that leaks component names to end users. In Next.js App Router, the patch must be applied before any React component is imported — this requires a carefully ordered import in a dedicated file. If the guard condition is wrong, it ships to production.

**Why it happens:**
The library requires a file like `wdyr.ts` that conditionally imports and patches React. Developers add `if (process.env.NODE_ENV === "development")` but then import the file from a place that gets included in the production bundle (e.g., from `layout.tsx` or `_app.tsx`). Tree-shaking does not remove dynamic side-effect imports. Next.js App Router's server/client boundary adds another dimension: the patch file must be client-only and the import placement matters.

**How to avoid:**
- Import `wdyr.ts` only from a file that is guaranteed to be client-only and dev-only
- Wrap with `process.env.NODE_ENV !== "production"` (double negation is safer than `=== "development"` since test environments also exist)
- Add a CI check: `grep -r "why-did-you-render" .next/` should return empty after production build
- Consider using React DevTools Profiler instead — it provides the same re-render visibility with zero production risk because it only activates in the browser extension context

**Warning signs:**
- Console shows `[why-did-you-render]` messages on the production URL
- Production bundle contains `whyDidYouRender` string (check with `strings .next/static/chunks/*.js | grep whyDidYouRender`)
- Slight but measurable increase in render times compared to a build without it

**Phase to address:**
Phase 3 (performance profiling) — introduce `why-did-you-render` if needed, but prefer React DevTools Profiler first. If `wdyr` is used, add the production-exclusion CI check as a success criterion for that phase.

---

### Pitfall 5: `@next/bundle-analyzer` Affecting Production Build Config

**What goes wrong:**
`@next/bundle-analyzer` wraps `next.config.mjs` with an `enabled` flag. The canonical pattern is:

```js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
```

Two failure modes exist:
1. **Accidentally enabled in production:** If `ANALYZE` is set in the deployment environment (CI/CD pipelines sometimes inherit local env vars), the build generates and attempts to write large HTML report files to the filesystem. In Docker or read-only container filesystems, this causes a build failure. Even when it works, the report files are included in the build output and increase deploy artifact size.
2. **Breaking `withSentryConfig` composition:** When both `withBundleAnalyzer` and `withSentryConfig` wrap `nextConfig`, the order matters. If wrapped incorrectly, Sentry's webpack plugin may not receive the correct config, silently skipping source map upload with no error.

**How to avoid:**
- Install as a `devDependency`, not a `dependency` — this makes the intent explicit
- Correct composition order (Sentry wraps last, analyzer wraps innermost):
```js
export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions);
```
- Add `ANALYZE=true` to `.env.example` with a comment: "Set to true only for local bundle analysis. Never set in CI or production."
- Verify that `ANALYZE` is not present in any Docker or CI environment configuration

**Warning signs:**
- `ANALYZE` appears in `.env.production` or CI environment variables
- Build artifacts include `client.html` or `server.html` report files
- Sentry source maps stop uploading after adding `withBundleAnalyzer`

**Phase to address:**
Phase 3 (performance profiling) — install and configure bundle analyzer as a dev-only tool. Explicitly verify Sentry config composition still works after adding the wrapper.

---

### Pitfall 6: Sentry Capturing Too Much in a Real-Time App (Event Flood)

**What goes wrong:**
Socket.IO fires many events per second during active gameplay: `lobby_tick` (every ~1s), `slot_snapped`, `submission_feedback`, etc. If any of these event handlers throw — due to a malformed payload, a race condition, or a Jotai atom write on an unmounted component — Sentry will capture every occurrence at full volume. A single bug in a handler called 60 times per minute per connected user results in thousands of identical events flooding Sentry, consuming quota, and obscuring other errors.

Additionally, reconnect logic in `useGameSocket.ts` with 5 retry attempts and exponential backoff can generate multiple `connect_error` events per disconnection. Without deduplication, a brief network hiccup creates 5 Sentry events per user.

**Why it happens:**
Default Sentry configuration captures all unhandled errors without rate limiting. In a CRUD app this is appropriate; in a high-frequency real-time loop it is dangerous.

**How to avoid:**
Configure `beforeSend` and `sampleRate` deliberately:

```ts
Sentry.init({
  sampleRate: 1.0,           // keep all errors (don't sample errors away)
  tracesSampleRate: 0.1,     // only 10% of performance traces — real-time apps generate huge trace volume
  beforeSend(event) {
    // Drop expected Socket.IO transport errors to reduce noise
    if (event.exception?.values?.[0]?.value?.includes("xhr poll error")) {
      return null;
    }
    return event;
  },
});
```

For socket error captures, add a simple deduplication guard:
```ts
let lastConnectError = 0;
socket.on("connect_error", (err) => {
  const now = Date.now();
  if (now - lastConnectError > 30_000) {  // once per 30s max
    Sentry.captureException(err, { tags: { source: "socket_connect_error" } });
    lastConnectError = now;
  }
});
```

**Warning signs:**
- Sentry quota consumed within hours of deploying during active gameplay
- Issues list dominated by a single repeated error with thousands of occurrences
- `tracesSampleRate: 1.0` in config (always wrong for a real-time app)

**Phase to address:**
Phase 1 (Sentry configuration) — set `tracesSampleRate` and `beforeSend` at initialization time, before any production traffic hits the new SDK.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Wrapping entire page in a single error boundary | Simple fallback, low setup cost | All errors show the same fallback regardless of severity; gameroom crashes show same UI as minor widget failures | Never — use two-level boundaries (global + gameroom) |
| Skipping `tunnel` route, shipping Sentry without it | Saves ~30 min setup | Silent data loss for ad-blocker users; no baseline on error rates for that segment | Never for a consumer game platform |
| Setting `tracesSampleRate: 1.0` in production | Full visibility into all traces | Sentry quota exhausted in hours during active play; per-trace overhead on every request | Never for a real-time event-driven app |
| Running `@next/bundle-analyzer` output in source control | Persistent history of bundle sizes | HTML reports are large binary-equivalent artifacts; PR diffs become noisy | Never — generate on demand, never commit |
| Using `console.error` to surface errors instead of `Sentry.captureException` | Zero setup, immediate output | Errors invisible in production unless user sends a screenshot | MVP only — replace before v1 launch |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sentry + Next.js App Router | Initializing Sentry only in `sentry.client.config.ts` and forgetting `sentry.server.config.ts` and `sentry.edge.config.ts` | All three config files are required; App Router runs code in three environments (browser, Node.js server, edge); missing server config means server-side errors (API route crashes, SSR failures) go unreported |
| Sentry + React 19 error boundaries | Using class component `componentDidCatch` boundaries instead of the new React 19 `onCaughtError` / `onUncaughtError` root options | React 19 introduces `createRoot({ onCaughtError, onUncaughtError })` for root-level error handling; `@sentry/nextjs` 8.x wraps this automatically if initialized before React mounts — ensure Sentry init runs before `ReactDOM.createRoot` |
| Sentry + Socket.IO | Only reporting errors from the render tree; socket event handler errors are outside React and outside `window.onerror` if caught internally | Add explicit `Sentry.captureException` in `connect_error`, `error`, and reconnect-max-reached handlers in `useGameSocket.ts` and `useChatWs.ts` |
| `@next/bundle-analyzer` + `withSentryConfig` | Wrapping in wrong order breaks Sentry's webpack plugin injection | `withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions)` — Sentry must be the outermost wrapper |
| Sentry + Jotai atoms | Setting Sentry user context in a `useEffect` that depends on Jotai auth atom — fires too late or not at all during SSR | Set user context in a dedicated `SentryUserContext` client component that mounts early in the layout tree; read auth state from Jotai and call `Sentry.setUser()` |
| React DevTools Profiler + Next.js App Router | Running Profiler on the full app in development and seeing inflated re-render counts from `StrictMode` | React 18+ StrictMode double-invokes renders in dev; profile in a production build (`next build && next start`) or disable StrictMode temporarily for profiling |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sentry performance tracing on every Socket.IO event | Sentry quota exhausted, trace overhead added to every `lobby_tick` handler | Set `tracesSampleRate: 0.05–0.1` for a real-time app; never trace high-frequency events | Immediately on first day of production traffic |
| Re-render profiling only in development | Numbers look good in dev, production has different performance characteristics | Profile a production build; StrictMode double-invokes in dev and makes counts appear higher | Development profiling is always misleading for frequency; production profiling is misleading for flame charts |
| `@next/bundle-analyzer` treating all Socket.IO code as one chunk | `socket.io-client` appears as one large chunk with no splitting opportunity | Check if Socket.IO is being statically imported in a Server Component; it should only be imported in client components so it tree-shakes from server bundles | From the first bundle analysis — look for `socket.io-client` in the server chunk |
| Measuring Web Vitals (LCP, CLS) only on home page | Gameroom page (the performance-critical path) is never measured | Configure Sentry or a separate RUM tool to capture Web Vitals on `/gameroom/*` specifically | Always — Web Vitals for the landing page are irrelevant to player experience |
| Profiling with browser extensions active | Extensions (Grammarly, password managers, React DevTools) add measurable overhead to first paint | Profile in a clean browser profile (Chrome guest mode or Incognito with no extensions) | Varies — Grammarly alone can add 100ms+ to LCP |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Source maps publicly accessible (see Pitfall 1) | Full TypeScript source, internal service URLs, and string literals from `.env` visible to anyone | `hideSourceMaps: true` + `deleteSourcemapsAfterUpload: true` in `withSentryConfig` |
| Sentry DSN exposed as `NEXT_PUBLIC_SENTRY_DSN` without a tunnel | DSN is visible in client bundle; anyone can send fake events to your Sentry project | The DSN being public is Sentry's designed model (it's a write-only key), but without a tunnel it's also a blocklist magnet; use tunnel route to proxy through your domain |
| Sending PII (usernames, answers) as Sentry event data | GDPR/privacy compliance risk; player game answers and display names are personal data | Configure `beforeSend` to scrub known PII fields; use Sentry's `scrubFields` option; attach user ID (not username) to context |
| Sentry tunnel route without origin validation | Open proxy — anyone can send arbitrary requests to Sentry on your DSN | Validate that the forwarded DSN in the tunnel matches the expected project ID; rate-limit the tunnel route |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Global error boundary shows a full-page crash screen for a recoverable gameroom error | Player loses their game session for an error that could have been caught locally | Two-level boundary strategy: global boundary shows full crash screen; gameroom boundary attempts state recovery via `request_state_sync` and shows minimal inline fallback only if recovery fails |
| Error boundary fallback has no reconnect/retry action | Player sees a dead end; must manually refresh | Gameroom boundary fallback includes a "Rejoin game" button that clears error state and re-emits `request_state_sync` |
| Showing error details (stack trace, error message) to end users | Confusing, alarming, exposes internals | Show a friendly human-readable message; log technical details to Sentry only |
| Error boundary reset strategy not matching Socket.IO lifecycle | Resetting React state without also re-initializing sockets leaves the user with a blank UI that will never update | Error boundary `onReset` must also trigger socket re-initialization, not just React state reset |

---

## "Looks Done But Isn't" Checklist

- [ ] **Sentry install:** Verify all three config files exist — `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` — missing server or edge config means those environments are dark
- [ ] **Source maps:** After `next build`, run `find .next -name "*.map"` — expect zero results; any output means maps are publicly accessible
- [ ] **Tunnel route:** Verify `/api/sentry-tunnel` returns 200 for a test POST; verify Sentry DSN validation is present to prevent SSRF
- [ ] **Error boundary coverage:** Throw a test error inside `useGameEvents` event handler — confirm it does NOT trigger the error boundary (it won't, by design), and confirm Sentry still receives the exception via `unhandledrejection`
- [ ] **Socket error capture:** Disconnect network mid-game — confirm Sentry receives a `connect_error` event with room context attached; confirm only one event fires per disconnection episode (deduplication guard working)
- [ ] **Bundle analyzer dev-only:** Run `next build` with no `ANALYZE` env var — confirm no `client.html` or `server.html` report files in `.next/`
- [ ] **`why-did-you-render` exclusion:** If used, confirm production bundle does not contain `whyDidYouRender`; check with `grep -r "whyDidYouRender" .next/static/`
- [ ] **Sentry user context:** Log in as a test user, trigger an error, confirm Sentry event shows user ID and current room ID in context — not just anonymous
- [ ] **`tracesSampleRate`:** Confirm it is NOT set to `1.0` in production config; 0.05–0.1 is appropriate for this real-time app
- [ ] **Error boundary reset tested:** Trigger a render crash, click the recovery button, confirm sockets reconnect and game state is restored without a full page reload

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Source maps already deployed publicly | LOW | Redeploy with `hideSourceMaps: true`; rotate any secrets that appeared as string literals in source |
| Sentry quota exhausted from event flood | LOW | Add `beforeSend` filter and reduce `tracesSampleRate`; redeploy; Sentry quota resets monthly |
| `why-did-you-render` shipped to production | LOW | Remove import, redeploy; no persistent damage beyond user-facing console noise |
| Error boundary swallowing socket errors (undiscovered bugs) | MEDIUM | Audit Sentry for gaps: compare browser console error log to Sentry events; add explicit `captureException` calls in socket error handlers |
| Tunnel route open SSRF proxy discovered | MEDIUM | Add DSN host validation immediately, redeploy; review Sentry project for unexpected events from unknown sources |
| `@next/bundle-analyzer` breaking `withSentryConfig` composition | LOW | Correct wrapper order, verify source maps upload resumes in next deployment |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Source maps publicly accessible | Phase 1 — Sentry install | `find .next -name "*.map"` returns empty after production build |
| No tunnel route — events blocked by ad blockers | Phase 1 — Sentry install | POST to `/api/sentry-tunnel` succeeds; Sentry receives test event from browser with ad blocker enabled |
| Socket.IO errors not captured (boundary gap) | Phase 2 — error boundaries | Disconnect test confirms Sentry receives socket error with room context |
| Error boundary not handling Socket.IO lifecycle on reset | Phase 2 — error boundaries | Recovery button test: game resumes without full page reload |
| `why-did-you-render` in production | Phase 3 — profiling | `grep -r "whyDidYouRender" .next/static/` returns empty |
| Bundle analyzer enabled in production | Phase 3 — profiling | No `client.html`/`server.html` in `.next/` on production build |
| Event flood exhausting Sentry quota | Phase 1 — Sentry config | `tracesSampleRate` is 0.1 or lower; `beforeSend` filter documented and tested |
| PII in Sentry events | Phase 1 — Sentry config | Verify test event scrubs player answers and display names |

---

## Sources

- Training knowledge: `@sentry/nextjs` v8 documentation patterns (August 2025 cutoff) — MEDIUM confidence
- Codebase analysis: `.planning/codebase/ARCHITECTURE.md`, `STACK.md`, `CONCERNS.md` — HIGH confidence (direct source)
- Codebase analysis: `.planning/milestones/v1.1-phases/05-codebase-audit/FINDINGS.md` — HIGH confidence (direct source)
- React error boundary semantics (render-time only): React 19 documentation — HIGH confidence (stable, well-documented behavior)
- `@next/bundle-analyzer` dev-only pattern: Community convention, Next.js docs — MEDIUM confidence
- Socket.IO `connect_error` event API: Socket.IO client v4 documentation — HIGH confidence (stable API)
- Sentry tunnel SSRF risk: Sentry documentation guidance on tunnel validation — MEDIUM confidence (verify against current docs)

**Note:** WebSearch and WebFetch were unavailable during this research session. All findings should be validated against current Sentry SDK release notes and Next.js 16 changelog before Phase 1 execution. Pay particular attention to any breaking changes in `@sentry/nextjs` v8+ regarding React 19 compatibility and App Router instrumentation file locations.

---
*Pitfalls research for: Sentry + error boundaries + performance profiling on Next.js 16 / React 19 real-time app*
*Researched: 2026-03-17*
