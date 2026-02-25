# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Status:** No testing framework configured

**Current State:**
- No test files found in `src/` directory
- No testing dependencies in `package.json` (no Jest, Vitest, @testing-library, Mocha, etc.)
- No test configuration files (`jest.config.js`, `vitest.config.ts`, `karma.conf.js`)
- No test scripts in package.json beyond standard `build`, `dev`, `lint`, `start`

**Observation:**
Testing infrastructure is not currently implemented in this codebase. This is a significant gap for a production-facing game application.

## Recommended Testing Setup

### For Unit Testing:
```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Test Configuration (Suggested):
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Areas Requiring Test Coverage

### Utilities (High Priority):
Location: `src/app/gameroom/utils.ts`

**Functions to test:**
- `formatTime()`: Time formatting edge cases (0, 59, 60, 3600 seconds)
- `getPlayerColor()`: Consistent color generation from player IDs
- `getInitials()`: Single/multi-word names, edge cases
- `getPlayerAvatar()`: Bot Bob special case, default fallback
- `debounce()`: Debouncing timing, multiple calls, cleanup

**Example test structure:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatTime, getPlayerColor, getInitials } from '@/app/gameroom/utils'

describe('formatTime', () => {
  it('should format seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(3661)).toBe('61:01')
  })
})

describe('getPlayerColor', () => {
  it('should return consistent color for same player ID', () => {
    const color1 = getPlayerColor('player123')
    const color2 = getPlayerColor('player123')
    expect(color1).toBe(color2)
  })

  it('should return valid hex color', () => {
    const color = getPlayerColor('player123')
    expect(color).toMatch(/^#[0-9A-F]{6}$/i)
  })
})
```

### Hooks (High Priority):
Location: `src/app/gameroom/hooks/`

**Hooks requiring tests:**
- `useGameState()`: Atom value retrieval, update/reset operations
- `useAnswer()`: Answer state management, clearing
- `useGameSocket()`: Connection management, event listeners, debouncing
- `useGameActions()`: Answer submission logic
- `useGameEvents()`: Event handling and payload mapping

**Mock patterns needed:**
- Jotai atoms: Mock using `useAtom` hooks
- Socket.io: Mock socket instance with event emission
- External APIs: Mock fetch/API calls

### State Management (Medium Priority):
Location: `src/app/gameroom/store/gameAtoms.ts`

**Atoms to test:**
- Initial state validation: `initGameState` structure
- Derived atoms: Verify correct dependencies and derivation logic
- Action atoms: Test partial updates and merging
- Message atoms: Test message history limit (keep last 100)

**Example test:**
```typescript
import { describe, it, expect } from 'vitest'
import { useAtom } from 'jotai'
import { gameStateAtom, updateGameStateAtom } from '@/app/gameroom/store/gameAtoms'

describe('gameAtoms', () => {
  it('should initialize with default state', () => {
    // Test initial state structure
  })

  it('updateGameStateAtom should merge partial updates', () => {
    // Test that partial updates don't clear other fields
  })

  it('should preserve totalRounds on updates', () => {
    // Test specific preservation logic in updateGameStateAtom
  })
})
```

### Type Safety (Medium Priority):
Location: `src/app/gameroom/types/`

**Type definitions to validate:**
- `EventPayloadMap`: All event types have correct payload structures
- `GameState`: All fields required/optional as intended
- `UnifiedMessage`: Message type discrimination
- `SocketState`: Status values are exhaustive

**Runtime type validation example:**
```typescript
import { describe, it, expect } from 'vitest'
import { EventPayloadMap } from '@/app/gameroom/types/payloads'

describe('EventPayloadMap', () => {
  it('should have all game events mapped to payloads', () => {
    const events: (keyof EventPayloadMap)[] = [
      'connection_success',
      'game_starting_soon',
      // ... all events
    ]
    events.forEach(event => {
      expect(event in EventPayloadMap).toBe(true)
    })
  })
})
```

### Components (Low-Medium Priority):
Location: `src/app/gameroom/components/`

**Testable components:**
- `SlotGrid`: Memoization behavior, slot rendering
- `Leaderboard`: Data sorting, accolade display
- `UnifiedInputForm`: Form submission, input clearing, mode switching
- `StatsRow`: Display of game stats
- `AccoladeChip`: Icon mapping, popover positioning

**Testing approach:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UnifiedInputForm from '@/app/gameroom/components/UnifiedInputForm'

describe('UnifiedInputForm', () => {
  it('should submit with answer mode', async () => {
    const handleSubmit = vi.fn()
    render(
      <UnifiedInputForm
        onSubmit={handleSubmit}
        bubbles={[]}
        onBubbleComplete={() => {}}
      />
    )

    const input = screen.getByPlaceholderText('Type..')
    await userEvent.type(input, 'Test answer')
    await userEvent.keyboard('{Enter}')

    expect(handleSubmit).toHaveBeenCalledWith('Test answer', true)
  })
})
```

### Error Handling (Medium Priority):

**Error scenarios to test:**
- Socket connection failures and reconnection logic (`useGameSocket.ts`)
- API errors with detail extraction (`src/lib/api/admin.ts`)
- Debounced error logging prevents spam
- Graceful degradation when window is undefined (SSR safety)

**Example:**
```typescript
describe('useGameSocket error handling', () => {
  it('should exponentially backoff on reconnection', () => {
    // Test MAX_RECONNECT_ATTEMPTS and delay calculation
  })

  it('should debounce error logs', () => {
    // Test that repeated errors only log once within throttle window
  })
})
```

## Test Data & Fixtures

**Suggested fixture locations:** `src/test/fixtures/`

**Mock data needed:**
```typescript
// src/test/fixtures/gameState.ts
export const mockGameState = {
  playerCount: 4,
  timeRemaining: 120,
  roundName: "Mountains",
  roundNumber: 1,
  totalRounds: 10,
  isRoundBreak: false,
  // ... all required fields
}

export const mockSlot = {
  id: "slot-1",
  points: 100,
  is_snapped: false,
  text_preview: "Rocky peaks",
  canonical_text: "Mountain range",
  is_rare: false,
}

export const mockScore = {
  player_id: "player-1",
  display_name: "Alice",
  score: 500,
  round_score: 100,
}
```

**Mock sockets:**
```typescript
// src/test/mocks/socket.ts
import { vi } from 'vitest'

export const createMockSocket = () => {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    connected: true,
  }
}
```

## Missing Critical Tests

**Priority 1 (Blocks Production):**
- Socket connection/disconnection with reconnection logic
- Answer submission flow end-to-end
- State consistency during game lifecycle

**Priority 2 (Important):**
- Event payload validation
- Debouncing functionality
- Component memoization behavior
- Type safety at integration boundaries

**Priority 3 (Nice to Have):**
- Animation triggers
- CSS class application
- Accessibility patterns

## Recommended Implementation Order

1. **Setup**: Install Vitest, testing library, create vitest.config.ts
2. **Utilities**: Write tests for pure functions first (easiest, high value)
3. **Hooks**: Mock atoms and add hook tests
4. **State**: Test atom derivation and update logic
5. **Components**: Mock children and test component behavior
6. **Integration**: Test complete flows (socket → state → UI)
7. **CI/CD**: Add test script to GitHub Actions

## Run Commands (When Configured)

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI dashboard
npm run test:coverage    # Coverage report
```

---

*Testing analysis: 2026-02-25*

**Note:** No testing framework is currently configured. This codebase would benefit significantly from comprehensive test coverage, particularly for socket management, state synchronization, and game logic validation.
