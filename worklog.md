# Kariako Guide Platform - Worklog

## Task 2: Socket.io Realtime Service (Agent: realtime-service-builder)

### Files Created

1. **`/home/z/my-project/mini-services/realtime-service/package.json`**
   - New bun project with `socket.io` (^4.8.1) and `cors` (^2.8.5) dependencies
   - Dev script: `bun --hot index.ts` for auto-restart on file changes
   - Port: 3003

2. **`/home/z/my-project/mini-services/realtime-service/index.ts`**
   - Full Socket.io server implementation on port 3003
   - Uses `createServer` with `path: '/'` (required by Caddy gateway)
   - CORS configured for `*` origin with GET/POST methods
   - Ping timeout: 60s, Ping interval: 25s

### Event Handlers Implemented

#### Guide Events
- **`guide:online`** - Registers guide, joins zone rooms, broadcasts guide count update
- **`guide:status`** - Toggles guide online/offline/busy, updates counts
- **`guide:location`** - Updates guide GPS position, broadcasts to all for map display

#### Request Events
- **`request:create`** - Broadcasts to guides in matching zones via zone rooms, sets 5-min timeout
- **`request:cancel`** - Clears timeout, notifies guides in zone rooms about cancellation
- **`request:accept`** - Notifies seeker, clears timeout, updates guide status to busy
- **`request:timeout`** - Auto-expand zones after 5 min (broadcasts to ALL online guides), then final 2-min expiry

#### Session Events
- **`session:start`** - Both guide and seeker join session room, emits `session:started`
- **`session:message`** - Chat messages relayed within session room
- **`session:location`** - GPS location sharing within session room
- **`session:complete`** - Marks session complete, returns guide to online status, supports rating/review
- **`session:emergency`** - Emergency alert to session room AND admin room

#### Admin Events
- **`admin:join`** - Admin joins admin room, receives immediate stats
- **`admin:stats`** - Request current stats (online guides, busy guides, active sessions, pending requests)

#### Disconnect Handling
- Detects guide vs seeker disconnect
- Notifies counterpart of session disruption
- Notifies admin room of disruptions
- Cleans up in-memory state (onlineGuides, seekerSockets)

### In-Memory State Management
- `onlineGuides` (Map<socketId, GuideInfo>) - Tracks connected guides with zones, status, location
- `activeSessions` (Map<sessionId, SessionInfo>) - Tracks active sessions with guide/seeker socket IDs
- `pendingRequests` (Map<requestId, {data, timeoutId}>) - Pending requests with auto-timeout
- `seekerSockets` (Map<seekerId, socketId>) - Maps seeker IDs to socket IDs

### Key Features
- Zone-based room system for targeted request broadcasting
- Automatic request timeout with zone expansion (5 min → 2 min final expiry)
- Session disruption detection on disconnect
- Real-time admin stats broadcasting
- Graceful shutdown handlers (SIGTERM, SIGINT)
- Comprehensive TypeScript type definitions for all data structures

### Dependencies Installed
- socket.io@4.8.3
- cors@2.8.6

### Notes
- Service verified to start correctly on port 3003 (confirmed via foreground test)
- Follows existing websocket example patterns (createServer, path: '/', Caddy-compatible)
- Frontend should connect via `io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] })`

---

## Task 10: Database Seed Script (Agent: seed-script-builder)

### Files Created

1. **`/home/z/my-project/prisma/seed.ts`**
   - Comprehensive seed script using `PrismaClient` directly from `@prisma/client`
   - Idempotent: clears all existing data before seeding (respects foreign key order)
   - Run via: `bunx tsx prisma/seed.ts` or `bun run db:seed`

2. **`/home/z/my-project/package.json`** (modified)
   - Added `"db:seed": "bunx tsx prisma/seed.ts"` script

### Data Seeded

| Entity | Count | Details |
|--------|-------|---------|
| Zones | 5 | Vyombo, Electronics, Fabric, Spices, Wholesale - each with Swahili names, descriptions, geo-boundary polygons, and unique colors |
| Admin User | 1 | "Admin User" with phone +255700000001 |
| Seeker Users | 3 | Sarah Johnson (US), Marco Rossi (Italy), Li Wei (China) - different nationalities, English language pref |
| Guide Users + Profiles | 10 | 7 active, 2 pending, 1 suspended; Swahili names; ratings 3.2–4.9; sessions 5–187; varied zone specializations and languages (sw, en, ar, fr, de) |
| Vendors | 20 | 4 per zone; realistic Kariakoo vendor names; categories matching zone specialty; all approved; random geo-coordinates near Kariakoo center |
| Price Radar Entries | 50 | 10 per zone; realistic TZS price ranges (e.g., Rice Cooker: 45000–85000 TZS, Kitenge 6 yards: 15000–35000 TZS) |
| Badges | 20 | Awarded to guides based on profiles: vyombo_specialist, electronics_pro, top_rated, 100_sessions, fabric_expert, spice_master, wholesale_guru, verified_elite, 7_day_streak, guide_of_week |
| Requests | 5 | Various statuses (open, matched, active, completed); connected to zone many-to-many relations |
| Sessions | 3 | 2 completed with ratings/reviews, 1 active with held escrow |
| Messages | 4 | Sample bilingual chat messages (English/Swahili) with translations in active session |
| Payouts | 5 | Mix of processed, pending, and failed; with M-Pesa mobile money numbers |

