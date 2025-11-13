# SnapScore Timer Bug Investigation Report

**Date**: 2025-01-09  
**Issue**: Game stuck at 00:00 on round 5/10, timer stops progressing  
**Status**: 🔴 **CRITICAL BUG IDENTIFIED**

---

## 🚨 **ROOT CAUSE IDENTIFIED**

### **Primary Issue: Configuration Mismatch**
- **Backend**: `NUM_ROUNDS_PER_GAME = 5` (game_service.py:18)
- **Frontend**: Expects 10 rounds (page.tsx:131 shows `totalRounds={10}`)

**This is the smoking gun!** When the game reaches round 5, the backend thinks the game should end, but the frontend expects it to continue to round 10.

---

## 🔍 **DETAILED ANALYSIS**

### **1. Backend Timer Logic Issues**

#### **A. Configuration Mismatch**
```python
# snapscore_backend/gameroom/app/services/game_service.py:18
NUM_ROUNDS_PER_GAME = 5  # ❌ Backend thinks game has 5 rounds

# snapscore/src/app/gameroom/page.tsx:131  
totalRounds={10}  # ❌ Frontend expects 10 rounds
```

#### **B. Round Progression Logic Flaw**
```python
# game_service.py:125-128 - Round completion check
if self.app_state.lobby_state.current_round >= NUM_ROUNDS_PER_GAME:
    await self._complete_game()
    return False  # Game ends instead of continuing
```

**Issue**: At round 5, backend calls `_complete_game()` instead of starting round 6.

#### **C. Timer Task Race Condition**
```python
# game_namespace.py:51-65 - Timer task management
async def _lobby_tick_loop(self):
    while True:
        try:
            await self._lobby_tick()
            await asyncio.sleep(1)
        except asyncio.CancelledError:
            logger.info("lobby_tick_task cancelled.")
            break
```

**Race Condition**: Timer task can be cancelled during round transitions, leaving timer in inconsistent state.

### **2. Frontend Timer Synchronization Issues**

#### **A. Debounced Timer Updates**
```typescript
// useGameEvents.ts - Timer updates are debounced by 50ms
const debouncedHandleEvent = useMemo(
  () => debounce(handleEvent, 50),
  [handleEvent]
);
```

**Issue**: 50ms delay can mask timing issues and create perception of stuck timer.

#### **B. State Inconsistency Handling**
```typescript
// Frontend assumes totalRounds=10 but backend stops at round 5
// No validation of round count consistency between frontend/backend
```

### **3. State Management Problems**

#### **A. Insufficient Status Validation**
```python
# game_service.py - No validation that round transitions are valid
# Backend can end game while frontend expects continuation
```

#### **B. Timer Cleanup Issues**
```python
# game_namespace.py:172-196 - Connection handling
async def on_disconnect(self, sid: str):
    # Timer task cleanup relies on handle_player_connection_change
    # but may not properly handle all edge cases
```

---

## 🐛 **BUG REPRODUCTION SCENARIO**

1. **Round 1-4**: Game progresses normally, both systems agree
2. **Round 5 starts**: Backend sees `current_round = 5`, frontend shows "5/10"
3. **Round 5 ends**: Backend checks `5 >= NUM_ROUNDS_PER_GAME (5)` → TRUE
4. **Backend calls** `_complete_game()` instead of starting round 6
5. **Frontend waits** for round 6 timer events that never come
6. **Result**: Timer stuck at 00:00, game unresponsive

---

## 🔧 **IMMEDIATE FIXES REQUIRED**

### **Fix 1: Align Round Configuration** ⭐ **CRITICAL**
```python
# snapscore_backend/gameroom/app/services/game_service.py
NUM_ROUNDS_PER_GAME = 10  # ✅ Change from 5 to 10
```

