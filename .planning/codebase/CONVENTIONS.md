# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `LeaderBoard.tsx`, `UnifiedInputForm.tsx`)
- Utility/hook files: camelCase (e.g., `useGameState.ts`, `useGameSocket.ts`)
- Type files: camelCase with descriptive names (e.g., `state.ts`, `payloads.ts`)
- CSS module files: camelCase.module.css (e.g., `gameroom.module.css`, `answerChip.module.css`)
- Atom/store files: camelCase (e.g., `gameAtoms.ts`, `performance-atom.ts`)

**Functions:**
- Arrow functions: preferred style throughout codebase
- Hook functions: useXxx pattern for React hooks (e.g., `useGameState`, `useGameSocket`)
- Utility functions: camelCase (e.g., `formatTime`, `getPlayerColor`, `debounce`)
- Private helper functions: camelCase without prefix

**Variables:**
- Constants: UPPER_SNAKE_CASE for true constants (e.g., `MAX_RECONNECT_ATTEMPTS`, `RECONNECT_DELAY_BASE`, `PERFORMANCE_STORAGE_KEY`)
- State variables: camelCase (e.g., `isConnected`, `socketState`, `playerAnimations`)
- Type instances: camelCase (e.g., `gameState`, `animationState`, `scores`)

**Types:**
- Type definitions: PascalCase (e.g., `GameState`, `SocketState`, `UnifiedMessage`)
- Mapped types: PascalCase (e.g., `EventPayloadMap`, `ChatEventPayloadMap`)
- Union types: PascalCase (e.g., `GameEvent`, `ChatEvent`)

## Code Style

**Formatting:**
- No explicit formatter configured in package.json
- Consistent 2-space indentation observed
- Semicolons used throughout
- Double quotes for strings (e.g., `"use client"`, `"jotai"`)

**Linting:**
- ESLint configured: `"lint": "eslint ."` in package.json
- No `.eslintrc` file found - using default Next.js ESLint config
- TypeScript strict mode enabled in `tsconfig.json`

**Type Safety:**
- TypeScript strict mode: `"strict": true` in `tsconfig.json`
- All exported functions have explicit type annotations
- JSDoc comments for functions: used consistently
- Type imports using `type` keyword where appropriate (e.g., `import type { User } from "@supabase/supabase-js"`)

## Import Organization

**Order:**
1. External libraries and packages (React, Next.js, third-party)
   - `import React from "react"`
   - `import { useAtomValue } from "jotai"`
   - `import { io, Socket } from "socket.io-client"`

2. Type imports from external packages
   - `import type { User, Session } from "@supabase/supabase-js"`
   - `import type { LucideIcon } from "lucide-react"`

3. Internal imports using path aliases
   - `import { useAnswer } from "../hooks/useGameState"`
   - `import { gameStateAtom } from "../store/gameAtoms"`
   - `import styles from "./gameroom.module.css"`

4. Component imports
   - `import SlotGrid from "./components/SlotGrid"`
   - `import Leaderboard from "./components/LeaderBoard"`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Used extensively in hooks and utilities: `import { createClient } from "@/lib/supabase/client"`
- Relative imports used within same directory structure for local dependencies

## Error Handling

**Patterns:**
- Try-catch blocks for async operations: Used in API calls and socket management
- Error throwing: `throw new Error('message')` pattern for API failures (see `src/lib/api/admin.ts`)
- Error logging: `console.error()` with debouncing to prevent spam (see `useGameSocket.ts` line 63)
- Error state in state management: `error: string | null` in socket state
- Graceful degradation: Early returns for null/undefined checks

**Error Types:**
```typescript
// Socket connection errors
if (!socket?.connected) {
  console.warn(`Cannot send ${event}: socket not connected`);
  return false;
}

// API errors with detail extraction
if (!res.ok) {
  const error = await res.json();
  throw new Error(error.detail || 'Failed to create collection');
}

// Listener errors wrapped in try-catch
try {
  callback(data);
} catch (error) {
  debouncedErrorLog("Error in listener:", error);
}
```

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- `console.error()`: Error conditions and failures
- `console.warn()`: Warning conditions (e.g., socket not connected)
- Error logs are debounced to prevent console spam: `debounce((message: string, error?: any) => { console.error(message, error); }, 1000)`
- Server-side context checks: `if (typeof window === "undefined") return;` before DOM access
- No production-level logging framework detected

## Comments

**When to Comment:**
- JSDoc for exported functions: 1-3 line descriptions
- Complex algorithms: Explained with inline comments
- Non-obvious business logic: Documented for maintainability
- Section headers: Used to organize code blocks
  - Example: `// ==================== CONNECTION MANAGEMENT ====================`

**JSDoc/TSDoc:**
- Format: Standard JSDoc with single-line descriptions
  - `/** * Format time as MM:SS */`
  - `/** * Get a random attention animation */`
  - `/** * Play a sound effect */`
- Parameter documentation: Not extensively used, parameters are self-documenting through TypeScript types
- Return type documentation: Implicit through TypeScript return types

**Section Organization:**
- Large files organized with comment section headers:
  - `// ==================== STATE ====================`
  - `// ==================== LIFECYCLE MANAGEMENT ====================`
  - `// ==================== PUBLIC API ====================`

## Function Design

**Size:**
- Small utility functions: 5-15 lines (e.g., `formatTime`, `getInitials`)
- Custom hooks: 20-50 lines (e.g., `useAnswer`, `useAnimationState`)
- Complex hooks: 100+ lines acceptable (e.g., `useGameSocket` is 300+ lines with detailed event handling)

**Parameters:**
- Arrow functions with explicit types: `const formatTime = (seconds: number): string => {}`
- Destructured props in components: `function AccoladeChip({ accolade }: { accolade: Accolade }) {}`
- Generic type parameters for reusable functions: `function debounce<T extends (...args: any[]) => any>(func: T, wait: number)`

**Return Values:**
- Explicit return types in function signatures: `export const formatTime = (seconds: number): string => {}`
- Object returns with typed structure: Returns in hooks return object with named properties
- Early returns: Used extensively for guard clauses (e.g., `if (!isMounted) return;`)

## Module Design

**Exports:**
- Named exports: Used for utilities and types
  - `export const formatTime = ...`
  - `export type GameState = {...}`
  - `export const useAnswer = () => {...}`
- Default exports: Used primarily for React components
  - `export default function Leaderboard() {}`
  - `export default React.memo(SlotGrid)`

**Barrel Files:**
- Not extensively used in this codebase
- Direct imports from specific files preferred
- Import from directories imports default export only

**React Component Patterns:**
- Functional components: Exclusive pattern, no class components
- Memoization: Used strategically for performance
  - `export default React.memo(SlotGrid)`
  - `export default React.memo(SlotTile, (prevProps, nextProps) => {...})`
- "use client" directive: Used in components with interactivity (hooks, state, events)
- Props destructuring: Direct in function parameters with type definition

**State Management:**
- Jotai atoms: Preferred for global state
- Derived atoms: Created for performance optimization (prevents re-renders)
  - Example: `playerCountAtom` derived from `gameStateAtom`
- Action atoms: Write-only atoms for state updates (Jotai pattern)
- Local React state: `useState` for UI-specific state (animations, form inputs)

**Constants Organization:**
- File-level constants: Declared at top of files
- Mapping constants: Objects for lookups (e.g., `ACCOLADE_ICONS`)
- Configuration constants: MAX/MIN values declared early in functions

---

*Convention analysis: 2026-02-25*
