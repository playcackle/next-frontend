# Architecture

**Analysis Date:** 2026-02-25

## Pattern Overview

**Overall:** Next.js 16 full-stack application with real-time game engine integration and state management via Jotai

**Key Characteristics:**
- Server-first architecture with Next.js App Router
- Real-time WebSocket connections for game state synchronization
- Atomic state management with Jotai for UI reactivity
- Server actions for authentication and server-side operations
- Supabase for authentication and identity
- External backend API (Lobby Manager) for game logic and WebSocket coordination

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `src/components/`, `src/app/*/page.tsx`, `src/app/*/layout.tsx`
- Contains: React components, page layouts, modal dialogs, buttons
- Depends on: State management atoms, hooks, styling
- Used by: Next.js routing and layout system

**State Management Layer:**
- Purpose: Manage client-side application state using atomic state pattern
- Location: `src/app/gameroom/store/gameAtoms.ts`, `src/app/store/gameRoom.ts`, `src/atoms/performance-atom.ts`
- Contains: Jotai atoms for game state, animation state, messages, performance settings
- Depends on: Jotai library
- Used by: Components via `useAtomValue()`, `useSetAtom()`, `useAtom()`

**Hooks Layer:**
- Purpose: Encapsulate complex logic and side effects for reuse across components
- Location: `src/app/gameroom/hooks/`, `src/hooks/`
- Contains: Custom React hooks for game actions, socket management, user authentication, game events
- Key files: `useGameSocket.ts`, `useChatSocket.ts`, `useGameEvents.ts`, `useGameActions.ts`, `useGameState.ts`, `useUser.ts`
- Depends on: State atoms, Socket.IO client, Supabase client
- Used by: Page components and other hooks

**Server Actions Layer:**
- Purpose: Handle server-side operations with secure context
- Location: `src/actions/`
- Contains: Authentication (signup, signin, signout), lobby joining operations
- Key files: `auth.ts`, `joinGameroom.ts`
- Depends on: Supabase server client, Next.js revalidation
- Used by: Form submissions, client-side user actions

**API Integration Layer:**
- Purpose: Interface with external services (Supabase, WebSocket, Lobby Manager)
- Location: `src/lib/supabase/`, `src/app/gameroom/hooks/useGameSocket.ts`, `src/app/gameroom/hooks/useChatSocket.ts`
- Contains: Supabase client instances (server/client), Socket.IO initialization, API endpoints
- Depends on: Supabase SDK, Socket.IO client, environment variables
- Used by: Server actions, hooks, server components

**Types Layer:**
- Purpose: Centralize TypeScript type definitions for consistency and maintainability
- Location: `src/types/`, `src/app/gameroom/types/`
- Contains: Type definitions for state, WebSocket events, payloads, game entities
- Key files: `state.ts` (GameState, Slot, Score), `payloads.ts` (EventPayloadMap, game events)
- Used by: All layers for type safety

## Data Flow

**Authentication Flow:**

1. User fills signup/login form on `/register` or `/login`
2. Form submission triggers server action (`src/actions/auth.ts`)
3. Server action calls Supabase auth API
4. On success, session stored in cookies via middleware
5. Supabase SSR client (`src/lib/supabase/server.ts`) manages cookie-based session
6. Root layout checks session and renders authenticated UI

**Game Join & Initialization Flow:**

1. Authenticated user on home page sees game lobbies (fetched in `src/app/page.tsx`)
2. User clicks gameroom tile → triggers `joinGameroom()` server action
3. Server action posts to Lobby Manager backend API
4. Backend returns token, game_ws_url, chat_ws_url
5. Response stored in `gameRoomAtom` (global Jotai atom at `src/app/store/gameRoom.ts`)
6. User navigated to `/gameroom` page
7. Page initializes WebSocket connections via `useGameSocket()` and `useChatSocket()`

**Real-Time Game State Flow:**

1. WebSocket connection established to game server via `useGameSocket()` hook
2. Game server emits events: `lobby_tick`, `new_round_started`, `slot_snapped`, `round_over`, `game_over`
3. Event handlers in `useGameEvents()` hook receive payloads
4. Payloads update Jotai atoms via `updateGameStateAtom` action
5. Components subscribed to atoms via `useAtomValue()` re-render automatically
6. Player submits answer via `UnifiedInputForm` component
7. `useGameActions()` debounced submit function sends answer through socket
8. Backend broadcasts slot snap events; UI updates with animation state

**Messaging Flow:**

1. Unified messaging system combining chat and answer attempts
2. Chat messages received via chat WebSocket → stored in `unifiedMessagesAtom`
3. Answer attempts submitted → locally added to `unifiedMessagesAtom` immediately (optimistic UI)
4. Both message types rendered by `UnifiedMessages` component
5. Bot Bob messages tracked separately via `botBobLastMessageAtom` for pinned message display

**State Management:**

- **Global State:** Jotai atoms in `src/app/gameroom/store/gameAtoms.ts` and `src/app/store/gameRoom.ts`
  - `gameStateAtom`: Core game state (scores, slots, round info)
  - `animationStateAtom`: UI animation triggers (screen shake, flash, zoom)
  - `unifiedMessagesAtom`: Chat and answer messages
  - `gameRoomAtom`: Current game room connection info
  - Derived atoms for specific properties to optimize re-renders

