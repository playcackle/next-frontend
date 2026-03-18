# Deferred Items — Phase 12 Performance Baselines

## Pre-existing Issues (Out of Scope)

### TypeScript error in webpack build path

**File:** `src/app/api/admin/[...path]/route.ts`
**Error:** `Type "RouteContext" is not a valid type for the function's second argument. Expected "RouteContext", got "{ params: RouteParams; }".`
**Context:** This error does NOT appear in `npx tsc --noEmit` (passes clean) and does NOT appear in the Turbopack `next build`. It only surfaces when running `next build --webpack` (the analyze path). Pre-existing issue unrelated to Phase 12 work.
**Action required:** Fix route parameter types to match Next.js 16 RouteContext signature.
