# Phase 13: Performance Fixes - Research

**Researched:** 2026-03-18
**Domain:** Next.js LCP render delay, bundle size reduction, dynamic imports, Supabase lazy loading
**Confidence:** HIGH

---

## Summary

Phase 13 fixes the three highest-impact bottlenecks measured in Phase 12. All three targets are data-driven: they are derived from PERF-BASELINE.md, not assumptions. The two priority targets are LCP 4324ms (poor) and initial JS bundle ~3.3MB. A third fix — the `useUser()` Supabase call inside UnifiedMessages causing redundant client auth work in the gameroom — rounds out the three.

The baseline shows TTFB=367ms and FCP=500ms are healthy. LCP=4324ms is a **render delay** problem: the largest content element (the "CACKLE" h1 text block) is present in the server-rendered HTML but is delayed painting to screen. The render delay is ~3824ms after FCP — a strong indicator of main-thread blocking by client hydration work (Supabase auth calls, heavy JS execution, CSS opacity transitions). Fixing this requires diagnosing and removing whatever blocks first paint of the LCP element, which most likely involves either the parallel Supabase calls in `Header.tsx`/`SentryUserSync.tsx` executing on hydration, or CSS opacity/transform on the hero text.

The Supabase bundle fix (645KB) is achieved by deferring the Supabase client initialisation for components that don't need it during initial paint. The `Header` component and `SentryUserSync` both call `createClient()` synchronously, pulling 645KB of Supabase SDK into the main bundle on every route. Lazy-loading these via `next/dynamic` moves Supabase out of the critical path.

**Primary recommendation:** Fix render delay (LCP) by diagnosing and eliminating CSS opacity transitions on the hero section and ensuring Supabase auth calls in Header do not block the initial paint. Reduce bundle size by moving Header and SentryUserSync to dynamic imports. Fix UnifiedMessages to remove its `useUser()` call (it only uses `user.id` for styling and can receive it as a prop or from a lightweight atom).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-06 | Top 3 highest-impact bottlenecks fixed and verified against baselines | Bottlenecks identified from PERF-BASELINE.md: (1) LCP 4324ms render delay — fix CSS opacity + defer header hydration; (2) Bundle ~3.3MB / Supabase 645KB — dynamic import Header and SentryUserSync; (3) UnifiedMessages useUser() — remove Supabase dependency from gameroom hot path |
</phase_requirements>

---

## Bottleneck Identification (from PERF-BASELINE.md)

These are the three bottlenecks Phase 13 MUST fix. They are named here so the planner can reference them verbatim.

| # | Bottleneck | Baseline Metric | Target |
|---|------------|-----------------|--------|
| 1 | LCP render delay — "CACKLE" h1 text paints 3824ms after FCP | LCP 4324ms (poor) | LCP < 2500ms (good threshold) |
| 2 | Supabase 645KB in initial JS bundle — pulled in by Header + SentryUserSync | ~3.3MB initial JS (top 3 chunks) | Reduce initial JS, move Supabase to separate chunk |
| 3 | `useUser()` Supabase client call inside UnifiedMessages — redundant auth work during active gameplay | Low direct perf cost but increases Supabase surface in gameroom bundle | Remove dependency; pass user ID via prop or lightweight atom |

### Why These Three

**Bottleneck 1** is the single highest-impact fix: LCP 4324ms is "poor" (> 4000ms), far from the 2500ms "good" threshold. TTFB and FCP are healthy, meaning the server is fast but something blocks the browser from painting the LCP element.

**Bottleneck 2** is medium impact: Supabase at 645KB is the largest single library in the bundle. It is imported in `Header.tsx` (via `useUser()` → `createClient()`), `SentryUserSync.tsx`, and `useRealtimeLobbies.ts`. Moving `Header` and `SentryUserSync` to dynamic imports removes Supabase from the main entry chunk.

**Bottleneck 3** is low-cost, high-signal: `UnifiedMessages.tsx` imports `useUser()` to get `user.id` for message ownership styling. This is a dependency on the full Supabase client in the gameroom's hot-render path. Replacing it with a lightweight alternative (prop or Jotai atom) removes this coupling and is a clean architectural improvement.