- **Local Component State:** React `useState()` for UI-only state like input forms, animations
  - `previousPositionsRef`: Track leaderboard rank changes for animation triggers
  - `playerAnimations`: Map of animation states per player

- **Persistent State:** localStorage via `atomWithStorage()` utility
  - `performanceModeAtom`: User performance preference (reduced effects)
  - `performanceConfiguredAtom`: Whether user completed performance setup

## Key Abstractions

**Event System (Socket.IO + Jotai):**
- Purpose: Decouple game server events from UI rendering
- Examples: `useGameSocket()` (game logic), `useChatSocket()` (messaging)
- Pattern: Event listeners registered in listeners map, debouncing for high-frequency events, optimistic error handling

**Message Abstraction:**
- Purpose: Unify chat messages and answer attempts into single stream
- Examples: `UnifiedMessage` type combining `ChatMessageData` with submission metadata
- Pattern: `message_type` field distinguishes message source (chat, answer_attempt, successful_answer, failed_answer)

**Game State Selectors:**
- Purpose: Allow components to subscribe to specific state pieces without subscribing to entire game state
- Examples: `timeRemainingAtom`, `scoresAtom`, `isRoundBreakAtom` derived from `gameStateAtom`
- Pattern: Jotai derived atoms using `atom((get) => get(gameStateAtom).property)`

**Performance Mode Toggle:**
- Purpose: Reduce animations and effects on lower-end devices
- Examples: `performanceModeAtom`, `setPerformancePreferenceAtom` action atom
- Pattern: User preference stored in localStorage, applied as body CSS class, checked in component conditionals

## Entry Points

**Root Layout (`src/app/layout.tsx`):**
- Location: `src/app/layout.tsx`
- Triggers: Application startup, page navigation
- Responsibilities: Wraps entire app with providers (Jotai, Radix UI Theme), renders header and background, handles CRT effect styling

**Home Page (`src/app/page.tsx`):**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` after authentication
- Responsibilities: Fetches gamerooms from Lobby Manager API, displays tiles for joining, handles auth errors from email confirmation

**Gameroom Page (`src/app/gameroom/page.tsx`):**
- Location: `src/app/gameroom/page.tsx`
- Triggers: User joins a gameroom from lobby
- Responsibilities: Initializes WebSocket connections, renders game UI with slots and leaderboard, manages unified messaging, handles answer submissions

**Auth Routes (`src/app/auth/callback/route.ts`, `/register`, `/login`):**
- Location: `src/app/auth/`, `src/app/register/`, `src/app/login/`
- Triggers: Email confirmation callback, registration form, login form
- Responsibilities: Handle Supabase callback URL processing, display auth forms, handle signup/signin server actions

**Provider Component (`src/app/provider.tsx`):**
- Location: `src/app/provider.tsx`
- Triggers: Wraps all client-side content in layout
- Responsibilities: Initializes Jotai provider, renders performance modal, initializes performance settings

## Error Handling

**Strategy:** Multi-layer error handling with user-facing feedback and console logging

**Patterns:**

1. **Authentication Errors:**
   - Captured in signup/signin server actions
   - Error message returned to client form
   - Email expiration errors displayed in hero section with helpful links to retry signup/login

2. **WebSocket Connection Errors:**
   - Connection attempt managed by `useGameSocket()` with exponential backoff
   - Max 5 reconnection attempts with delays up to 30 seconds
   - Error state tracked in `socketState` for UI display
   - Debounced error logging to prevent console spam

3. **API Errors:**
   - Lobby join failures caught and returned as `{ isError: true, error: string }`
   - Game submissions debounced to prevent spam and accidental double-submission
   - Submission feedback received via `submission_feedback` WebSocket event

4. **Component-Level Errors:**
   - Loading states managed via `loadingAtom` and `loadingAtom` checks in components
   - Progress/spinner displayed during async operations
   - Missing gameroom data triggers fallback "Loading gameroom..." message

## Cross-Cutting Concerns

**Logging:**
- Console logging with debouncing for high-frequency events
- Errors logged via `debouncedErrorLog()` function in socket management
- WebSocket connection state logged on connect/disconnect

**Validation:**
- Form validation via React Hook Form with Zod resolver patterns (setup in auth components)
- Type-safe event payloads enforced via TypeScript `EventPayloadMap`
- Environment variable existence checks in Supabase client creation

**Authentication:**
- Managed by Supabase auth service
- Session stored in secure cookies
- SSR-aware client creation (`src/lib/supabase/server.ts`) vs browser client (`src/lib/supabase/client.ts`)
- User state monitored via `useUser()` hook for authentication changes

**Performance Optimization:**
- Debouncing on high-frequency events: `lobby_tick` (50ms), submissions (100ms), error logging (1000ms)
- Atomic state selectors prevent unnecessary re-renders
- Lazy loading of heavy components (animations, sound effects)
- Memoization of socket instances and listeners

**Real-Time Synchronization:**
- WebSocket connections for game server events
- Optimistic UI updates for player actions (answers, messages)
- Fallback to polling on WebSocket failure (via reconnection logic)
- State sync via `lobby_state_sync` event for consistency checks

---

*Architecture analysis: 2026-02-25*
