# next-frontend

Player-facing web application and admin panel for the Cackle trivia platform. Real-time game UI over WebSocket, player auth via Supabase, and full admin CRUD for content/lobbies/bots.

Cross-service context: see `../cackle-docs/AGENT_CONTEXT.md`

---

## Stack
Next.js 15 · React 19 · TypeScript · Jotai · Socket.io-client · Supabase Auth (SSR) · Radix UI · GSAP · Canvas-confetti

## Key Files
```
src/
  app/
    gameroom/
      page.tsx                      # Main game UI
      hooks/useGameSocket.ts        # Socket.io connection lifecycle
      hooks/useGameState.ts         # Server events → Jotai atoms
      store/gameAtoms.ts            # All game state atoms
    admin/                          # Admin panel pages (collections, topics, slots, lobbies, bots)
    leaderboard/
    profile/
    auth/                           # Login, register, callback
  lib/
    supabase/
      client.ts                     # Browser Supabase client
      server.ts                     # Server Supabase client (RSC / middleware)
  middleware.ts                     # Auth session refresh
Dockerfile                          # Multi-stage, Node 20 Alpine, standalone output
```

## Routes
| Path | Description |
|---|---|
| `/` | Landing |
| `/gameroom` | Live game |
| `/gamerooms` | Lobby browser |
| `/admin` | Admin panel |
| `/auth/*` | Login / register / OAuth callback |
| `/leaderboard` | Global rankings |
| `/profile` | Player profile |
| `/how-to-play` | Instructions |
| `/api/admin/[...path]` | Proxy → lobby_manager admin endpoints |
| `/api/players/[...path]` | Proxy → player_manager |

## WebSocket Connections
| Namespace | Purpose |
|---|---|
| `/game` on gameroom :8000 | Game events, state sync |
| `/chat` on gameroom :8000 | Chat + mini-games between rounds |

## Auth
Supabase Auth (SSR). Session managed via `@supabase/ssr` with cookie-based tokens. `middleware.ts` refreshes sessions on each request.

## State Management
Jotai atoms. `useGameSocket` manages the Socket.io connection; `useGameState` translates server events into atom updates. No Redux / Zustand.

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL            required
NEXT_PUBLIC_SUPABASE_ANON_KEY       required
NEXT_PUBLIC_LOBBY_MANAGER_URL       default: http://localhost:8001
AUTH_SECRET                         required
NEXTAUTH_URL                        required (app base URL)
NEXT_TELEMETRY_DISABLED             set to 1
```

## Conventions
- The frontend only needs `LOBBY_MANAGER_URL` to discover all other service URLs (WS URLs come back in the join response).
- Admin operations for gamerooms are proxied through lobby_manager, not called directly.
- Supabase Auth is the sole auth system. There is no NextAuth in active use.
