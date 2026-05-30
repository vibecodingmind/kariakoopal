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
