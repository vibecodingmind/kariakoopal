---
Task ID: 1
Agent: Main
Task: Fix runtime HMR error, wire features to real APIs, Google Maps, social login, additional features

Work Log:
- Fixed HMR error by properly using LanguageToggle component in page.tsx (removed duplicate inline implementations)
- Added useCallback and signOut from next-auth/react for proper logout handling
- Updated auth/route.ts to support role assignment during login (seeker/guide/admin)
- Updated auth-store.ts login function to accept role and name parameters
- Updated quick login and role selection in AuthScreen to pass role and name
- Created centralized API client at /home/z/my-project/src/lib/api.ts with typed functions for all 26+ endpoints
- Created Socket.io client at /home/z/my-project/src/lib/socket.ts with typed events and emitters
- Created Socket.io hooks at /home/z/my-project/src/hooks/use-socket.ts for React integration
- Wired SeekerDashboard to real API calls (requests, sessions, messages, price radar, vendors, etc.)
- Wired GuideDashboard to real API calls (profile, status toggle, session management, payouts, etc.)
- Wired AdminDashboard to real API calls (stats, zones, price radar, fraud alerts, disputes, etc.)
- Set up Socket.io server at /home/z/my-project/mini-services/realtime-service/
- Created 4 additional feature components: HagglingAssistant, GroupTourMode, ShoppingListBuilder, CulturalCalendar
- Improved NextAuth social login configuration (only includes providers with real credentials)
- Updated NextAuth session sync to fetch guide profile data for social logins
- Updated next-auth.d.ts types with languagePref and avatarUrl fields
- Created .env.local with proper configuration template
- Seeded database with comprehensive demo data (5 zones, 10 guides, 20 vendors, 50 price entries, etc.)
- Build verification: clean compilation, no errors

Stage Summary:
- All features now wired to real API endpoints
- Socket.io real-time infrastructure in place
- Google Maps uses conditional rendering (real map if API key, SVG fallback otherwise)
- Social login configured for Google/Facebook (requires real OAuth credentials in .env.local)
- 4 additional feature components created with glassmorphism UI
- Database seeded with realistic Kariakoo market data
- Production build passes cleanly

---
Task ID: 2
Agent: Backend Persistence
Task: Add Prisma models, API routes, and frontend wiring for Group Tours, Shopping Lists, and Calendar Reminders

Work Log:
- Added 3 new Prisma models to schema.prisma after existing ExchangeRate model:
  - GroupTour: group tour sessions with participant management, price tiers, status tracking
  - ShoppingList: per-user shopping lists with JSON items array
  - CalendarReminder: per-user event reminders with unique constraint on (userId, eventId)
- Ran `npx prisma db push` and `npx prisma generate` to sync database and regenerate client
- Created 6 API route files:
  - /api/group-tours/route.ts: GET (list with zoneId/status filters), POST (create tour)
  - /api/group-tours/[id]/route.ts: GET, PATCH (join/leave/cancel/complete actions with JSON participantIds handling)
  - /api/shopping-lists/route.ts: GET (list by userId), POST (create list)
  - /api/shopping-lists/[id]/route.ts: GET, PATCH (update name/items), DELETE
  - /api/calendar-reminders/route.ts: GET (list by userId), POST (create with duplicate check)
  - /api/calendar-reminders/[id]/route.ts: DELETE
- Added typed API client methods to /src/lib/api.ts:
  - groupToursApi: list, get, create, update
  - shoppingListsApi: list, get, create, update, delete
  - calendarRemindersApi: list, create, delete
- Wired 3 frontend components to use new APIs:
  - group-tour-mode.tsx: Fetches tours from API on mount, creates tours via API, joins/leaves with optimistic updates and revert on failure, maps API GroupTour type to local GroupTourItem
  - shopping-list-builder.tsx: Fetches lists from API on mount, saves/updates/deletes via API with localStorage as cache/fallback, maps between ShoppingListData and SavedList types
  - cultural-calendar.tsx: Fetches reminders from API on mount, creates/deletes reminders with optimistic updates and revert, added Remove button for set reminders
- All API routes follow existing project patterns (db import, NextResponse, try/catch, JSON field parsing)
- ESLint passes cleanly with no errors
- Dev server runs without issues

Stage Summary:
- 3 new Prisma models with full CRUD API routes
- All JSON fields properly stringified/parsed at API boundaries
- Frontend components use optimistic updates with API persistence and revert on failure
- Demo data kept as fallback when API is unavailable
- localStorage kept as cache/fallback for shopping lists

---
Task ID: 3+4
Agent: Maps & Auth Fix Agent
Task: Fix Google Maps jitter/clustering issues and finalize social login

Work Log:
- **Task 3: Google Maps Fixes**
  - Added `deterministicOffset()` utility to `real-google-map.tsx` — a hash-based offset function that replaces `Math.random()` so vendor/guide marker positions are stable across re-renders
  - Replaced all `Math.random()` calls in `getVendorPosition()` and `getGuidePosition()` with `deterministicOffset(vendor.id, index, range)` using entity ID and index for stable positioning
  - Added `MarkerClusterer` from `@react-google-maps/api` wrapping vendor and guide markers separately, with gridSize=40, maxZoom=17, averageCenter, and enableRetinaIcons
  - Updated marker `clusterer` prop to pass the clusterer instance from the render-prop callback
  - Added `deterministicSvgOffset()` utility to `google-map.tsx` for the SVG fallback map
  - Replaced `Math.random()` in `vendorSvgData` and `guideSvgData` useMemo hooks with deterministic offsets
  - Fixed pre-existing lint error in SVG map's geolocation effect — restructured to use `requestAnimationFrame` scheduling and `geoStatus` state machine instead of synchronous `setState` in effect body
  - Verified `map-data.ts` is consistent: KARIAKOO_CENTER, ZONE_POLYGONS, VENDOR_STALLS, LANDMARKS all properly typed and used by components
- **Task 4: Social Login Finalization**
  - Verified NextAuth route (`[...nextauth]/route.ts`): properly conditionally includes Google/Facebook providers based on credential availability, signIn callback creates/finds DB users, jwt callback enriches token with DB fields, session callback maps to session.user
  - Verified session→Zustand sync: `NextAuthSessionSync` properly reads custom fields (dbId, role, phone, languagePref, avatarUrl) from session and calls `setUser()`
  - Fixed bug: `syncedRef` in `NextAuthSessionSync` was never reset on logout, preventing re-sync after a logout→social-login cycle. Added `useEffect` to reset `syncedRef.current = false` when `isAuthenticated` becomes false
  - Verified social login buttons: both `AuthScreen` (via `handleSocialLogin`) and `SocialLogin` component properly call `signIn('google'/'facebook', { callbackUrl: '/' })`
  - Confirmed all wiring is correct: Google/Facebook OAuth → NextAuth callbacks → DB user creation → JWT enrichment → session → Zustand store sync → dashboard render
- Build verification: `next build` passes cleanly
- Lint verification: `bun run lint` passes with zero errors

Stage Summary:
- All map marker positions are now deterministic (stable across re-renders)
- MarkerClusterer added to prevent overlapping vendor/guide markers at lower zoom levels
- SVG fallback map also uses deterministic positioning
- Social login flow fully verified and one bug fixed (syncedRef not resetting on logout)
- Zero lint errors, clean build
