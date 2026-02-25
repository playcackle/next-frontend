# Codebase Structure

**Analysis Date:** 2026-02-25

## Directory Layout

```
next-frontend/
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router pages and layouts
│   │   ├── layout.tsx            # Root layout (wraps all pages)
│   │   ├── page.tsx              # Home page with game lobbies
│   │   ├── provider.tsx          # Client provider (Jotai, performance)
│   │   ├── loading.tsx           # Root loading skeleton
│   │   ├── globals.css           # Global styles
│   │   │
│   │   ├── gameroom/             # Game interface
│   │   │   ├── page.tsx          # Main game page (client)
│   │   │   ├── layout.tsx        # Gameroom-specific layout
│   │   │   ├── loading.tsx       # Game loading state
│   │   │   ├── gameroom.module.css  # Gameroom styles
│   │   │   │
│   │   │   ├── components/       # Gameroom-specific UI components
│   │   │   │   ├── SlotGrid.tsx  # Game board grid
│   │   │   │   ├── LeaderBoard.tsx
│   │   │   │   ├── RoomHeader.tsx
│   │   │   │   ├── UnifiedInputForm.tsx   # Chat + answer input
│   │   │   │   ├── UnifiedMessages.tsx    # Message stream
│   │   │   │   ├── AnswerReveal.tsx
│   │   │   │   ├── PostGameShowcase.tsx
│   │   │   │   ├── CountdownOverlay.tsx
│   │   │   │   └── [other game components]
│   │   │   │
│   │   │   ├── hooks/            # Gameroom-specific hooks
│   │   │   │   ├── useGameSocket.ts      # WebSocket for game events
│   │   │   │   ├── useChatSocket.ts      # WebSocket for chat
│   │   │   │   ├── useGameEvents.ts      # Game event handlers
│   │   │   │   ├── useGameActions.ts     # Game actions (submit answer)
│   │   │   │   ├── useGameState.ts       # Game state updates
│   │   │   │   ├── useAnswerBubbles.ts   # Answer bubble animations
│   │   │   │   └── [other hooks]
│   │   │   │
│   │   │   ├── store/            # Gameroom state
│   │   │   │   └── gameAtoms.ts  # Jotai atoms for game state
│   │   │   │
│   │   │   ├── types/            # Game domain types
│   │   │   │   ├── state.ts      # GameState, Slot, Score types
│   │   │   │   └── payloads.ts   # WebSocket event payloads
│   │   │   │
│   │   │   ├── utils.ts          # Game utilities (debouncing, etc)
│   │   │   └── constants.ts      # Game constants
│   │   │
│   │   ├── admin/                # Admin pages (management interface)
│   │   │   ├── page.tsx          # Admin home
│   │   │   ├── layout.tsx
│   │   │   ├── lobbies/          # Lobby management
│   │   │   ├── collections/      # Collection management
│   │   │   ├── topics/           # Topic management
│   │   │   ├── slots/            # Slot management
│   │   │   └── components/       # Admin-specific components
│   │   │
│   │   ├── auth/                 # Authentication flow
│   │   │   └── callback/         # Supabase email confirmation callback
│   │   │       └── route.ts
│   │   │
│   │   ├── login/                # Login page
│   │   │   └── page.tsx
│   │   │
│   │   ├── register/             # Registration page
│   │   │   └── page.tsx
│   │   │
│   │   ├── profile/              # User profile
│   │   │   └── page.tsx
│   │   │
│   │   ├── leaderboard/          # Global leaderboard
│   │   │   └── page.tsx
│   │   │
│   │   ├── collections/          # User collections
│   │   │   └── page.tsx
│   │   │
│   │   ├── store/                # Global app state (Jotai atoms)
│   │   │   └── gameRoom.ts       # Current gameroom connection info
│   │   │
│   │   └── api/                  # API routes (server)
│   │       └── [route handlers]
│   │
│   ├── components/               # Shared components (used across pages)
│   │   ├── header.tsx            # App header
│   │   ├── auth-buttons.tsx      # Login/signup buttons
│   │   ├── gameroom-tile.tsx     # Lobby selector card
│   │   ├── settings-controls.tsx # Audio/settings UI
│   │   ├── synthwave-background.tsx  # Background effect
│   │   ├── crt-effect.tsx        # CRT monitor effect
│   │   ├── sound-effects.tsx     # Audio playback
│   │   ├── background-music.tsx  # Music track
│   │   ├── performance-modal.tsx # Performance settings dialog
│   │   ├── performance-toggle.tsx
│   │   ├── performance-initializer.tsx
│   │   ├── error-modal.tsx
│   │   ├── loading-grid.tsx
│   │   ├── theme-provider.tsx
│   │   └── [other shared components]
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── useUser.ts            # Current user + auth state
│   │   ├── use-mobile.tsx        # Mobile viewport detection
│   │   └── [other shared hooks]
│   │
│   ├── atoms/                    # Shared Jotai atoms (global state)
│   │   └── performance-atom.ts   # Performance settings persistence
│   │
│   ├── contexts/                 # Context API providers
│   │   └── performance-context.tsx
│   │
│   ├── lib/                      # Utility libraries and helpers
│   │   ├── supabase/             # Supabase client instances
│   │   │   ├── server.ts         # SSR-aware Supabase client
│   │   │   └── client.ts         # Browser Supabase client (singleton)
│   │   │
│   │   ├── api/                  # API client functions
│   │   │   ├── players.ts        # Player API endpoints
│   │   │   └── admin.ts          # Admin API endpoints
│   │   │
│   │   └── performance-utils.ts  # Performance optimization utilities
│   │
│   ├── actions/                  # Server actions (NextJS "use server")
│   │   ├── auth.ts               # signup, signin, signout, getUser
│   │   └── joinGameroom.ts       # Lobby join action
│   │
│   ├── types/                    # Shared type definitions
│   │   └── navigator.d.ts        # Browser API type augmentations
│   │
│   ├── styles/                   # Global styles
│   │   └── [style files]
│   │
│   └── proxy.ts                  # Middleware proxy for auth cookie handling
│
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── audio/                    # Audio files (music, sounds)
│
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Codebase analysis
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       └── [other analysis docs]
│
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
│
├── node_modules/                 # Dependencies (generated)
├── .next/                        # Build output (generated)
│
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── .gitignore                    # Git ignore patterns
└── .env.local                    # Local environment variables
```