---

## LCP Root Cause Analysis

### Profile: Fast server, slow paint

| Metric | Value | Interpretation |
|--------|-------|----------------|
| TTFB | 367ms | Server responds quickly |
| FCP | 500ms | First content paints quickly — HTML is rendering |
| LCP | 4324ms | LCP element delayed 3824ms after FCP |
| LCP element (inferred) | `<h1>` "CACKLE" text or hero section | Largest text block in viewport on home page |

A render delay of ~3824ms after FCP means the browser has already painted something, but the LCP element is blocked. This is NOT a resource load problem — it is a **render blocking** or **content replacement** problem.

### Likely Causes (in order of confidence)

**Cause A — CSS opacity/animation on hero text (HIGH confidence)**
`globals.css` contains `@keyframes flicker` and the synthwave background uses CSS animations. The hero h1 uses `styles.neonText` / `styles.neonTextPink` class names from `page.module.css`. If these classes start with `opacity: 0` (for fade-in), the browser cannot record LCP until the element is visible. Even if it's a short transition, the LCP timestamp records when the element first reaches `opacity > 0`.

The `SynthwaveBackground` component passes `animated={false}` from `layout.tsx`, avoiding grid animation. But the neon text classes in `page.module.css` may still use animation. **This must be checked first** — it is the most common cause of this exact symptom pattern.

**Cause B — Header hydration delay with Supabase auth (MEDIUM confidence)**
`Header.tsx` is a `'use client'` component that calls `useUser()` on mount. `useUser()` calls `supabase.auth.getUser()` — an async network call to Supabase. During this call, the Header renders with `loading: true`. The content area (`children`) is inside `<Suspense fallback={<Progress />}>`. If React is hydrating Header eagerly and the Supabase call blocks JS execution, it delays subsequent renders of sibling components including the hero section.

More directly: `useUser()` calls `router.refresh()` on auth state change. Combined with `SentryUserSync` also calling `createClient().auth.getUser()`, there are two simultaneous Supabase auth calls firing on every page load.

**Cause C — Synchronous Supabase client initialisation (MEDIUM confidence)**
`createClient()` in `src/lib/supabase/client.ts` is a singleton that initialises `createBrowserClient()`. This is called synchronously by both `Header` and `SentryUserSync` during hydration. The `@supabase/ssr` client initialisation may involve non-trivial synchronous work (reading cookies, setting up storage) that blocks the main thread briefly but repeatedly.

**Cause D — Large JS parse/execute time (MEDIUM confidence)**
3.3MB of uncompressed JS (main chunk 1.05MB, next/dist+Sentry 1.61MB) takes substantial parse time on first load. Even with compression (~250-350KB gzipped), the parse and execution time contributes to render delay. This is related to Bottleneck 2.

---

## Standard Stack

### Core Fixes
| Technique | Source | Purpose | Why Standard |
|-----------|--------|---------|--------------|
| CSS opacity investigation | Browser DevTools / page.module.css | Identify if neon text starts at opacity 0 | Root cause must be confirmed before fixing |
| `next/dynamic` with `ssr: false` | `next/dynamic` (built into Next.js) | Move Header and SentryUserSync to dynamic imports, removing Supabase from main bundle | Official Next.js lazy loading API — zero new dependencies |
| Dynamic `import()` for libraries | Browser native + Next.js | Defer `createClient()` call for non-critical auth work | Standard pattern for reducing initial JS |
| Jotai atom for current user ID | `jotai` (already installed) | Replace `useUser()` in UnifiedMessages with a lightweight atom | No new dependency; uses existing state layer |

### No New Dependencies Required
All three fixes use APIs already present in the project:
- `next/dynamic` — built into `next` (already installed)
- `jotai` — already installed (v2.15.2)
- CSS changes — no library needed

**Installation:** No new packages required.

---

## Architecture Patterns

### Fix 1: Investigate and Remove LCP-Blocking CSS