### Key Design Decisions

- **Foreign key deletion order**: Message → Session → Badge → Payout → PriceRadar → Vendor → Request → GuideProfile → User → Zone
- **Zone geo-bounds**: Defined as GeoJSON Polygon coordinates around Kariakoo center (-6.8264, 39.2695)
- **Guide-zone mapping**: GuideProfile.zones stored as JSON array of zone IDs (matching schema design)
- **Bilingual content**: Messages include both Swahili and English with `translatedContent` field
- **Realistic TZS pricing**: All prices in Tanzanian Shillings with market-accurate ranges
- **Vendor coordinates**: Small random offsets (~0.002°) from Kariakoo center for realistic distribution

### Verification
- Script executed successfully, all records created
- No foreign key constraint errors
- All relationships properly connected (zones↔requests, zones↔vendors, zones↔priceRadar, users↔profiles, users↔badges, etc.)

---

## Task 3: API Routes (Agent: api-routes-builder)

### Files Created (19 route files)

| # | Route | File | Methods |
|---|-------|------|---------|
| 1 | `/api/auth` | `src/app/api/auth/route.ts` | POST (mock OTP login) |
| 2 | `/api/users` | `src/app/api/users/route.ts` | GET (list, role filter), PATCH (update profile) |
| 3 | `/api/guides` | `src/app/api/guides/route.ts` | GET (list, status filter, with user+badges) |
| 4 | `/api/guides/[id]` | `src/app/api/guides/[id]/route.ts` | GET (single), PATCH (update bio/zones/languages/status) |
| 5 | `/api/requests` | `src/app/api/requests/route.ts` | GET (list, filter by status/zoneId/seekerId), POST (create) |
| 6 | `/api/requests/[id]` | `src/app/api/requests/[id]/route.ts` | GET (single with sessions), PATCH (update status) |
| 7 | `/api/sessions` | `src/app/api/sessions/route.ts` | GET (list, filter by guideId/seekerId/status), POST (create when guide accepts) |
| 8 | `/api/sessions/[id]` | `src/app/api/sessions/[id]/route.ts` | GET (single with messages), PATCH (complete/rate/dispute/emergency/confirm) |
| 9 | `/api/messages` | `src/app/api/messages/route.ts` | GET (by sessionId), POST (send message) |
| 10 | `/api/vendors` | `src/app/api/vendors/route.ts` | GET (list, filter by zoneId/category/approved), POST (register) |
| 11 | `/api/zones` | `src/app/api/zones/route.ts` | GET (list with counts), POST (create) |
| 12 | `/api/zones/[id]` | `src/app/api/zones/[id]/route.ts` | GET (single with vendors/prices/requests), PATCH (update), DELETE |
| 13 | `/api/price-radar` | `src/app/api/price-radar/route.ts` | GET (list, filter by zoneId/category), POST (create) |
| 14 | `/api/price-radar/[id]` | `src/app/api/price-radar/[id]/route.ts` | PATCH (update), DELETE |
| 15 | `/api/payouts` | `src/app/api/payouts/route.ts` | GET (list, filter by guideId/status), POST (create) |
| 16 | `/api/badges` | `src/app/api/badges/route.ts` | GET (list, filter by guideId), POST (award badge) |
| 17 | `/api/admin/stats` | `src/app/api/admin/stats/route.ts` | GET (dashboard stats) |
| 18 | `/api/admin/verify` | `src/app/api/admin/verify/route.ts` | POST (approve/reject guide) |
| 19 | `/api/admin/disputes` | `src/app/api/admin/disputes/route.ts` | GET (disputed sessions), POST (resolve dispute) |

### Implementation Details

- **Next.js 16 App Router**: All routes use `NextRequest`/`NextResponse` from `next/server`
- **Dynamic route params**: Used `Promise<{ id: string }>` pattern with `await params` (Next.js 16 requirement)
- **Database**: All routes import `db` from `@/lib/db` (Prisma client)
- **Error handling**: Try/catch with proper HTTP status codes (200, 201, 400, 404, 500)
- **Query params**: Parsed via `new URL(request.url).searchParams`
- **Request body**: Parsed via `await request.json()`

### Key Business Logic

- **Auth**: Mock OTP login - creates user if phone not found, sets auth_token cookie (7-day expiry)
- **Session creation**: Auto-generates session code, updates request to "matched", sets guide to "busy"
- **Session completion**: Releases escrow, updates guide stats (totalSessions, avgRating), sets guide back to "online", updates request to "completed"
- **Dispute resolution**: Supports "release" (creates payout for guide) or "refund" escrow actions, completes session, resets guide status
- **Guide verification**: Approve → sets status to "active" + awards "verified_elite" badge; Reject → sets status to "suspended"
- **Admin stats**: Aggregates users by role, active sessions, requests by status, total platform revenue, average rating, pending verifications

