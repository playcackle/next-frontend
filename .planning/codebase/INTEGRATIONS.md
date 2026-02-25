# External Integrations

**Analysis Date:** 2026-02-25

## APIs & External Services

**Game Lobby Manager:**
- Game Lobby Manager Backend - REST API for gameroom discovery and management
  - SDK/Client: Fetch API (native)
  - Base URL: `process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL` (default: `http://localhost:8001`)
  - Endpoints:
    - `GET /lobbies` - Fetch available gamerooms (called from `src/app/page.tsx`)
    - Used in `src/app/api/players/[...path]/route.ts` and `src/app/api/admin/[...path]/route.ts` for proxy routing
    - Used in `src/app/register/page.tsx` and `src/actions/joinGameroom.ts` for game joins

**WebSocket Services:**
- Game Socket.io Server - Real-time game state synchronization
  - Client: socket.io-client 4.8.1
  - Base URL: Derived from `process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL`
  - Connection: WebSocket transport only (`transports: ["websocket"]`)
  - Authentication: Token-based (`auth: { token }`)
  - Used in: `src/app/gameroom/hooks/useGameSocket.ts`
  - Max reconnect attempts: 5
  - Exponential backoff: 1s to 30s

- Chat Socket.io Server - Unified messaging system
  - Client: socket.io-client 4.8.1
  - Base URL: `{baseUrl}/chat` (transformed from WebSocket to HTTP URL)
  - Connection: WebSocket transport only
  - Authentication: Token-based
  - Used in: `src/app/gameroom/hooks/useChatWs.ts`
  - Events: `unified_message`, `send_message`, `connection_success_chat`, `message_error`

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
  - Client: @supabase/supabase-js 2.87.1
  - Auth Key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Used for: User authentication, player profiles, game data

**Database Access:**

Server-side:
- `src/lib/supabase/server.ts` - Creates server client for Server Components and Server Actions
  - Manages session cookies via `next/headers`
  - Used in: `src/actions/auth.ts`, `src/app/page.tsx`
  - Pattern: Refresh session on every request via `getSession()` call in `src/proxy.ts`

Client-side:
- `src/lib/supabase/client.ts` - Browser client factory with singleton pattern
  - Cached client instance
  - Used in: Browser-based auth flows and real-time subscriptions

Middleware:
- `src/proxy.ts` - Next.js middleware for session management
  - Applied to all routes except static assets
  - Refreshes auth session on every request
  - Manages auth cookies in responses

**File Storage:**
- Local filesystem only - No cloud storage integration

**Caching:**
- Next.js built-in: ISR (Incremental Static Regeneration)
  - Gameroom list revalidates every 60 seconds (`next: { revalidate: 60 }`)
  - See: `src/app/page.tsx` fetch configuration

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication (native)
  - Email/password authentication
  - Session management via cookies
  - Email confirmation flow with redirect callback

**Implementation:**
- Server Actions for auth logic: `src/actions/auth.ts`
  - `signUp()` - Creates user account (database trigger auto-creates player record)
  - `signIn()` - Authenticates existing user
  - `signOut()` - Clears session
  - `getUser()` - Retrieves current user
- Email redirect for confirmation: `NEXT_PUBLIC_SITE_URL/auth/callback`
  - Callback route: `src/app/auth/callback/route.ts`
- Session persistence: Middleware-based (`src/proxy.ts`)
- User context: `src/hooks/useUser.ts` provides current user state

**Token Flow:**
- Supabase JWT tokens stored in cookies (secure by default)
- Tokens passed to WebSocket connections for game/chat authentication
- Server-side session refresh on each request

## Monitoring & Observability

**Error Tracking:**
- Not detected - Only console logging in development

**Logs:**
- Browser console logging
- Server logs via Next.js
- Socket.io connection debug logs (1000ms debounce to prevent spam)
- Error logging in game socket hook: `src/app/gameroom/hooks/useGameSocket.ts` (lines 60-65)

## CI/CD & Deployment

**Hosting:**
- Container-based deployment (Docker support)
- Dockerfile: Multi-stage build with development and production stages
- Base image: node:20-alpine
- Output mode: standalone (self-contained Next.js server)

**CI Pipeline:**
- Not detected - No GitHub Actions or other CI config visible

**Environment Variables at Deploy:**
- Build-time (must be provided to Docker):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_LOBBY_MANAGER_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXTAUTH_URL` (legacy)
  - `AUTH_SECRET` (legacy)

## Environment Configuration

**Required env vars for operation:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public authentication key
- `NEXT_PUBLIC_LOBBY_MANAGER_URL` - Game backend URL (has fallback to `http://localhost:8001`)

**Optional env vars:**
- `NEXT_PUBLIC_SITE_URL` - For email confirmation redirects
- `BACKEND_URL` - Server-side backend URL (fallback if `LOBBY_MANAGER_INTERNAL_URL` not set)
- `LOBBY_MANAGER_INTERNAL_URL` - Internal service-to-service backend URL

**Secrets location:**
- `.env.local` (local development only, gitignored)
- Docker: Build arguments and runtime environment variables
- Production: Container orchestration system (Kubernetes, Docker Compose, etc.)

## Webhooks & Callbacks

**Incoming:**
- `POST /auth/callback` - Supabase email confirmation callback
  - Route: `src/app/auth/callback/route.ts`
  - Triggered when user confirms email signup link

**Outgoing:**
- None detected - Frontend does not trigger external webhooks

**WebSocket Events (game-specific):**

Game events emitted to server:
- `submit_answer` - Player answers submission
- Other game actions managed via `src/app/gameroom/hooks/useGameSocket.ts`

Game events received from server:
- `lobby_tick` - High-frequency lobby state updates (50ms debounce)
- `game_starting_soon` - Game countdown
- `waiting_for_players` - Lobby waiting state
- `game_start_cancelled` - Game cancelled
- `round_starting_soon` - Round countdown
- `new_round_started` - Round started
- `slot_snapped` - Player slot selection
- `round_over` - Round ended
- `break_starting` - Between-round break
- `game_over` - Game ended
- `lobby_resetting_for_new_game` - Reset for next game
- `submission_feedback` - Answer validation response
- `lobby_state_sync` - Full state synchronization

Chat events (unified messaging):
- `unified_message` - Incoming message from server
- `send_message` - Outgoing player message
- `connection_success_chat` - Chat connected
- `message_error` - Chat error

## API Proxying

The frontend proxies requests to avoid CORS issues:

**Players API:**
- Route: `src/app/api/players/[...path]/route.ts`
- Target: `LOBBY_MANAGER_INTERNAL_URL` or `http://localhost:8001`
- Method: Dynamic routing to backend endpoints

**Admin API:**
- Route: `src/app/api/admin/[...path]/route.ts`
- Target: `LOBBY_MANAGER_INTERNAL_URL` or `http://localhost:8001`
- Method: Dynamic routing to admin endpoints

---

*Integration audit: 2026-02-25*
