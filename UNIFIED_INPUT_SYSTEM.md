# Unified Input System Architecture

## Overview

The Unified Input System is a comprehensive communication mechanism that integrates chat and game answer submissions into a single, streamlined interface. It enables cross-namespace communication and provides a flexible, real-time messaging system for the Snapscore game.

## Architecture Components

### Message Types

The system supports multiple message types, defined in `gameAtoms.ts`:

```typescript
type UnifiedMessage = {
  message_type: 'chat' | 'answer_attempt' | 'successful_answer' | 'failed_answer';
  submission_result?: 'success' | 'too_slow' | 'incorrect' | 'already_snapped';
  points_awarded?: number;
  is_rare?: boolean;
  canonical_text?: string;
  is_own_message?: boolean;
}
```

### Frontend Components

1. **UnifiedInputForm**
   - Single input field for both chat and answer submissions
   - Handles submission logic based on message type
   - Supports answer bubbles and recent answer tracking

2. **UnifiedMessages**
   - Displays all messages across chat and answer namespaces
   - Renders different message types with distinct styling

### WebSocket Communication Flow

1. Input Submission
   ```
   User Input → UnifiedInputForm
     ├── If Answer: 
     │   ├── Add to AnswerBubbles
     │   ├── Submit to Game Namespace
     │   └── Broadcast to All Players
     └── If Chat:
         └── Send to Chat Namespace
   ```

2. Cross-Namespace Emission
   ```
   Game Namespace → Chat Namespace
     ├── Answer Attempts
     ├── Successful/Failed Answers
     └── Game-Related Notifications
   ```

### Sniping Gameplay Mechanic

The unified input system enables the "sniping" mechanic by:
- Allowing instant answer submissions
- Providing real-time feedback on answer status
- Broadcasting attempts to all players

## State Management

Managed using Jotai atoms:
- `unifiedMessagesAtom`: Stores message history
- `addUnifiedMessageAtom`: Adds new messages
- `clearUnifiedMessagesAtom`: Clears message history

## Migration Notes

### From Old System
- Replaced separate chat and answer submission flows
- Introduced more granular message types
- Implemented cross-namespace communication

### Recommended Updates
- Ensure backend WebSocket handlers support new message types
- Update client-side message rendering components
- Implement comprehensive error handling

## Performance Considerations

- Messages limited to last 100 entries
- Efficient state updates using Jotai
- Minimal overhead for message broadcasting

## Future Improvements

- Add message filtering
- Implement more detailed analytics
- Enhanced accessibility features

## Backend Implementation Details

### WebSocket Namespaces

The backend uses two primary WebSocket namespaces:

1. **Game Namespace (`/game`)**: 
   - Handles game-specific events
   - Processes answer submissions
   - Broadcasts game state updates

2. **Chat Namespace (`/chat`)**: 
   - Manages chat messages
   - Supports break-time mini-games
   - Facilitates cross-namespace communication

### Cross-Namespace Communication Flow

```
Frontend Input → Backend Routing
  ├── Game Namespace Handler
  │   ├── Validate Answer
  │   ├── Check Against Active Slots
  │   ├── Update Scores
  │   └── Emit Unified Message to Chat Namespace
  └── Chat Namespace Handler
      ├── Validate Chat Message
      └── Broadcast to All Players
```

### Event Emission Strategy

- Answer attempts are immediately broadcasted to all players
- Successful/failed answers trigger specific message types
- Chat messages maintain real-time visibility across namespaces

### Security Considerations

- Persistent `player_id` used for authentication
- WebSocket connections validated against player session
- Message rate limiting to prevent spam
- Input sanitization for both chat and answer submissions