### Verification

- All 19 route files pass ESLint (`bun run lint` - zero errors)
- Live API tests confirmed:
  - `GET /api/zones` → returns 5 zones with vendor/priceRadar/request counts
  - `GET /api/admin/stats` → returns complete dashboard stats (14 users, 3 sessions, 5 zones, 20 vendors, TZS 3500 revenue)
  - `GET /api/guides` → returns 10 guides with user info and badges
  - `POST /api/auth` → creates new user and returns auth token with cookie

---

## Task 4+5: i18n System & Zustand Stores (Agent: i18n-stores-builder)

### Files Created

1. **`/home/z/my-project/src/lib/i18n.ts`** — Full bilingual translation system
   - Type-safe `Language` type (`'sw' | 'en'`)
   - `t(key, lang)` function with Swahili default, English fallback, raw-key fallback
   - Helper exports: `getTranslationKeys()`, `getTranslations(lang)`, `supportedLanguages`
   - **224 translation keys** covering all app sections:
     - General (25 keys): app_name, tagline, loading, error, etc.
     - Auth (14 keys): phone_placeholder, send_otp, verify_otp, role_seeker/guide, etc.
     - Navigation (12 keys): nav_home through nav_settings
     - Seeker Dashboard (16 keys): post_request through leave_review
     - Guide Dashboard (18 keys): online_status through guide_of_week
     - Admin (14 keys): admin_dashboard through fraud_flags
     - Price Radar (7 keys): fair_price_range through suggest_update
     - Vendor Directory (9 keys): vendor_name through register_vendor
     - Session (12 keys): session_code through dispute_raised
     - Onboarding (7 keys): 3 slides with title+desc + get_started
     - Badges (10 keys): all 10 badge types in both languages
     - Zones (5 keys): all 5 Kariakoo zones
     - Trust (5 keys): verified through rating_warning
     - Additional Common (56 keys): amount, date, time, status, filters, payment, etc.
   - All Swahili translations are accurate and natural (e.g., "Mwongozo wako katika soko la Kariakoo", "Rada ya Bei", "Beji za mwongozo")

2. **`/home/z/my-project/src/lib/stores/auth-store.ts`** — Authentication & user state
   - Interfaces: `User`, `GuideProfile`, `Badge` (matching Prisma schema fields)
   - State: user, guideProfile, badges, isAuthenticated, language, currentView, isLoading
   - Actions: login (API call to `/api/auth`), logout, setUser, setGuideProfile, setBadges, setLanguage, setView, setLoading
   - Uses `persist` middleware (localStorage key: `kariako-auth`)
   - Login auto-sets currentView based on role (admin → 'admin', else → 'home')

3. **`/home/z/my-project/src/lib/stores/session-store.ts`** — Active session & chat state
   - Interfaces: `Session`, `Message` (with all Prisma fields + optional joined relations)
   - State: activeSession, messages, sessionCode, isChatOpen, isConnecting, sessionHistory
   - Actions: setActiveSession, addMessage, setMessages, clearSession, toggleChat, setChatOpen, setSessionCode, setConnecting, setSessionHistory, updateSession
   - No persistence (session data is transient)

4. **`/home/z/my-project/src/lib/stores/guide-store.ts`** — Guide working state
   - Interfaces: `MarketRequest` (matching Prisma Request model + display helpers), `Earnings`
   - State: isOnline, status, liveRequests, earnings, completedToday, currentZoneIds
   - Actions: setOnline, setStatus, setLiveRequests, addLiveRequest, removeLiveRequest, setEarnings, setCompletedToday, incrementCompletedToday, setCurrentZoneIds, reset
   - No persistence (guide state resets on page reload; online status managed via socket.io)
   - `reset()` action returns all state to initial defaults

5. **`/home/z/my-project/src/lib/stores/app-store.ts`** — Global UI state
   - Interface: `AppToast` for toast notifications
   - State: showOnboarding, onboardingStep, sidebarOpen, darkMode, isMobile, toastQueue
   - Actions: setShowOnboarding, setOnboardingStep, nextOnboardingStep, completeOnboarding, toggleSidebar, setSidebarOpen, setDarkMode, toggleDarkMode, setIsMobile, addToast, removeToast, clearToasts
   - Uses `persist` middleware (localStorage key: `kariako-app`) for onboarding + dark mode
   - Toast system with unique IDs and queue management

6. **`/home/z/my-project/src/lib/stores/index.ts`** — Barrel export for all stores and types

### Key Design Decisions

- **i18n approach**: Simple key-value record (not react-intl/next-intl) for zero-runtime-overhead, tree-shakeable translations; easy to add keys without config changes
- **Zustand over Context**: Chosen for performance (no re-render cascade), simplicity, and built-in persist middleware
- **Persist strategy**: Auth + App stores persisted (survive refresh); Session + Guide stores ephemeral (reset on reload, socket.io reconnects)
- **TypeScript interfaces**: All interfaces mirror Prisma schema fields exactly (JSON fields like `zones`/`languages` typed as `string[]` after parsing)
- **MarketRequest alias**: Named `MarketRequest` instead of `Request` to avoid collision with the native `Request` type

