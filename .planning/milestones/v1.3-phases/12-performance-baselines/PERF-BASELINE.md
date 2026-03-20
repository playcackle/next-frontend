# Performance Baseline — v1.3 Milestone

**Measured:** 2026-03-18
**Phase:** 12 — Performance Baselines
**Requirements covered:** PERF-01, PERF-02, PERF-03, PERF-04, PERF-05

---

## PERF-02 — Bundle Size

**Tool:** `@next/bundle-analyzer` (`npm run analyze`)

| Chunk | Size | Contents |
|-------|------|----------|
| `216-f04e8ac3.js` | 1.61 MB | next/dist internals + Sentry |
| `main-d1ea4bf6.js` | 1.05 MB | App entry |
| `5191-6c3049.js` | 645 KB | Supabase |

**Total initial JS (top 3 chunks):** ~3.3 MB uncompressed

**Candidates for splitting / removal:**
- Sentry bundled into the largest chunk alongside next/dist — potential for lazy loading
- Supabase at 645 KB is large; consider lazy-loading auth client outside the critical path

---

## PERF-03 — Core Web Vitals

**Tool:** `WebVitalsLogger` (console output during `npm run dev`)
**Pages measured:** Home (`/`)

| Metric | Value | Rating |
|--------|-------|--------|
| LCP | 4324 ms | Poor (> 4000ms) |
| FCP | 500 ms | Good (< 1800ms) |
| TTFB | 367 ms | Good (< 800ms) |
| FID | 3.4 ms | Good |
| INP | not captured | — |

> **Note:** INP requires a user interaction during the measurement window. FID is deprecated in favour of INP but was still reported.

**Key finding:** LCP at 4324ms is the primary bottleneck. FCP and TTFB are healthy — server responds quickly but the largest contentful element loads late.

---

## PERF-01 — React Re-render Counts

**Tool:** React `<Profiler>` callbacks (`[Profiler]` console output during active gameplay)
**Trigger:** `lobby_tick` events at ~1 Hz

| Component | Avg actual (ms) | Avg base (ms) | Re-renders / tick | Notes |
|-----------|-----------------|---------------|-------------------|-------|
| UnifiedMessages | ~0.18 ms | ~0.18 ms | 1 | Fast; actual = base — no wasted renders |
| SlotGrid | ~0.78 ms | ~0.85 ms | 1 | Fast; slight memoisation savings visible |
| Leaderboard | — | — | 0 | No re-renders during active play; only updates on round-boundary score changes |

**Key finding:** All three components are fast (< 1ms per render). No re-render hotspots identified.

> **Note:** WDYR was found incompatible with Next.js 16 App Router internals (crashes router hook ordering). React Profiler callbacks provided equivalent render-timing data. WDYR files removed from codebase.

---

## PERF-04 — Socket Event Handling Overhead

**Tool:** `performance.now()` probes in `useGameEvents` (`[PerfProbe]` console output)
**Event measured:** `lobby_tick` (~1 Hz during active game)

| Event | Typical handler time | Frequency | Assessment |
|-------|---------------------|-----------|------------|
| `lobby_tick` | 0.1 – 0.3 ms | ~1 Hz | Negligible overhead |

**Key finding:** Socket event handling is not a performance concern. The `lobby_tick` handler completes in < 0.3ms at 1Hz.

---

## PERF-05 — Impact / Effort Summary

Ordered by impact (highest first):

| # | Finding | Req | Impact | Effort | Phase 13 action? |
|---|---------|-----|--------|--------|-----------------|
| 1 | LCP 4324ms — poor rating, well above 2500ms good threshold | PERF-03 | High | Medium | Yes |
| 2 | Initial JS ~3.3MB — Sentry + next/dist in largest chunk, Supabase 645KB | PERF-02 | Medium | Medium | Yes — evaluate Supabase lazy-load |
| 3 | UnifiedMessages re-renders every lobby_tick (1Hz, ~0.18ms) | PERF-01 | Low | Low | Optional |
| 4 | SlotGrid re-renders every lobby_tick (1Hz, ~0.78ms) | PERF-01 | Low | Low | Optional |
| 5 | Socket handling overhead (~0.2ms at 1Hz) | PERF-04 | None | — | No action needed |
| 6 | Leaderboard re-renders | PERF-01 | None | — | No action needed — 0 renders during active play |

**Phase 13 priority targets:**
1. LCP optimisation (high impact, clearest gap from good threshold)
2. Bundle size — evaluate Supabase lazy-loading (medium impact)
