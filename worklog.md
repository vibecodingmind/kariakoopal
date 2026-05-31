---
Task ID: 1
Agent: Main Agent
Task: Remove landing page, make home the direct market exploration experience

Work Log:
- Read and analyzed all existing files: page.tsx, app-shell.tsx, (app)/layout.tsx, market/page.tsx, vendors/page.tsx, guides/page.tsx, prices/page.tsx, events/page.tsx, stories/page.tsx, market/[zoneId]/page.tsx, vendors/[id]/page.tsx, guides/[id]/page.tsx
- Cleared .next cache (181MB) to fix HMR error from previous session
- Deleted src/app/page.tsx (old 537-line landing page with hero, security, how-it-works sections)
- Created src/app/(app)/page.tsx - new direct market exploration home page with: hero search section, live market stats, 6 market zones grid, hot prices with live indicators, featured vendors carousel, top guides list, CTA sections
- Updated src/components/app-shell.tsx: removed isLanding check (shell now shows on /), updated public bottom nav to have Home as first tab, kept shell hidden only on /auth
- Updated src/app/auth/page.tsx: changed redirect from /dashboard to / after login
- Updated src/app/(app)/dashboard/page.tsx: seekers now redirect to / instead of /seeker
- Fixed syntax error in (app)/page.tsx: missing closing brace `)}` on line 401
- Verified production build succeeds with all 60 pages
- Tested all 11 key pages: /, /market, /vendors, /guides, /prices, /events, /stories, /auth, /market/electronics, /vendors/v1, /guides/g1 - all return 200

Stage Summary:
- Landing page removed; home (/) now directly shows market exploration
- AppShell (top header + bottom nav) now visible on home page
- Bottom nav for public users: Home, Guides, Prices, Events, Vendors
- All 11 tested pages working with 200 status codes
- Production build clean with no errors