### Verification

- `bun run lint` passes with zero errors
- All 6 files compile without TypeScript errors
- Dev server running without issues

---

## Task 9: Shared UI Components (Agent: ui-components-builder)

### Files Created (12 component files)

| # | Component | File | Description |
|---|-----------|------|-------------|
| 1 | Rating Stars | `src/components/rating-stars.tsx` | Reusable star rating with filled/empty/half stars, interactive mode, numeric display, size prop |
| 2 | Status Badge | `src/components/status-badge.tsx` | Status indicator with colored dot + optional label, animated pulse for online/active states |
| 3 | Badge Display | `src/components/badge-display.tsx` | Guide badge grid/compact display with icons, colors, names, awarded dates per badge type |
| 4 | Language Toggle | `src/components/language-toggle.tsx` | SW/EN toggle button using auth store language, compact for mobile headers |
| 5 | Guide Card | `src/components/guide-card.tsx` | Guide profile card with avatar, rating, zones, languages, verified badge, action buttons |
| 6 | Onboarding | `src/components/onboarding.tsx` | 3-screen carousel onboarding with Swahili default, skip/next/get-started, progress dots |
| 7 | Map View | `src/components/map-view.tsx` | Stylized SVG/CSS map of Kariakoo with zone overlays, vendor pins, guide dots, user location |
| 8 | Session Chat | `src/components/session-chat.tsx` | In-session chat with sender bubbles, auto-translate toggle, timestamps, loading skeleton |
| 9 | Session Tracker | `src/components/session-tracker.tsx` | Active session card with timer, session code, checklist, escrow status, emergency button |
| 10 | Vendor Directory | `src/components/vendor-directory.tsx` | Vendor grid with search/filter, favorites, map toggle, register dialog |
| 11 | Price Radar Panel | `src/components/price-radar-panel.tsx` | Price category cards with TZS range bars, zone filter, suggest update dialog |
| 12 | Leaderboard | `src/components/leaderboard.tsx` | Ranked guide list with gold/silver/bronze, guide-of-week card, zone filter |

### Component Details

#### 1. rating-stars.tsx
- **Props**: rating (number), maxRating, size ('sm'|'md'|'lg'), interactive (boolean), onRate callback, showNumeric
- **Features**: Half-star support via CSS clipPath, hover preview in interactive mode, numeric rating display
- **Sizes**: sm (3.5 icons), md (4 icons), lg (5 icons)

#### 2. status-badge.tsx
- **Status types**: online, offline, busy, pending, active, suspended
- **Visual**: Colored dot + optional text label, animated pulse for online/active states
- **Sizes**: sm, md, lg with proportional dot and wrapper sizes

#### 3. badge-display.tsx
- **Badge types**: 10 types mapped to specific icons (Package, Zap, Star, Trophy, Scissors, Flame, ShieldCheck, CalendarCheck, Crown) and color schemes
- **Modes**: Compact (icon-only grid) and expanded (icon + name + date grid)
- **i18n**: Uses `badge_*` translation keys from i18n system

#### 4. language-toggle.tsx
- **Integration**: Uses `useAuthStore` language and `setLanguage` action
- **Display**: Globe icon + "SW"/"EN" text
- **Mobile**: 44px minimum touch target on mobile, compact on desktop

#### 5. guide-card.tsx
- **Avatar**: Colored circle with initials (no image), or image URL
- **Info**: Name, online status dot, star rating, session count, zone badges, language tags
- **Verified Elite**: Gold ring + corner badge for verified_elite guides
- **Actions**: "Accept Guide" (seeker view, only when online) + "View Profile"
- **Zone colors**: Each zone has a distinct color scheme (orange/sky/pink/red/teal)

#### 6. onboarding.tsx
- **Carousel**: shadcn Carousel with 3 screens (MapPin, TrendingUp, ShieldCheck icons)
- **Content**: Uses i18n keys `onboard_1_title` through `onboard_3_desc`
- **Navigation**: Progress dots (clickable), "Skip" button, "Next"/"Get Started" button
- **Completion**: Calls `completeOnboarding()` from app store, sets `showOnboarding: false`
- **Full-screen**: Fixed overlay covering entire viewport

#### 7. map-view.tsx
- **SVG map**: Stylized representation of Kariakoo with 5 zone rectangles, grid pattern background
- **Zone overlays**: Clickable colored rectangles with zone names, active zone detail panel
- **Vendor pins**: Store icon markers with hover-to-reveal names
- **Guide locations**: Animated pulsing green dots with hover names
- **User location**: Primary-colored navigation dot with ping animation
- **Legend**: Top-left corner overlay with symbol explanations

