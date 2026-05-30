# Task: Socket.io Server Setup for Kariako Guide Platform

## Summary
Set up a comprehensive Socket.io server for real-time messaging, location tracking, and live updates for the Kariako Guide platform.

## What Was Done

### 1. Updated Mini-Service Realtime Server (`mini-services/realtime-service/index.ts`)
Enhanced the existing Socket.io server with:
- **Client-side event handlers** matching the events emitted by `src/lib/socket.ts`:
  - `location:update` - Broadcasts location to session participants, also emits `guide:location` for map display
  - `chat:message` - Broadcasts messages to session room, also emits via `session:message` for compatibility
  - `session:join` - Joins socket.io room for session, notifies others with `session:userJoined`
  - `session:leave` - Leaves socket.io room, notifies others with `session:userLeft`
  - `guide:status` - Updates and broadcasts guide status change, auto-registers new guides
  - `request:new` - Notifies guides of new requests (client-side alias for request creation)
- **User socket mapping** (`userSockets` Map) - Tracks userId/role from socket auth data
- **Ping/pong health check** via Socket.io events
- **Backward compatibility** - Original events (guide:online, request:create, session:start, etc.) still work

### 2. Created `server.ts` at Project Root
- Custom Next.js server using `next` package
- Starts the Next.js app on port 3000
- Logs that Socket.io runs separately on port 3003

### 3. Installed `socket.io-client` (v4.8.3)
- Added to main project dependencies via `bun add socket.io-client`

### 4. Updated `.env.local`
- Added `NEXT_PUBLIC_SOCKET_URL=` (empty = same origin, Caddy handles routing)
- Added `NEXT_PUBLIC_SOCKET_PORT=3003` (used by client for XTransformPort query)

### 5. Updated `src/lib/socket.ts`
- Added `XTransformPort` query parameter to Socket.io connection options
- Routes through Caddy gateway using `NEXT_PUBLIC_SOCKET_PORT`

### 6. Created API Route (`src/app/api/socketio/route.ts`)
- Health check endpoint that tests TCP connectivity to the realtime service
- Returns JSON with status, port, and timestamp
- Handles offline/error states with appropriate HTTP status codes

### 7. Updated `package.json`
- Added `dev:server` script using `concurrently` to run Next.js + Socket.io together
- Added `dev:realtime` script to run just the Socket.io service
- Installed `concurrently` as dev dependency

### 8. Installed `concurrently` (v10.0.0)
- Dev dependency for running multiple services simultaneously

## Event Mapping (Client → Server)

| Client Event | Server Handler | Description |
|---|---|---|
| `location:update` | Broadcasts to session + guide map | Real-time location sharing |
| `chat:message` | Broadcasts to session room | In-session messaging |
| `session:join` | Joins session room, notifies others | Session participation |
| `session:leave` | Leaves session room, notifies others | Session exit |
| `guide:status` | Updates guide status, broadcasts change | Guide availability |
| `request:new` | Broadcasts to zone-matched guides | New guide request |

## Architecture
- **Next.js App**: Port 3000 (main web app)
- **Socket.io Server**: Port 3003 (mini-service in `mini-services/realtime-service/`)
- **Caddy Gateway**: Port 81 → routes based on `XTransformPort` query param
- Client connects via `io('/', { query: { XTransformPort: '3003' } })`

## Files Modified/Created
- `mini-services/realtime-service/index.ts` - Enhanced with client event handlers
- `server.ts` - New custom server file
- `src/lib/socket.ts` - Added XTransformPort support
- `src/app/api/socketio/route.ts` - New health check API route
- `.env.local` - Added socket environment variables
- `package.json` - Added dev:server and dev:realtime scripts
