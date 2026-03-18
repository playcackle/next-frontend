# Stack Research

**Domain:** Sentry error monitoring + Next.js/React performance profiling
**Researched:** 2026-03-17
**Confidence:** MEDIUM — training knowledge cutoff August 2025; network verification tools unavailable during research. Version pins marked with confidence levels. Verify all versions against npm registry before installing.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@sentry/nextjs` | `^8.x` (verify latest 8.x) | Error capture, performance tracing, App Router integration | Official Sentry SDK for Next.js. v8 added first-class App Router support via `instrumentation.ts`. Single package replaces `@sentry/react` + `@sentry/node` — handles both Client and Server Components automatically. The `sentry-cli` wizard (`npx @sentry/wizard@latest -i nextjs`) is the recommended install path as it writes `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and patches `next.config.mjs` correctly. |
| `@next/bundle-analyzer` | `^16.x` (match Next.js version) | Webpack bundle visualization | Official Next.js package, maintained in the Next.js monorepo. Version must match `next` version. Wraps `webpack-bundle-analyzer` with a Next.js-aware config wrapper. No separate `webpack-bundle-analyzer` install needed. |
| `web-vitals` | `^4.x` (verify latest) | Programmatic Core Web Vitals measurement (LCP, CLS, INP, FCP, TTFB) | Google's official CWV library. Sentry SDK already instruments CWV automatically when `tracesSampleRate` is set — but `web-vitals` enables custom logging and baselining independently of Sentry. Used in `app/layout.tsx` to log vitals before Sentry is wired. INP replaced FID as a Core Web Vital in March 2024; `web-vitals` v4+ captures INP correctly. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@welldone-software/why-did-you-render` | `^8.x` (verify React 19 compat) | React re-render diagnostics | Dev-only. Patches React to log unnecessary re-renders with component name and changed props. Best applied to gameroom components (`UnifiedMessages`, `LeaderBoard`, `AnswerReveal`) that receive high-frequency Socket.IO updates. **Verify React 19 compatibility before installing** — v8 targets React 18; React 19 compatibility was not confirmed as of training cutoff. Use React DevTools Profiler as the fallback if WDYR does not support React 19. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| React DevTools Profiler | Record render flamegraphs, identify wasted renders, measure commit durations | Browser extension — no npm install. Use "Record why each component rendered" in Profiler settings. This is the primary re-render diagnostic tool. Fully supports React 19. Always available. |
| `@sentry/wizard` | Automated Sentry setup | Run `npx @sentry/wizard@latest -i nextjs` — do NOT manually copy config. The wizard writes all required files and patches `next.config.mjs` correctly for App Router. Requires a Sentry DSN before running. |
| Chrome DevTools Performance tab | Socket event overhead profiling, JS execution timelines | No install. Use "Performance" tab to record a game round and inspect `socket.io` event handler durations in the flame chart. |
| Next.js built-in bundle stats | `ANALYZE=true next build` output | Enabled by `@next/bundle-analyzer` wrapper in `next.config.mjs`. Produces two interactive treemaps: client bundle and server bundle. No additional tooling needed. |

---

## Installation