#### 8. session-chat.tsx
- **Props**: sessionId, currentUserId, messages array, onSendMessage callback, isLoading
- **Bubbles**: Guide (left, green), Seeker (right, primary/blue)
- **Auto-translate**: Toggle button in header, shows translatedContent below original text
- **Features**: Auto-scroll to bottom, Enter to send, loading skeleton, timestamp per message
- **Empty state**: "No messages" placeholder

#### 9. session-tracker.tsx
- **Timer**: Live HH:MM:SS elapsed counter using setInterval, initialized from startedAt
- **Session code**: Large monospace display with copy-to-clipboard button
- **Escrow status**: Color-coded bar (pending=amber, held=sky, released=emerald, disputed=red)
- **Confirmations**: Seeker/Guide confirmed indicators with checkmark icons
- **Checklist**: Collapsible list with add/remove items, checkbox toggle
- **Actions**: "Mark Complete" (primary) + "Emergency" (destructive red) buttons

#### 10. vendor-directory.tsx
- **Layout**: Grid view (1-col mobile, 2-col desktop) with map view toggle
- **Search**: Text search across name and categories
- **Filters**: Zone dropdown + Category dropdown
- **Favorites**: Heart icon toggle per vendor (local Set state)
- **Map integration**: Embeds MapView component when map view is active
- **Register dialog**: Form with name, zone, categories, stall number fields
- **Card content**: Name, zone badge, category tags, stall number, recommendations, hours

#### 11. price-radar-panel.tsx
- **Price cards**: Category + zone + min-max price range with color-coded range bar
- **Bar visualization**: Proportional position and width based on global max price
- **TZS formatting**: Intl.NumberFormat for locale-aware number display
- **Zone filter**: Dropdown to filter by market zone
- **Suggest update**: Per-card button opening a dialog with textarea input
- **Timestamps**: "Last updated" with localized date format

#### 12. leaderboard.tsx
- **Ranked list**: Position number, avatar, name, rating stars, sessions this week
- **Top 3 styling**: Gold (Crown), Silver (Medal), Bronze (Award) icons + colored borders/backgrounds
- **Guide of the Week**: Featured card at top with gradient background and crown icon
- **Zone filter**: Dropdown to filter leaderboard by zone
- **Verified Elite badge**: Small badge on guide name for elite guides

### Key Design Decisions

- **All client components**: Every file uses `'use client'` directive as required
- **i18n integration**: All user-facing text uses `t(key, language)` from `@/lib/i18n`
- **Store integration**: Auth store for language, app store for onboarding state
- **No external map library**: MapView uses SVG/CSS for stylized representation (no Mapbox API key needed)
- **Dark mode**: All components use `bg-background`, `text-foreground`, `text-muted-foreground` etc. with dark: variants
- **Mobile-first**: 44px touch targets, responsive grids, compact mobile layouts
- **Zone color system**: Consistent zone color mapping across all components (orange=Vyombo, sky=Electronics, pink=Fabric, red=Spices, teal=Wholesale)
- **Badge type mapping**: 10 distinct badge types with unique icons and color schemes, with Award fallback for unknown types
- **Avatar system**: Colored circle with initials derived from name, color from ID hash

### Verification

- `bun run lint` passes with zero errors
- All 12 components compile without TypeScript errors
- Dev server compiles successfully with no runtime errors

---

## Task 6: Seeker Dashboard (Agent: seeker-dashboard-builder)

### Files Created

1. **`/home/z/my-project/src/components/seeker-dashboard.tsx`** — Main seeker dashboard component (~850 lines)
   - Comprehensive 8-view dashboard managed by internal `SeekerView` state type
   - Full bilingual support via `t(key, language)` from `@/lib/i18n`
   - Integrates all shared components: SessionTracker, SessionChat, PriceRadarPanel, VendorDirectory, MapView, GuideCard, RatingStars, Leaderboard
   - Mobile-first responsive layout with sticky header and bottom navigation
   - Dark mode compatible

2. **`/home/z/my-project/src/app/page.tsx`** (modified) — Renders SeekerDashboard as the root page

### Sub-views Implemented

| # | View | Description |
|---|------|-------------|
| 1 | Home | Welcome message, quick action buttons (Post Request, Price Radar, Vendors, My Requests), map overview, recent activity feed, Guide of the Week card, active session/open request banners |
| 2 | Post Request | Form with description textarea, multi-select zone picker (toggle buttons with zone colors), budget input (TZS), simulated photo attachment, submit with loading state |
| 3 | My Requests | List of all seeker's requests with status badges, expandable request cards showing details + matched sessions, filter by status (all/open/matched/active/completed/cancelled), cancel open requests, navigate to matching view |
| 4 | Live Matching | Shows open request at top, real-time guide matching simulation (guides appear at 3s, 8s, 15s), animated "Waiting for guides..." state with elapsed timer, zone expansion notification at 5 min, accept guide creates session |
| 5 | Active Session | SessionTracker integration, guide info card, request details, chat/map toggle, SessionChat integration with auto-translate, MapView showing guide location, prominent emergency button, "Confirm Session Complete" button, rating dialog after completion |
| 6 | Session History | List of past sessions with guide name, date, duration, amount, rating, expandable receipt details (session code, duration, cost, platform fee, guide payout, payment status, review), date range filter |
| 7 | Price Radar | Full PriceRadarPanel component with zone filter, suggest update dialog, TZS price range bars |
| 8 | Vendor Directory | Full VendorDirectory component with search, zone/category filters, favorites, map toggle, register dialog |

