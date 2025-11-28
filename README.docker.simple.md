# Simple Frontend Docker Setup

This is a simple Docker Compose setup for the SnapScore frontend that works with any backend location.

## Quick Start

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your backend URLs:**
   ```bash
   # For local backend
   BACKEND_URL=http://localhost:8001
   NEXT_PUBLIC_LOBBY_MANAGER_URL=http://localhost:8001
   NEXTAUTH_URL=http://localhost:3000
   
   # For VPS backend (replace YOUR_VPS_IP)
   BACKEND_URL=http://YOUR_VPS_IP:8001
   NEXT_PUBLIC_LOBBY_MANAGER_URL=http://YOUR_VPS_IP:8001
   NEXTAUTH_URL=http://YOUR_VPS_IP:3000
   ```

3. **Run the frontend:**
   ```bash
   docker-compose -f docker-compose.simple.yml up --build
   ```

4. **Access the app:** http://localhost:3000

## Environment Configurations

### Local Development
```env
BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_LOBBY_MANAGER_URL=http://localhost:8001
NEXTAUTH_URL=http://localhost:3000
```

### VPS Deployment
```env
BACKEND_URL=http://YOUR_VPS_IP:8001
NEXT_PUBLIC_LOBBY_MANAGER_URL=http://YOUR_VPS_IP:8001
NEXTAUTH_URL=http://YOUR_VPS_IP:3000
```

### Domain-based Deployment
```env
BACKEND_URL=https://api.yourdomain.com:8001
NEXT_PUBLIC_LOBBY_MANAGER_URL=https://api.yourdomain.com:8001
NEXTAUTH_URL=https://yourdomain.com
```

## Notes

- The backend services need to be running and accessible at the specified URLs
- The frontend container runs on port 3000
- Environment variables are passed to the browser, so they must be accessible from the client side
- For production, make sure to generate a new `AUTH_SECRET`
