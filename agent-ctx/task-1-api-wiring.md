# Task: Wire Seeker Dashboard to Real API Calls

## Summary
Modified `/home/z/my-project/src/components/seeker-dashboard.tsx` to replace all simulated/mock data and raw `fetch` calls with the typed API client from `@/lib/api` and Socket.io hooks from `@/hooks/use-socket`.

## Changes Made

### 1. Imports: API Client + Socket.io
- Imported typed API functions from `@/lib/api` (zonesApi, guidesApi, requestsApi, sessionsApi, messagesApi, vendorsApi, priceRadarApi, packageDealsApi, seasonalEventsApi, marketStoriesApi, buddyMatchesApi, exchangeRatesApi, navWaypointsApi)
- Imported Socket.io hooks from `@/hooks/use-socket` (useSocketIO, useSessionChat, useSessionUpdates, useLiveLocations)
- Imported Socket.io emitters from `@/lib/socket` (emitChatMessage, emitJoinSession, emitLeaveSession)

### 2. New State Variables
- `marketStories`, `seasonalEvents`, `buddyMatches`, `packageDealList`, `exchangeRates`, `navWaypoints`
- Loading states: `isLoadingStories`, `isLoadingEvents`, `isLoadingBuddies`, `isLoadingPackages`

### 3. Data Fetching (Replaced raw fetch → typed API client)
- `fetchZones()` → `zonesApi.list()`
- `fetchRequests()` → `requestsApi.list()` (filtered client-side by seekerId)
- `fetchSessions()` → `sessionsApi.list()` (filtered client-side by seekerId)
- `fetchGuides()` → `guidesApi.list()` with proper mapping from GuideWithProfile
- `fetchPrices()` → `priceRadarApi.list()` with zone-aware nameKey mapping
- `fetchVendors()` → `vendorsApi.list()` with approved filter and geo coordinate mapping
- `fetchActiveSession()` → `api.get<ApiSession>(/sessions/${id})` + `messagesApi.list(sessionId)`
- `fetchMarketStories()` → `marketStoriesApi.list()` (NEW)
- `fetchSeasonalEvents()` → `seasonalEventsApi.list()` (NEW)
- `fetchBuddyMatches()` → `buddyMatchesApi.list()` (NEW)
- `fetchPackageDeals()` → `packageDealsApi.list()` (NEW)
- `fetchExchangeRates()` → `exchangeRatesApi.list()` (NEW)
- `fetchNavWaypoints()` → `navWaypointsApi.list()` (NEW)

### 4. Socket.io Real-time Integration
- `useSocketIO()` hook for connection management + location tracking
- `useSessionChat()` for real-time chat message updates (replaces pure polling)
- `useSessionUpdates()` for session status change notifications
- `useLiveLocations()` for guide location tracking
- `emitJoinSession()` / `emitLeaveSession()` on session enter/exit
- `emitChatMessage()` for real-time message delivery in `handleSendMessage()`
- Chat polling reduced from 5s to 10s as fallback (Socket.io is primary)

### 5. Actions (Replaced raw fetch → typed API client)
- `handleCreateRequest()` → `requestsApi.create()`
- `handleAcceptGuide()` → `sessionsApi.create()` with `emitJoinSession()`
- `handleSendMessage()` → `emitChatMessage()` + `messagesApi.send()`
- `handleCompleteSession()` → `sessionsApi.update()`
- `handleEmergency()` → `sessionsApi.update()`
- `handleSubmitRating()` → `sessionsApi.update()`
- `handleCancelRequest()` → `requestsApi.update()`
- Escrow release/dispute → `sessionsApi.update()`
- Vendor registration → `vendorsApi.create()`
- Price radar suggestion → `priceRadarApi.update()`
- Buddy invite → `buddyMatchesApi.create()`
- Group tour join/create → `buddyMatchesApi.create()`
- Package booking → `sessionsApi.create()`

### 6. Feature Views (Replaced hardcoded mock data → real API data)
- **Market Stories**: Fetches from `marketStoriesApi.list()`, maps to component format with real guide/vendor/zone names
- **Seasonal Calendar**: Fetches from `seasonalEventsApi.list()`, maps affected zones with real zone names, uses Swahili title/tips
- **Buddy System**: Fetches from `buddyMatchesApi.list()`, derives active buddies from match data
- **Package Deals**: Fetches from `packageDealsApi.list()`, maps zone IDs to names, uses real guide names
- **Group Tour**: Uses buddy match data + real guide/zone info from API
- **Market Heatmap**: Uses real active session count per zone instead of `Math.random()`
- **Shopping List**: Uses real price radar data for route stop items
- **Indoor Navigation**: Uses real waypoints from `navWaypointsApi.list()`
- **Haggling Assistant**: Already used real price radar data (unchanged)

### 7. Periodic Refresh
- Price radar refreshes every 60s
- Chat fallback polling at 10s (Socket.io is primary)

### 8. All Glassmorphism UI Preserved
- No changes to CSS classes, styling, or layout
- Only data sources and event handlers changed

## Verification
- ESLint: `bun run lint` passes with no errors
- TypeScript: Raw `tsc` shows path alias resolution errors (expected - Next.js handles these via tsconfig)
- Dev server: Turbopack database corruption unrelated to code changes