```bash
# Error monitoring (run wizard instead of manual install)
npx @sentry/wizard@latest -i nextjs
# The wizard installs @sentry/nextjs and patches next.config.mjs automatically.

# If manual install is preferred (not recommended):
npm install @sentry/nextjs

# Bundle analysis
npm install -D @next/bundle-analyzer

# Web Vitals measurement
npm install web-vitals

# Re-render diagnostics (dev only, verify React 19 compat first)
npm install -D @welldone-software/why-did-you-render
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@sentry/nextjs` (wizard install) | Manual `@sentry/react` + `@sentry/node` | Never for Next.js App Router — the split approach predates the unified Next.js SDK and does not handle Server Components or edge runtime correctly. |
| `@next/bundle-analyzer` | `webpack-bundle-analyzer` directly | Only if not using Next.js — `@next/bundle-analyzer` wraps it with correct Next.js webpack config, making standalone use unnecessary. |
| React DevTools Profiler | `react-addons-perf` | Never — `react-addons-perf` is deprecated since React 16. React DevTools Profiler is the current canonical tool. |
| `web-vitals` v4 | `@vercel/analytics` | Use Vercel Analytics only if deployed on Vercel and want dashboard UI without code changes. This project uses `output: 'standalone'` for Docker, so Vercel Analytics is out of scope. |
| `@welldone-software/why-did-you-render` | Custom `React.memo` + `useRef` logging | WDYR is faster to set up during profiling sessions. Use manual memo + logging only if WDYR is incompatible with React 19. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@sentry/react` + `@sentry/node` (separate) | Does not handle Next.js App Router, Server Components, or edge runtime. Requires manual wiring of two SDKs. | `@sentry/nextjs` (single unified SDK) |
| `react-addons-perf` | Deprecated since React 16. No React 17+ support. | React DevTools Profiler browser extension |
| `lighthouse-ci` as primary CWV measurement | Heavy CI setup, measures synthetic lab data not real-user data. Useful supplement but not a substitute for `web-vitals` RUM data. | `web-vitals` for real-user measurement; Lighthouse DevTools for local audits |
| Sentry `tracesSampleRate: 1.0` in production | 100% transaction sampling creates high event volume and Sentry quota exhaustion. Fine for initial profiling but must be lowered before sustained production use. | `tracesSampleRate: 0.1` (10%) for production, `1.0` only during profiling sessions |
| `source-map-explorer` | Redundant with `@next/bundle-analyzer` already in the stack. Two bundle tools produce confusing overlap. | `@next/bundle-analyzer` only |

---

## Stack Patterns by Variant

**For App Router (this project):**
- Sentry `instrumentation.ts` at project root hooks into Next.js's instrumentation lifecycle for server-side init
- `sentry.client.config.ts` initializes Sentry in the browser
- Error boundaries use `Sentry.ErrorBoundary` wrapper component (re-exports React's `ErrorBoundary` with automatic event capture)
- Use `Sentry.setUser()` after Supabase auth resolves, not in middleware (middleware runs on edge — use `sentry.edge.config.ts`)

**For gameroom re-render profiling:**
- Apply `why-did-you-render` only to components that receive Socket.IO-driven prop/atom updates: `UnifiedMessages`, `LeaderBoard`, `AnswerReveal`, `SlotGrid`
- Use React DevTools Profiler's "Ranked" chart view — sorts components by render time, fastest path to identifying hotspots
- Profile during a live game round (not idle state) to capture high-frequency update scenarios

**For bundle analysis:**
- Run `ANALYZE=true npm run build` — produces two browser tabs (client + server treemaps)
- Focus on client bundle — server bundle does not affect user-perceived performance
- Look for duplicated dependencies (e.g., multiple React versions, duplicated lodash) and unexpectedly large chunks

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@sentry/nextjs@8.x` | `next@^16`, `react@19` | MEDIUM confidence — v8 was current as of mid-2025. Verify `^8.x` is still latest stable before installing. The wizard auto-selects the correct version. |
| `@next/bundle-analyzer@^16.x` | `next@^16.0.10` | HIGH confidence — version must match `next` major version. Installing `@next/bundle-analyzer@16` against `next@16` is the documented pattern. |
| `web-vitals@^4.x` | `react@19`, browsers supporting INP | HIGH confidence — v4 is stable, INP-aware, no React dependency (pure browser API). |
| `@welldone-software/why-did-you-render@^8.x` | `react@18` confirmed, `react@19` unverified | LOW confidence for React 19 — v8 targets React 18. Check GitHub issues for React 19 support before installing. If incompatible, skip WDYR and use React DevTools Profiler exclusively. |
| `@sentry/nextjs` + `next-auth@^4.x` | Compatible, no known conflicts | next-auth v4 uses Pages Router patterns for its own routes (`/api/auth/[...nextauth]`) — Sentry instrumentation does not conflict with this. |

---

## Sentry Configuration Notes for This Project

These are integration-specific decisions driven by the existing codebase:

**User context enrichment:**
The app uses Supabase auth. After `supabase.auth.getUser()` resolves, call `Sentry.setUser({ id: user.id, email: user.email })`. The correct location is inside the auth provider or a top-level Client Component — not in middleware or Server Components (where `Sentry.setUser` is not available).

**Game room context:**
Use `Sentry.setContext('gameroom', { roomId, roundNumber, phase })` inside `useGameEvents` or `useGameState` when game state atoms update. This enriches every error event with current game context.

**Socket.IO errors:**
Socket.IO errors (connection failures, emit errors) are not automatically captured. Add manual `Sentry.captureException()` calls in the catch blocks of `useGameSocket` and `useChatSocket`.

**Replay integration:**
Sentry Session Replay (`replaysSessionSampleRate`, `replaysOnErrorSampleRate`) is supported by `@sentry/nextjs` but should be explicitly opted into — it has significant bundle size impact (~50KB gzipped) and privacy implications. Omit from initial install; evaluate separately.

---

## Sources

- Training knowledge (cutoff August 2025) — Sentry v8 App Router integration, `@next/bundle-analyzer` patterns — MEDIUM confidence
- `@sentry/wizard` install flow and `instrumentation.ts` pattern — MEDIUM confidence (verify at https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- `web-vitals` v4 INP support — HIGH confidence (Google announced INP as Core Web Vital March 2024, v4 is stable)
- `@welldone-software/why-did-you-render` React 19 status — LOW confidence (verify at https://github.com/welldone-software/why-did-you-render before installing)
- `@next/bundle-analyzer` version-matching convention — HIGH confidence (documented Next.js pattern)

---

*Stack research for: Sentry error monitoring + Next.js performance profiling*
*Researched: 2026-03-17*
