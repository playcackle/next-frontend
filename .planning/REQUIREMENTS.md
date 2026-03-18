# Requirements: Quiz Game Frontend

**Defined:** 2026-03-17
**Core Value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.

## v1.3 Requirements

### Observability

- [x] **OBS-01**: Sentry SDK installed and configured with DSN, source maps uploaded securely, quota-safe sampling, and tunnel route for ad-blocker users
- [x] **OBS-02**: Unhandled errors, promise rejections, and Socket.IO connection errors automatically captured in Sentry
- [x] **OBS-03**: Global error boundary catches unexpected React render crashes at app level
- [x] **OBS-04**: Gameroom error boundary silently attempts recovery; shows minimal fallback only if crash is unrecoverable
- [x] **OBS-05**: Sentry events include user identity (from Supabase auth) and current game room context (roomId, game phase)

### Performance

- [ ] **PERF-01**: React re-render hotspots profiled across high-frequency gameroom components (UnifiedMessages, LeaderBoard, SlotGrid)
- [ ] **PERF-02**: Next.js bundle analyzed for total size, code splitting opportunities, and unused imports
- [ ] **PERF-03**: Core Web Vitals (LCP, CLS, INP) measured and baselined
- [ ] **PERF-04**: Socket event handling overhead profiled (message queue, atom update frequency in useGameEvents)
- [ ] **PERF-05**: All performance findings documented with impact/effort ratings
- [ ] **PERF-06**: Top 3 highest-impact bottlenecks fixed and verified against baselines

## Future Requirements

### Observability

- **OBS-F01**: Sentry alert thresholds configured — requires stable baseline and ops ownership
- **OBS-F02**: Sentry breadcrumbs on key game events (room join, round start, answer submit)
- **OBS-F03**: Game phase context tag in Sentry (answering / intermission / game_over)

### Performance

- **PERF-F01**: Server-side OpenTelemetry tracing — only relevant if backend observability is added

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sentry Session Replay | Privacy violation for a live quiz game; adds ~50KB bundle; high quota cost |
| `window.onerror` / custom global handler | Duplicates SDK, risks double-reporting |
| Backend game logic changes | Frontend-only project, game server is external |
| ARCH-01: Dual performance mode consolidation | Requires product decision on prefers-reduced-motion — deferred from v1.2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OBS-01 | Phase 10 | Complete |
| OBS-02 | Phase 10 | Complete |
| OBS-03 | Phase 11 | Complete |
| OBS-04 | Phase 11 | Complete |
| OBS-05 | Phase 10 | Complete |
| PERF-01 | Phase 12 | Pending |
| PERF-02 | Phase 12 | Pending |
| PERF-03 | Phase 12 | Pending |
| PERF-04 | Phase 12 | Pending |
| PERF-05 | Phase 12 | Pending |
| PERF-06 | Phase 13 | Pending |

**Coverage:**
- v1.3 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
