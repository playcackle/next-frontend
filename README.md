# SnapScore Frontend

A Next.js-powered frontend for the SnapScore trivia gaming platform featuring real-time WebSocket communication, state management with Jotai, and a synthwave-inspired design.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Docker Development

```bash
# Run with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Docker Production

```bash
# Build and run production
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down
```

## 🏗️ Architecture

### Tech Stack

- **Next.js 15** with React 19
- **TypeScript** for type safety
- **Jotai** for atomic state management
- **Socket.io** for real-time WebSocket communication
- **Radix UI** for accessible components
- **CSS Modules** for styling

### Key Features

- Real-time multiplayer trivia gameplay
- WebSocket-based game state synchronization
- Synthwave/80s retro aesthetic
- Responsive design for all devices
- Dopamine-driven visual effects and animations

## 📁 Project Structure

```
src/
├── app/
│   ├── gameroom/           # Main game interface
│   │   ├── components/     # Game-specific components
│   │   ├── hooks/          # Game state and WebSocket hooks
│   │   ├── store/          # Jotai atoms for state management
│   │   └── types/          # TypeScript definitions
│   ├── components/         # Shared components
│   └── styles/            # Global styles
```

## 🎮 Game Features

### Real-time Gameplay

- Live trivia rounds with slot-based answers
- WebSocket synchronization across all players
- Dynamic scoring and leaderboards

### Visual Effects

- Particle explosions on correct answers
- Screen shake effects for big wins
- Neon glow animations and transitions

### State Management

- Atomic state updates with Jotai
- Optimized re-renders
- Persistent game state across connections

## 🔧 Configuration

### Environment Variables

Create `.env.local` for development:

```bash
# Backend API URLs
NEXT_PUBLIC_LOBBY_MANAGER_URL=http://localhost:8001
NEXT_PUBLIC_LOBBY_WS_BASE_URL=ws://localhost:8000

# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=development
```

### Docker Environment

The Docker setup includes:

- Production-optimized builds with standalone output
- Development mode with hot reloading
- Multi-stage builds for smaller images
- Health checks for container monitoring

## 📡 WebSocket Events

The frontend handles these real-time events:

- `lobby_state_sync` - Full game state updates
- `lobby_tick` - Periodic state updates
- `new_round_started` - Round initialization
- `slot_snapped` - Answer submissions
- `round_over` - Round completion
- `game_over` - Game completion
- `lobby_resetting_for_new_game` - Game reset

## 🎨 Styling

### CSS Modules

Each component uses scoped CSS modules for styling isolation.

### Design System

- Synthwave color palette (neon pinks, cyans, purples)
- Custom animations and transitions
- Responsive breakpoints
- Accessible contrast ratios

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

### Docker Commands

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Production build
docker-compose up --build

# View logs
docker-compose logs -f frontend

# Shell access
docker-compose exec frontend sh
```

## 🔌 Backend Integration

The frontend connects to these backend services:

- **Lobby Manager** (port 8001) - Game coordination and player management
- **Lobby Service** (port 8000) - Real-time game logic and WebSocket communication
- **Bot Service** - AI player interactions

## 🚀 Deployment

### Docker Production

The included Docker setup provides:

- Optimized production builds
- Standalone Next.js output
- Security hardening (non-root user)
- Health checks
- Restart policies

### Environment Setup

1. Copy `.env.example` to `.env.production`
2. Update backend URLs for your deployment
3. Build and deploy with Docker Compose

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Add proper error handling
4. Test WebSocket connections thoroughly
5. Maintain the synthwave aesthetic

## 📄 License

This project is part of the SnapScore gaming platform.