## Directory Purposes

**`src/app`:**
- Purpose: Next.js App Router routes and page components
- Contains: Pages, layouts, loading states, API routes
- Key structure: File-based routing where `page.tsx` = route, `layout.tsx` = shared wrapper

**`src/app/gameroom`:**
- Purpose: Real-time game interface
- Contains: Game board, leaderboard, messaging, WebSocket hooks, animation logic
- Key files: `page.tsx` (main game), hooks for socket/events, components for UI sections

**`src/components`:**
- Purpose: Reusable UI components shared across pages
- Contains: Header, buttons, modals, effects, audio components
- Pattern: Atomic component design, minimal dependencies

**`src/hooks`:**
- Purpose: Reusable React hooks for state and side effects
- Key hooks: `useUser()` (authentication state), `use-mobile` (responsive detection)

**`src/lib/supabase`:**
- Purpose: Supabase client instances with proper SSR handling
- Key files: `server.ts` (server components/actions), `client.ts` (browser/client components)
- Pattern: Separate instances for different execution contexts

**`src/actions`:**
- Purpose: Server actions for secure server-side operations
- Contains: Authentication flows (signup/signin/signout), lobby joining
- Pattern: "use server" directive, return error or redirect

**`src/app/store`:**
- Purpose: Global Jotai atoms not scoped to specific features
- Key atoms: `gameRoomAtom` (current game connection)

**`src/app/gameroom/store`:**
- Purpose: Game-specific state atoms
- Key atoms: `gameStateAtom`, `animationStateAtom`, `unifiedMessagesAtom`

**`src/app/gameroom/types`:**
- Purpose: Game domain type definitions
- Key files: `state.ts` (game entities), `payloads.ts` (WebSocket payloads)

**`public`:**
- Purpose: Static assets served directly
- Contains: Images, audio files (music, sound effects)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Application root layout, initializes providers
- `src/app/page.tsx`: Home page with game lobbies list
- `src/app/gameroom/page.tsx`: Main game interface
- `src/app/provider.tsx`: Client provider wrapper for Jotai and performance

