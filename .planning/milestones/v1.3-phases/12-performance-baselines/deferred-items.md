# Deferred Items — Phase 12 Performance Baselines

## Pre-existing Issues (Out of Scope)

### TypeScript errors in route files (surfaced by webpack build)

**Files:** `src/app/api/admin/[...path]/route.ts`, `src/app/api/players/[...path]/route.ts`
**Error:** Generated `.next/types/app/api/.../route.ts` exposes RouteParams incompatible with Next.js 16 async params (`params: Promise<any>` required).
**Context:** These errors do NOT appear in Turbopack `next build` or in `npx tsc --noEmit` when `.next/types/` does not exist. The `tsconfig.json` includes `.next/types/**/*.ts`. Running `npm run analyze` (webpack build) generates `.next/types/` which then triggers these pre-existing errors. The `WebVitalsLogger.tsx` and `layout.tsx` changes from 12-01 are clean.
**Action required:** Update `RouteParams` type in both route files to use `Promise<{ path: string[] }>` for Next.js 16 async params compatibility.