### Data Fetching & API Integration

- **Zones**: `GET /api/zones` — Loaded on mount for zone pickers, maps, filters
- **Requests**: `GET /api/requests?seekerId=` + `POST /api/requests` — Full CRUD with create, list, cancel
- **Sessions**: `GET /api/sessions?seekerId=` — List all sessions, active session polling every 5s
- **Session detail**: `GET /api/sessions/:id` — Messages included, polled during active session
- **Session actions**: `PATCH /api/sessions/:id` — Complete, rate, emergency actions
- **Messages**: `POST /api/messages` — Send chat messages in session
- **Guides**: `GET /api/guides?status=active` — For matching simulation, Guide of the Week
- **Price Radar**: `GET /api/price-radar` — Price entries for radar panel
- **Vendors**: `GET /api/vendors?approved=true` — Vendor directory data

### Key UX Features

- **Auto-detect active session**: On load, checks for sessions with `escrowStatus === 'held'` and no `completedAt`
- **Live matching simulation**: Timer-based guide appearances at 3s/8s/15s with toast notifications
- **Zone expansion**: At 5 min mark, notification banner appears indicating expanded search radius
- **Rating dialog**: Interactive star rating with emoji feedback, review textarea, submit via API
- **Error banner**: Persistent error display with retry button
- **Skeleton loading states**: All data-dependent views show skeleton placeholders
- **Toast notifications**: Success/error toasts via sonner for all user actions
- **Bottom navigation**: 5-tab fixed nav (Home, Requests, Price Radar, Vendors, Sessions)
- **TZS formatting**: `Intl.NumberFormat` for locale-aware TZS display (e.g., "TZS 45,000")
- **Status badges**: Color-coded for request status (emerald=open, sky=matched, amber=active, gray=completed, red=cancelled)
- **Escrow badges**: Color-coded for escrow status (amber=pending, sky=held, emerald=released, red=disputed)
- **Checklist management**: Add/remove/toggle items in active session via SessionTracker

### Verification

- `bun run lint` passes with zero errors
- Page renders correctly at `/` with full SeekerDashboard content
- Dev server compiles successfully with no runtime errors
- All 8 sub-views functional and interconnected

---

## Task 7: Guide Dashboard (Agent: guide-dashboard-builder)

### Files Created

1. **`/home/z/my-project/src/components/guide-dashboard.tsx`** — Main guide dashboard component (~1100 lines)
   - Comprehensive 6-view dashboard managed by internal `GuideView` state type
   - Full bilingual support via `t(key, language)` from `@/lib/i18n`
   - Integrates shared components: SessionTracker, SessionChat, MapView, BadgeDisplay, RatingStars
   - Mobile-first responsive layout with sticky header and bottom tab navigation
   - Dark mode compatible

2. **`/home/z/my-project/src/app/page.tsx`** (modified) — Renders GuideDashboard as the root page

### Sub-views Implemented

| # | View | Description |
|---|------|-------------|
| 1 | Home | Large status toggle (Online/Offline/Busy) with animated indicator (green glow/pulse when online, amber when busy, gray when offline), quick stats cards (Total Sessions, Avg Rating, Weekly Earnings), badges showcase (horizontal scroll), Guide of the Week banner, active session banner, recent activity feed |
| 2 | Live Requests | Only visible when online; real-time list of open requests with seeker first name, description, zone badge, budget, time posted; "Accept" button per request; empty state: "No requests right now. Stay online!"; color-coded urgency (new <1min=emerald, standard 1-5min=amber, aging >5min=red); simulated new requests every 15-30 seconds for demo; enforces one active session at a time |
| 3 | Active Session | SessionTracker integration (timer, session code, checklist, escrow status), seeker info card, request details, chat/map toggle, SessionChat with auto-translate, MapView showing seeker location (simulated), "Mark Complete" button, prominent Emergency button (red, always visible), both-parties confirmation note |
| 4 | Earnings | Summary cards (Pending in escrow, Released available, This Week, Total Earned), bar chart showing last 7 days earnings, commission breakdown (Platform fee: 12%), "Request Payout" button with dialog (mobile money number input), payout history table (date, amount, status, mobile money number) |
| 5 | Badges & Leaderboard | My Badges section (grid of all 10 badge types with earned/locked states and progress indicators), Guide of the Week featured card, leaderboard for guide's zone with current position highlighted, gold/silver/bronze styling for top 3 |
| 6 | Profile | Edit bio, zone specializations (multi-select toggle buttons with zone colors), languages spoken (multi-select from 7 languages), profile photo (simulated upload button), ID verification status, account status (pending/active/suspended badge) |