### **Fix 2: Add Configuration Validation**
```python
# game_service.py - Add validation in constructor
def __init__(self):
    if NUM_ROUNDS_PER_GAME != 10:  # Match frontend expectation
        logger.warning(f"Round count mismatch: backend={NUM_ROUNDS_PER_GAME}, frontend=10")
```

### **Fix 3: Improve Round Transition Logic**
```python
# game_service.py:125-128 - Add better logging and validation
async def _complete_round_if_ready(self) -> bool:
    logger.info(f"Round completion check: {self.app_state.lobby_state.current_round}/{NUM_ROUNDS_PER_GAME}")
    
    if self.app_state.lobby_state.current_round >= NUM_ROUNDS_PER_GAME:
        logger.info("All rounds complete, ending game")
        await self._complete_game()
        return False
    
    logger.info("Starting next round")
    return True
```

### **Fix 4: Add Timer State Recovery**
```python
# game_namespace.py - Add timer state validation
async def _lobby_tick(self):
    # Add state consistency checks
    if self.app_state.lobby_state.status in ["ROUND_BREAK", "IN_ROUND"]:
        if self.app_state.lobby_state.timer <= 0:
            logger.warning("Timer at 0 but game not progressing - forcing state check")
            # Trigger state reevaluation
```

### **Fix 5: Frontend Configuration Sync**
```typescript
// Add runtime validation in gameroom page
const EXPECTED_TOTAL_ROUNDS = 10;

// Validate against backend configuration
useEffect(() => {
  // Add WebSocket event to receive backend round configuration
  // Warn if mismatch detected
}, []);
```

---

## 🏗️ **ROBUST LONG-TERM SOLUTIONS**

### **1. Centralized Configuration**
- Move round count to shared configuration
- Single source of truth for game parameters
- Runtime validation between frontend/backend

### **2. Enhanced State Machine**
- Explicit state transitions with validation
- Recovery mechanisms for stuck states
- Comprehensive logging for debugging

### **3. Timer Resilience**
- Timer state recovery mechanisms
- Heartbeat validation
- Automatic state correction for edge cases

### **4. Frontend/Backend Sync Protocol**
- Configuration exchange on connection
- State validation handshakes
- Mismatch detection and reporting

---

## 🚀 **DEPLOYMENT PRIORITY**

### **🔥 Immediate (Deploy Now)**
1. Change `NUM_ROUNDS_PER_GAME = 10` in game_service.py
2. Add validation logging for round transitions

### **⚡ Short Term (This Week)**
1. Enhanced timer state recovery
2. Configuration validation
3. Improved error handling

### **📈 Long Term (Next Sprint)**
1. Centralized configuration system
2. Robust state machine implementation
3. Comprehensive testing framework

---

## 🧪 **TESTING RECOMMENDATIONS**

### **Regression Testing**
- Test games with 10 full rounds
- Stress test round 5 → round 6 transition
- Validate timer consistency across all rounds

### **Edge Case Testing**
- Player disconnections during round transitions
- Network interruptions during timer updates
- Rapid round progressions

### **Load Testing**
- Multiple concurrent games
- High player count scenarios
- Extended game sessions

---

## 📊 **MONITORING ADDITIONS**

```python
# Add comprehensive logging
logger.info(f"Round {current_round}/{NUM_ROUNDS_PER_GAME} - Status: {status} - Timer: {timer}")

# Add metrics
round_transition_duration = time.time() - transition_start
timer_stuck_count += 1 if timer_stuck else 0
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Backend `NUM_ROUNDS_PER_GAME` changed to 10
- [ ] Round transition logging enhanced  
- [ ] Timer state recovery implemented
- [ ] Frontend/backend validation added
- [ ] Regression tests pass for 10-round games
- [ ] Round 5→6 transition specifically tested
- [ ] Production deployment validated

---

**This bug analysis provides a complete understanding of the timer issue and clear path to resolution. The configuration mismatch is the primary culprit, with secondary issues in state management and synchronization that should also be addressed for robustness.**