# Technology Stack

**Analysis Date:** 2026-02-25

## Languages

**Primary:**
- TypeScript 5.x - All source code including React components, server actions, and route handlers
- TSX - React component files throughout `src/app/` and `src/components/`
- JavaScript - Configuration files (next.config.mjs, postcss.config.mjs)

**Secondary:**
- CSS Modules - Component-scoped styling (`.module.css` files)
- HTML - Standard markup via React/JSX

## Runtime

**Environment:**
- Node.js 20 (Alpine Linux in Docker)
- Browser runtime (React 19)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.0.10 - Full-stack React framework with App Router
  - Standalone output mode enabled for Docker deployment
  - Server Components for auth flow
  - Server Actions for Supabase operations
  - Route handlers for API proxying

**UI/Component:**
- React 19.2.1 - UI library
- React DOM 19.2.1 - React rendering

**State Management:**
- Jotai 2.15.2 - Minimal atoms-based state management
- Jotai DevTools 0.5.3 - Development utilities for atom debugging

**Form Handling:**
- React Hook Form 5.2.2 - Form state and validation
- @hookform/resolvers 5.2.2 - Validation schema integration

**UI Component Libraries:**
- Radix UI 1.4.3 - Headless UI primitives
- @radix-ui/themes latest - Pre-styled theme components

**Animations:**
- GSAP 3.13.0 - JavaScript animation library
- animate.css latest - CSS animation utilities
- canvas-confetti 1.9.4 - Confetti animation effects

**Real-time Communication:**
- Socket.io-client 4.8.1 - WebSocket client for game state sync

**Date/Time:**
- date-fns 4.1.0 - Date manipulation utilities

**UI Components:**
- Lucide React 0.555.0 - Icon library
- cmdk 1.1.1 - Command/search interface
- input-otp 1.4.2 - One-time password input
- class-variance-authority 0.7.1 - Component variant management

**Theming:**
- next-themes 0.4.6 - Dark/light mode support

**Utilities:**
- bcryptjs 3.0.3 - Password hashing (used in auth flow)

## Testing

**Runner:**
- Not detected

**Assertion Library:**
- Not detected

## Build/Dev Tools

**Bundler/Build:**
- Next.js (includes Webpack)
- autoprefixer 10.4.22 - CSS vendor prefixing

**CSS Processing:**
- PostCSS 8.x - CSS transformation pipeline

**Type Checking:**
- TypeScript 5.x compiler

**Linting:**
- ESLint - configured (see `.eslintrc*` files)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.87.1 - PostgreSQL database client and auth
- @supabase/ssr 0.8.0 - Server-side rendering support for Supabase sessions
- socket.io-client 4.8.1 - WebSocket connection to game backend
- React 19.2.1 - Core UI framework

**Infrastructure:**
- next 16.0.10 - Server and build infrastructure
- jotai 2.15.2 - Application state container
- react-hook-form 5.2.2 - Form submission handling

## Configuration

**Environment:**

The application uses environment variables for runtime configuration:

**Public (baked into client bundle):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_LOBBY_MANAGER_URL` - Game lobby backend URL (default: `http://localhost:8001`)
- `NEXT_PUBLIC_SITE_URL` - Frontend base URL for auth callbacks

**Server-side only:**
- `LOBBY_MANAGER_INTERNAL_URL` - Internal backend URL for server-to-server requests (default: `http://localhost:8001`)
- `BACKEND_URL` - Alternative backend URL fallback

**Legacy/temporary:**
- `NEXTAUTH_URL` - NextAuth configuration (being phased out)
- `AUTH_SECRET` - NextAuth secret (being phased out)

See `.env.local` file for local development configuration (values not exposed).

**Build:**
- `next.config.mjs`: Enables standalone output mode for containerized deployment
- `tsconfig.json`:
  - Target: ES6
  - Module: ESNext
  - Path aliases: `@/*` → `./src/*`
  - Strict mode enabled
  - JSX: react-jsx
- `postcss.config.mjs`: Empty plugins configuration (using CSS Modules directly)

## Platform Requirements

**Development:**
- Node.js 20 or higher
- npm package manager
- macOS/Linux/Windows with standard development tools

**Production:**
- Node.js 20 Alpine Docker image
- Docker or container runtime
- Environment variables configured at deployment
- 3000 port exposed (configured via `EXPOSE 3000` in Dockerfile)
- Standalone Next.js build (no separate server dependency)

---

*Stack analysis: 2026-02-25*