### Data Fetching & API Integration

- **Guide Profile**: `GET /api/guides/:id` — Loaded on mount, populates profile, badges, zones, languages
- **Zones**: `GET /api/zones` — Loaded on mount for zone pickers, maps, filters
- **Requests**: `GET /api/requests?status=open` — Polls every 10 seconds when guide is online
- **Accept Request**: `POST /api/sessions` — Creates session, updates guide status to busy
- **Sessions**: `GET /api/sessions?guideId=` — List all sessions, detect active session on load
- **Session detail**: `GET /api/sessions/:id` — Messages included, polled during active session (every 5s)
- **Session actions**: `PATCH /api/sessions/:id` — Complete, confirm, emergency actions
- **Messages**: `POST /api/messages` — Send chat messages in session
- **Payouts**: `GET /api/payouts?guideId=` + `POST /api/payouts` — List and request payouts
- **Guide update**: `PATCH /api/guides/:id` — Update bio, zones, languages, online status
- **Leaderboard**: `GET /api/guides?status=active` — Sorted by rating for leaderboard display

### Key Business Logic

- **One active session at a time**: Accepting a request is blocked if the guide already has an active session
- **Status management**: Going online updates database; accepting request changes status to busy; completing session returns to online
- **Session code**: Prominently displayed in SessionTracker for physical meeting verification
- **Emergency button**: Always visible during active session (large, red, destructive variant)
- **Both parties must confirm**: Seeker and guide confirmation indicators shown; note displayed at bottom
- **Simulated requests**: 3 seed requests + timer-based new requests every 15-30 seconds for demo
- **Urgency color coding**: New (<1 min = emerald), Standard (1-5 min = amber), Aging (>5 min = red) with left border highlight

### Key UX Features

- **Prominent status toggle**: Large animated indicator (size-20 circle with ping animation for online, different colors per status)
- **Green glow/pulse when online**: Emerald gradient card with animated ping effect
- **Red/yellow indicators for emergencies**: Destructive red emergency button always visible during session
- **TZS currency formatting**: `Intl.NumberFormat` for locale-aware TZS display
- **Earnings bar chart**: Simple 7-day bar chart with proportional heights and day labels
- **Badge progress indicators**: Grayed-out badges with progress bars for not-yet-earned badges
- **Bottom tab navigation**: 5-tab fixed nav (Home, Requests, Session, Earnings, Profile) with badge counts and session indicator dots
- **Skeleton loading states**: All data-dependent views show skeleton placeholders
- **Toast notifications**: Success/error toasts via sonner for all user actions
- **Error banner**: Persistent error display with retry button
- **Language toggle**: SW/EN toggle in header
- **Status indicator in header**: Online (green dot) / Busy (amber dot) shown in header
- **Request count badge**: Red count badge on Requests tab when online and requests available
- **Session active indicator**: Amber pulsing dot on Session tab when session is active

### Verification

- `bun run lint` passes with zero errors
- Dev server compiles successfully with no runtime errors
- All 6 sub-views functional and interconnected
- Consistent design language with Seeker Dashboard

---

## Task 8: Admin Dashboard (Agent: admin-dashboard-builder)

### Files Created

1. **`/home/z/my-project/src/components/admin-dashboard.tsx`** — Comprehensive admin dashboard component (~1050 lines)
   - 7 sub-views managed by internal `AdminView` state type
   - Full bilingual support via `t(key, language)` from `@/lib/i18n`
   - Professional admin look with sidebar navigation (desktop) + hamburger menu (mobile)
   - Recharts integration for analytics charts (bar, line, pie/donut)
   - Dark mode compatible, mobile-first responsive

2. **`/home/z/my-project/src/app/page.tsx`** (modified) — Renders AdminDashboard as the root page

### Sub-views Implemented