**Step 1 — Identify the LCP element precisely**
Open Chrome DevTools → Performance tab → record page load → look for "LCP" annotation. Alternatively, check the WebVitalsLogger console output: the `useReportWebVitals` hook in the existing `WebVitalsLogger.tsx` does not expose the LCP element. Use Chrome DevTools Network tab or the Performance Insights panel to identify which DOM element is the LCP candidate.

The primary suspects are:
- `<h1>` with `styles.neonText` + `styles.neonTextPink` in `page.tsx`
- The `SynthwaveBackground` sun or grid element (less likely — it's CSS-only, no JS dependency)

**Step 2 — Check for opacity animations**
Read `src/app/page.module.css` — look for `opacity`, `@keyframes`, `animation`, `transition` on `.title`, `.neonText`, `.neonTextPink`, `.heroSection`. If any class starts with `opacity: 0`, this is the primary LCP blocker.

**Fix:** If opacity animation found:
```css
/* Before (likely) */
.neonText {
  opacity: 0;
  animation: fadeIn 1s ease forwards;
}

/* After (LCP fix) */
.neonText {
  opacity: 1; /* Remove animation blocking visibility */
}
```
Or: ensure the LCP element starts at `opacity: 1` and transitions only secondary decorative elements.

**Step 3 — If CSS is not the blocker**
Investigate Header hydration blocking. The pattern is:
```
Page load → HTML parsed → Header hydrates → useUser() fires → supabase.auth.getUser() network round trip →
router.refresh() called → page re-renders → LCP element re-painted → LCP timestamp recorded
```
If `router.refresh()` triggers a re-render that re-paints the LCP element, the LCP timestamp records the re-paint time, not the initial paint time.

**Fix for router.refresh() causing LCP re-measure:**
Remove or defer `router.refresh()` calls in `useUser()`. The `onAuthStateChange` callback calls `router.refresh()` on `SIGNED_IN` / `SIGNED_OUT`. On initial page load, this fires as part of the auth state initialization sequence. Consider whether `router.refresh()` is needed on every auth state change or only explicit user actions.

### Fix 2: Dynamic Import Header and SentryUserSync (Bundle Size)

**What:** Move `Header` and `SentryUserSync` to `next/dynamic` imports in `layout.tsx`. This prevents Supabase from being included in the main entry chunk.

**Constraint:** `Header` renders immediately in the visible UI — do NOT use `ssr: false`. Use `ssr: true` (default) to preserve server-rendered HTML. The goal is code splitting, not disabling SSR.

```typescript
// Source: nextjs.org/docs/app/guides/lazy-loading (verified 2026-03-18)
// src/app/layout.tsx — replace static imports with dynamic
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/header'));
const SentryUserSync = dynamic(() => import('@/components/SentryUserSync').then(m => ({ default: m.SentryUserSync })));
```

**Why this works:** `next/dynamic` causes webpack to split `Header` and its transitive dependencies (including `@supabase/ssr` via `useUser()`) into a separate chunk. This chunk loads after the main entry chunk, reducing what the browser must parse before first render.

**Important caveat from official docs (verified 2026-03-18):**
> When a Server Component dynamically imports a Client Component, automatic code splitting is currently not supported.

`layout.tsx` is a Server Component. When it dynamically imports `Header` (a Client Component), the code split may not work as expected. **This must be tested** — verify with `npm run analyze` before and after the change that the Supabase chunk moves out of the main entry bundle. If the code split doesn't apply, `SentryUserSync` (which is inside `Provider`, a Client Component) may be the better target.

**Alternative approach — dynamic import inside Provider (Client Component):**
Since `layout.tsx` is a Server Component and the caveat applies, the more reliable pattern is to move the dynamic import into `Provider` (a Client Component):

```typescript
// src/app/provider.tsx — dynamic imports for non-critical client components
'use client';
import dynamic from 'next/dynamic';
import { Provider as JotaiProvider } from 'jotai';
import { PerformanceInitializer } from '@/components/performance-initializer';
import { PerformanceModal } from '@/components/performance-modal';

// Defer Supabase-dependent components — they don't affect initial render
const SentryUserSync = dynamic(
  () => import('@/components/SentryUserSync').then(m => ({ default: m.SentryUserSync })),
  { ssr: false } // No SSR needed — sets Sentry user context only
);

export const Provider = ({ children }) => (
  <JotaiProvider>
    <PerformanceInitializer />
    <SentryUserSync /> {/* Now lazy loaded */}
    <PerformanceModal />
    {children}
  </JotaiProvider>
);
```

`SentryUserSync` with `ssr: false` is safe because it only calls `supabase.auth.getUser()` and registers a Sentry user — neither operation is needed during SSR.

**Verify improvement:**
```bash
npm run analyze  # Before and after — confirm 5191-6c3049.js (Supabase 645KB) no longer in main bundle
```

### Fix 3: Remove `useUser()` from UnifiedMessages

**What:** `UnifiedMessages.tsx` calls `useUser()` to get `user.id` for identifying "own message" styling. This pulls in the full Supabase client into the gameroom render path.

**Why it matters:** Every re-render of UnifiedMessages (1Hz, triggered by `lobby_tick`) evaluates `useUser()`. This subscribes to Supabase auth state changes on an already-hot component. More importantly, it increases the gameroom bundle's Supabase surface.

**Fix option A — Pass userId as prop (simplest):**
The parent component that renders `UnifiedMessages` has access to the game state. Pass `userId` as a prop:

```typescript
// UnifiedMessages.tsx
type Props = { currentUserId?: string };
export default function UnifiedMessages({ currentUserId }: Props) {
  // remove: const { user } = useUser();
  // use: currentUserId instead of user?.id
}
```

**Fix option B — Add `currentUserIdAtom` to gameAtoms (cleanest):**
Add a derived atom that stores the current user's ID, set once during room join:

```typescript
// In gameAtoms.ts or a new atom
export const currentUserIdAtom = atom<string | null>(null);
// Set during room join flow (where user.id is already known)
```

Then `UnifiedMessages` uses `useAtomValue(currentUserIdAtom)` — no Supabase dependency.

**Recommendation:** Option B is cleaner architecturally (no prop threading) and consistent with the Jotai-based state pattern already used in the gameroom.

### Anti-Patterns to Avoid

- **`ssr: false` on Header:** Header renders navigation and is visible immediately — disabling SSR causes a flash of missing content.
- **Removing router.refresh() blindly:** First confirm it is actually causing LCP re-measure by checking DevTools. If auth state on the home page depends on server-side session data, removing `router.refresh()` may cause stale state.
- **Measuring LCP with WebVitalsLogger in dev and assuming it matches production:** Dev server adds overhead. Measure after `next build && next start` for accurate LCP numbers.
- **Fixing Supabase bundle before confirming the dynamic import split actually works:** The Next.js caveat (Server Component dynamic import of Client Component may not code-split) means the fix must be verified with `npm run analyze` before counting it as complete.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code splitting for Supabase | Manual webpack chunk config | `next/dynamic` | next/dynamic handles all chunk relationship bookkeeping; manual config is brittle with `withSentryConfig` wrapper |
| User identity in components | Re-implement auth check | Prop or Jotai atom | Jotai is already the state layer; adding another `useUser()` call is redundant |
| LCP element identification | Custom PerformanceObserver | Chrome DevTools Performance Insights panel | DevTools panel shows LCP element visually with timestamp breakdown |

---

## Common Pitfalls

### Pitfall 1: Confirming LCP element identity before fixing
**What goes wrong:** Developer assumes h1 is the LCP element, adds fixes, re-measures — no improvement because the actual LCP element was something else (e.g., the synthwave sun background element, or a loaded image).
**Why it happens:** LCP is determined by the browser based on element size in viewport. On a text-only page the largest text block wins, but background divs styled with `background-image` or large CSS shapes can also qualify.
**How to avoid:** Use Chrome DevTools → Lighthouse or Performance panel to identify the exact LCP element before writing any code. The `debugbear.com/test/page-speed` tool also shows LCP element.
**Warning signs:** Fix applied, re-measured, LCP unchanged.

### Pitfall 2: Dynamic import of Client Component from Server Component may not split bundle
**What goes wrong:** Developer adds `dynamic(() => import('...'))` in `layout.tsx` (Server Component), runs `npm run analyze`, Supabase chunk is still in main bundle.
**Why it happens:** Official Next.js docs (verified 2026-03-18): "When a Server Component dynamically imports a Client Component, automatic code splitting is currently not supported."
**How to avoid:** Place dynamic imports inside Client Components (`Provider.tsx`), not Server Components. Test with `npm run analyze` before and after.
**Warning signs:** Bundle treemap shows Supabase chunk unchanged after applying dynamic import in `layout.tsx`.

### Pitfall 3: LCP measured in dev mode vs production
**What goes wrong:** Developer fixes CSS, re-measures in `npm run dev`, sees 4000ms → 1200ms improvement. Ships. Production measurement is 3800ms.
**Why it happens:** Dev server has higher JS execution overhead (React DevTools hooks, source maps, no minification). LCP is heavily influenced by JS parse/execute time which is much slower in dev.
**How to avoid:** Final LCP verification MUST use `next build && next start` — not `npm run dev`. Record both before and after with the same measurement mode.
**Warning signs:** Large discrepancy between dev and build measurements.

### Pitfall 4: router.refresh() causing LCP element re-measure
**What goes wrong:** The LCP element renders at first paint, but `useUser()` triggers `router.refresh()` during auth state initialization. This causes a server fetch and re-render. If the LCP element re-renders (even identically), the browser may record the second paint timestamp as the LCP time.
**Why it happens:** `router.refresh()` triggers a full server component re-fetch. On the home page, this re-fetches `fetchGamerooms()` and `supabase.auth.getUser()`. The resulting re-render re-paints the hero section.
**How to avoid:** Check if `router.refresh()` fires on initial page load. If yes, consider gating it: only call on explicit user-initiated sign-in/out, not on `onAuthStateChange` during initial session restore.
**Warning signs:** DevTools Performance timeline shows two sequential renders of the hero section; LCP timestamp matches the second render.

### Pitfall 5: CSS `@radix-ui/themes/styles.css` blocking paint
**What goes wrong:** `layout.tsx` imports `@radix-ui/themes/styles.css` which is a large stylesheet. If it contains render-blocking rules, it delays all paint including the LCP element.
**Why it happens:** Large CSS files imported in `layout.tsx` block rendering until fully parsed. Radix UI Themes ships ~100KB of CSS.
**How to avoid:** Check if `@radix-ui/themes/styles.css` import can be deferred or split. At minimum, verify this is not a `@import` chain (which creates waterfall blocking). It's a direct import so it should be fine — but verify in DevTools Network tab that CSS load time is not on the critical path.
**Warning signs:** Network tab shows `radix-ui themes styles.css` blocking LCP paint.

---

## Code Examples

### Fix 1a: Check page.module.css for opacity animation (investigation step)
```
Action: Read src/app/page.module.css — look for:
- opacity: 0 on .neonText, .neonTextPink, .title, .heroSection
- @keyframes with opacity
- animation properties on hero elements
If found: set initial opacity to 1; keep animation for decorative secondary elements only.
```

### Fix 1b: Remove or defer router.refresh() in useUser
```typescript
// Source: src/hooks/useUser.ts (current)
// Current problematic pattern — router.refresh() fires on SIGNED_IN during initial load
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    router.refresh(); // This may trigger LCP re-measure
  }
});

// Proposed fix — only refresh on explicit sign-in/out, not initial session restore
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
  // INITIAL_SESSION fires on page load; SIGNED_IN fires on explicit login
  // Only refresh on explicit user actions, not passive session restore
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    // Consider: is router.refresh() needed here? Does the home page
    // show different server-fetched content before vs after auth?
    // If yes, keep it. If no, remove it.
    router.refresh();
  }
});
```

### Fix 2: Dynamic import SentryUserSync in Provider (verified pattern)
```typescript
// Source: nextjs.org/docs/app/guides/lazy-loading (verified 2026-03-18)
// src/app/provider.tsx
'use client';

import dynamic from 'next/dynamic';
import { Provider as JotaiProvider } from 'jotai';
import { PerformanceInitializer } from '@/components/performance-initializer';
import { PerformanceModal } from '@/components/performance-modal';

// ssr: false is safe — SentryUserSync only sets Sentry user context, no SSR value
const SentryUserSync = dynamic(
  () => import('@/components/SentryUserSync').then((m) => ({ default: m.SentryUserSync })),
  { ssr: false }
);

type Props = { children?: React.ReactNode };

export const Provider = ({ children }: Props) => (
  <JotaiProvider>
    <PerformanceInitializer />
    <SentryUserSync />
    <PerformanceModal />
    {children}
  </JotaiProvider>
);
```

### Fix 3: Add currentUserIdAtom to gameAtoms
```typescript
// Source: jotai.pmnd.rs docs + existing gameAtoms.ts pattern
// Add to src/app/gameroom/store/gameAtoms.ts

// Atom to hold the authenticated user's ID for gameroom components
// Set during room join; avoids Supabase dependency in hot-render path
export const currentUserIdAtom = atom<string | null>(null);
```

```typescript
// src/app/gameroom/components/UnifiedMessages.tsx — after fix
import { useAtomValue } from 'jotai';
import { isRoundBreakAtom, unifiedMessagesAtom, currentUserIdAtom } from '../store/gameAtoms';

export default function UnifiedMessages() {
  const currentUserId = useAtomValue(currentUserIdAtom); // replaces useUser()
  // ... rest unchanged, replace user?.id with currentUserId
}
```

### Verification commands
```bash
# Measure LCP before any changes — baseline confirmation
npm run build && npm run start
# Open localhost:3000, open DevTools console, record LCP from WebVitalsLogger
# Expected: ~4324ms (matches PERF-BASELINE)

# After Fix 1 (CSS/render delay):
npm run build && npm run start
# Record new LCP — target < 2500ms

# After Fix 2 (bundle):
npm run analyze
# Expected: 5191-6c3049.js (Supabase 645KB) absent from or reduced in main entry chunks

# After Fix 3 (UnifiedMessages):
npm run build  # Must compile without errors
# Run gameplay session, confirm UnifiedMessages still shows own-message styling correctly
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static import all components | `next/dynamic` for non-critical Client Components | Next.js 13+ App Router | Moves heavy dependencies out of main bundle; critical for libraries like Supabase |
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024 | INP measures sustained interaction latency; FID only measured first input |
| `why-did-you-render` for render investigation | React Profiler callbacks | Already resolved in Phase 12 | WDYR incompatible with Next.js 16; Profiler is the correct tool |

**Project-specific context:**
- WDYR confirmed removed from codebase in Phase 12 (files remain as artifacts but not mounted) — do NOT re-add
- `npm run analyze` uses `--webpack` flag (confirmed in package.json) — Turbopack incompatible with `@next/bundle-analyzer`
- `WebVitalsLogger` already gated to `NODE_ENV=development` — keep this gate; do not add production logging

---

## Open Questions

1. **What is the actual LCP element on the home page?**
   - What we know: LCP=4324ms, FCP=500ms. The page has a neon h1 hero, Supabase auth call, synthwave background.
   - What's unclear: Whether the LCP element is the h1 text, a background element, or something else. Whether CSS opacity is involved.
   - Recommendation: **First task in Phase 13 Plan 01**: use Chrome DevTools Performance Insights to identify the exact LCP element and sub-breakdown (resource load time vs render delay). This determines which fix path to take.

2. **Does router.refresh() in useUser() fire on initial page load?**
   - What we know: `useUser()` calls `onAuthStateChange` which triggers on `SIGNED_IN`. On initial load with an existing session, `SIGNED_IN` may fire as session is restored.
   - What's unclear: Whether Next.js App Router `router.refresh()` during hydration triggers a full re-render of Server Components and re-paints the LCP element.
   - Recommendation: Console-log auth events during page load to confirm the sequence. If `SIGNED_IN` fires on initial load with existing session, this is a strong LCP candidate.

3. **Does dynamic import of SentryUserSync in Provider.tsx actually reduce Supabase chunk size?**
   - What we know: The Next.js docs caveat applies to Server Components dynamically importing Client Components. `Provider.tsx` is a Client Component so the dynamic import should work correctly for code splitting.
   - What's unclear: Whether webpack splits `@supabase/ssr` into a separate chunk when `SentryUserSync` is lazy-loaded from `Provider`.
   - Recommendation: Verify with `npm run analyze` before and after. If Supabase chunk does not move, also apply dynamic import to `Header` in `layout.tsx` (accepting the Server Component caveat may not be absolute — test empirically).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no jest.config, vitest.config, or tests/ directory) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

Phase 13 modifies production code paths (CSS, provider structure, gameroom component). Validation is a mix of automated build checks and manual measurement:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-06 (Fix 1) | LCP < 2500ms after CSS/render delay fix | manual | `npm run build && npm run start` → WebVitalsLogger console | ❌ |
| PERF-06 (Fix 2) | Supabase chunk reduced in initial bundle | semi-automated | `npm run analyze` → verify client.html treemap | ✅ (npm run analyze script exists) |
| PERF-06 (Fix 3) | UnifiedMessages compiles without useUser; own-message styling works | manual | `npm run build` (no TypeScript errors) + gameroom test | ❌ |
| Regression: leaderboard | HomeLeaderboard still fetches and displays data | manual | Load home page, verify leaderboard renders | ❌ |
| Regression: chat/answers | UnifiedMessages shows own-message styling correctly after Fix 3 | manual | Play a game round, submit answer, verify styling | ❌ |
| Regression: slot grid | SlotGrid renders correctly after any changes | manual | Play a game round | ❌ |

### Sampling Rate
- **Per fix commit:** `npm run build` (TypeScript + build errors)
- **Per fix commit:** `npm run analyze` (for Fix 2 only)
- **Phase gate:** Manual LCP measurement with `npm run start` + gameplay regression test before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Identify LCP element via Chrome DevTools (pre-code task, not a file gap)

*(No test framework installation needed — validation is build check + manual measurement.)*

---

## Sources

### Primary (HIGH confidence)
- `nextjs.org/docs/app/guides/lazy-loading` — `next/dynamic` API, code splitting behavior, Server Component caveat, verified 2026-03-18
- `PERF-BASELINE.md` — measured baselines: LCP 4324ms, bundle 3.3MB, Supabase 645KB, React render times < 1ms

### Secondary (MEDIUM confidence)
- `debugbear.com/blog/lcp-render-delay` — render delay root causes: CSS opacity, re-renders, render-blocking resources
- `iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration` — hydration error + router.refresh() causing LCP re-measure, concrete case study
- `web.dev/articles/optimize-lcp` — LCP sub-breakdown: resource load time vs render delay vs element render time

### Tertiary (LOW confidence)
- Whether `router.refresh()` in `useUser.ts` fires on initial session restore (SIGNED_IN event on existing session) — needs empirical testing, not verified against official docs
- Exact LCP element on home page — inferred from page structure, must be confirmed with DevTools

---

## Metadata

**Confidence breakdown:**
- Bottleneck identification: HIGH — directly from PERF-BASELINE.md measurements
- LCP root cause analysis: MEDIUM — render delay pattern is well-documented; specific cause (CSS opacity vs router.refresh() vs JS parse) requires empirical investigation in Phase 13 Plan 01
- Standard stack (next/dynamic): HIGH — official docs verified 2026-03-18
- Fix 3 (UnifiedMessages): HIGH — straightforward dependency removal using existing Jotai pattern
- Pitfalls: HIGH for CSS and dynamic import pitfalls (verified sources); MEDIUM for router.refresh() LCP causation (requires empirical confirmation)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (Next.js and Supabase are stable; LCP diagnostic approach is evergreen)