**Configuration:**
- `tsconfig.json`: TypeScript configuration with `@/*` alias pointing to `./src/*`
- `next.config.mjs`: Next.js config (standalone output for Docker)
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/actions/auth.ts`: Authentication server actions
- `src/actions/joinGameroom.ts`: Gameroom joining logic
- `src/app/gameroom/hooks/useGameSocket.ts`: WebSocket management with reconnection
- `src/app/gameroom/hooks/useGameEvents.ts`: Game event handling
- `src/app/gameroom/store/gameAtoms.ts`: All game state atoms

**Testing:**
- No test files detected (see TESTING.md for more info)

## Naming Conventions

**Files:**
- Components: kebab-case with `.tsx` extension (e.g., `slot-grid.tsx`)
- Hooks: camelCase starting with `use` (e.g., `useGameSocket.ts`)
- Utilities: kebab-case or descriptive names (e.g., `performance-utils.ts`)
- Types: camelCase or descriptive names (e.g., `state.ts`, `payloads.ts`)
- Styles: Module `.css` with `.module.css` suffix (e.g., `gameroom.module.css`)

**Directories:**
- Feature directories: kebab-case (e.g., `gameroom`, `admin`)
- Subfolders: Descriptive plural or singular (e.g., `components`, `hooks`, `store`, `types`)

**Variables & Functions:**
- Functions: camelCase (e.g., `formatJoinUrl()`, `createClient()`)
- Constants: UPPER_SNAKE_CASE (e.g., `PERFORMANCE_STORAGE_KEY`)
- React Components: PascalCase (e.g., `GameroomPage`, `SlotGrid`)
- Atom names: camelCase ending with `Atom` (e.g., `gameStateAtom`, `performanceModeAtom`)

**Type Names:**
- Interfaces: PascalCase (e.g., `SocketState`, `GameState`)
- Type aliases: PascalCase (e.g., `ChatMessageData`, `EventPayloadMap`)
- Enums: UPPER_SNAKE_CASE for values (e.g., `"success" | "error"`)

## Where to Add New Code

**New Feature (e.g., new game mode):**
- Primary code: Create new directory in `src/app/[feature-name]/`
- Page component: `src/app/[feature-name]/page.tsx`
- Components: `src/app/[feature-name]/components/`
- Hooks: `src/app/[feature-name]/hooks/`
- State: `src/app/[feature-name]/store/[atoms].ts`
- Types: `src/app/[feature-name]/types/`

**New Shared Component:**
- Implementation: `src/components/[component-name].tsx`
- Styling: Co-locate with component or use Radix UI + CSS modules
- Example: `src/components/my-button.tsx`

**New Hook (used across multiple features):**
- Implementation: `src/hooks/[hook-name].ts` (or `.tsx` if React component hook)
- Pattern: Encapsulate complex logic and side effects
- Export: Named export, not default

**New Server Action:**
- Implementation: `src/actions/[action-name].ts`
- Pattern: Start with `"use server"` directive
- Return: Error object or use redirect/revalidatePath

**New API Route:**
- Implementation: `src/app/api/[route]/route.ts`
- Pattern: Export handlers (GET, POST, etc)

**Utility Functions:**
- Implementation: `src/lib/[module-name].ts`
- Pattern: Focus on reusability, minimal dependencies
- Example: `src/lib/date-utils.ts`, `src/lib/validation.ts`

**Game State (Atoms):**
- Global atoms: `src/app/store/[domain].ts`
- Feature-specific atoms: `src/app/[feature]/store/[atoms].ts`
- Pattern: Export individual atoms + action atoms for updates

**Type Definitions:**
- Shared types: `src/types/[domain].ts`
- Feature types: `src/app/[feature]/types/[domain].ts`
- Pattern: Group by domain or feature, export all types

## Special Directories

**`src/proxy.ts`:**
- Purpose: Middleware proxy for Supabase auth cookie management
- Generated: No (manually created)
- Committed: Yes
- Note: Handles cookie-based session for SSR auth persistence

**`.next/`:**
- Purpose: Build output directory
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`.planning/codebase/`:**
- Purpose: GSD analysis documents
- Generated: No (manually created by mapping process)
- Committed: Yes
- Note: Contains ARCHITECTURE.md, STRUCTURE.md, and other analysis

---

*Structure analysis: 2026-02-25*