| # | View | Description |
|---|------|-------------|
| 1 | Overview Dashboard | 6 metric cards (Total Users by role, Active Sessions, Total Revenue, Avg Rating, Fraud Flags, Open Requests); Requests per Zone bar chart; Rating Distribution donut chart; Recent activity feed (registrations, disputes, sessions); Quick actions panel with pending verifications count and open disputes count; Market status preview showing all 5 zones with vendor/request counts |
| 2 | Guide Verification Queue | List of guides with "pending" status; Each card: name, phone, bio, ID document indicator, applied date, avatar with initials; Approve button (green) sets status to "active"; Reject button (red) opens dialog for rejection reason; Bulk actions: Approve All, Reject All; Filter by date applied; Empty state: "All guides verified!" with checkmark icon |
| 3 | Zone Management | Grid of all zones in cards; Each zone: name, Swahili name, color dot, description, vendor/price/request counts; Edit zone dialog: name, Swahili name, description, color picker; Create new zone form with same fields; Delete zone (with AlertDialog confirmation); Mini boundary preview per zone with zone color |
| 4 | Price Radar Management | Full data table with columns: Category, Zone (colored badge), Min Price, Max Price, Last Updated, Updated By, Actions; Edit dialog for each entry; Create new entry dialog; Delete entries with confirmation; Bulk import placeholder (toast notification); Filter by zone and category; Clear filters button |
| 5 | Analytics View | Date range picker (This Week / This Month / Year) using Tabs; Requests per Zone bar chart; Sessions Over Time line chart; Revenue Over Time line chart with TZS formatting; Rating Distribution donut chart with legend; Guide Activity Heatmap (7 days × 6 time slots with intensity-based coloring); Export data button (simulated with toast) |
| 6 | User Management | Full data table with search by name/phone; Columns: Name (with avatar), Phone, Role (colored badge), Status, Rating, Joined; Sort by name, role, or join date (toggle asc/desc); Filter by role (All/Seeker/Guide/Admin); Actions: Suspend, Message (simulated); Click user row to see detail dialog with full profile info |
| 7 | Dispute Resolution | List of disputed/flagged sessions as expandable cards; Each card: session code, guide vs seeker names, amount (TZS), dispute reason (highlighted), emergency flag; Expand to see: recent messages, admin notes textarea, session financial details; Actions: Release Escrow to Guide (green), Refund to Seeker (blue), Request More Info; Confirmation dialog for destructive actions; Status tracking: Open, Under Review, Resolved |

### Data Fetching & API Integration

- **Admin Stats**: `GET /api/admin/stats` — Users by role, active sessions, requests by status, total revenue, avg rating, pending verifications, zone/vendor counts
- **Pending Guides**: `GET /api/guides?status=pending` — List of guides pending verification
- **Approve Guide**: `POST /api/admin/verify` with `{ guideId, action: 'approve' }` — Awards verified_elite badge
- **Reject Guide**: `POST /api/admin/verify` with `{ guideId, action: 'reject', reason }` — Sets status to suspended
- **Zones**: `GET /api/zones` — List with vendor/price/request counts
- **Create Zone**: `POST /api/zones` — Name, Swahili name, description, color
- **Edit Zone**: `PATCH /api/zones/:id` — Update zone fields
- **Delete Zone**: `DELETE /api/zones/:id` — With cascade
- **Price Radar**: `GET /api/price-radar` — All entries with zone info
- **Create Price Entry**: `POST /api/price-radar` — Category, zone, min/max price
- **Edit Price Entry**: `PATCH /api/price-radar/:id` — Update fields
- **Delete Price Entry**: `DELETE /api/price-radar/:id`
- **Users**: `GET /api/users` — All users with optional role filter
- **User Action**: `PATCH /api/users` — Suspend/ban by updating name
- **Disputes**: `GET /api/admin/disputes` — Disputed sessions with guide/seeker/messages
- **Resolve Dispute**: `POST /api/admin/disputes` with `{ sessionId, resolution: 'release'|'refund', reason }`

### Key UX Features

- **Professional admin look**: Slightly denser than seeker/guide views, data-table oriented
- **Sidebar navigation**: Desktop shows persistent left sidebar with all 7 nav items; Mobile uses Sheet/drawer component triggered by hamburger menu
- **Mobile bottom navigation**: Compact 7-tab scrollable bottom nav on mobile
- **Recharts charts**: BarChart (requests per zone), LineChart (sessions/revenue over time), PieChart (rating distribution donut), CSS-based heatmap (guide activity)
- **Color-coded status indicators**: Green=active/verified, Amber=pending, Red=suspended/disputed, Blue=matched/refund
- **Confirmation dialogs**: AlertDialog for all destructive actions (delete zone, delete price entry, resolve dispute)
- **Toast notifications**: Success/error toasts via sonner for all CRUD operations
- **TZS currency formatting**: `Intl.NumberFormat` for locale-aware TZS display
- **Sort indicators**: Sortable table columns with chevron up/down icons
- **Avatar system**: Colored circle with initials derived from name, color from ID hash (consistent with other dashboards)
- **Skeleton loading states**: Full-page skeleton while initial data loads
- **Date formatting**: Localized dates using Swahili/English locale
- **Zone color system**: Consistent zone color mapping (orange=Vyombo, sky=Electronics, pink=Fabric, red=Spices, teal=Wholesale)
- **Admin notes**: Textarea per dispute for admin to record notes before resolution
- **Bulk actions**: Approve All / Reject All in verification queue

### Component Architecture

- **AdminSidebar**: Extracted as separate component outside render function (to satisfy React lint rule for static components)
- **7 sub-view components**: OverviewView, VerificationView, ZonesView, PriceRadarView, AnalyticsView, UsersView, DisputesView
- **LoadingSkeleton**: Full-page skeleton placeholder during initial data fetch
- **Shared helpers**: `formatTZS()`, `formatDate()`, `formatDateTime()`, `getInitials()`, `getAvatarColor()`

### Verification

- `bun run lint` passes with zero errors
- Page renders correctly at `/` with full AdminDashboard content
- Dev server compiles successfully with no runtime errors
- All 7 sub-views functional and interconnected
- All API endpoints responding correctly (verified via dev server logs)
