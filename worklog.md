---
Task ID: 1
Agent: Main
Task: Fix runtime error and make all features functional

Work Log:
- Cleared `.next` cache directory to fix Turbopack HMR module factory error
- Refactored `src/lib/i18n.ts` (1300+ lines) into split modules:
  - `src/lib/i18n/sw.ts` - Swahili translations
  - `src/lib/i18n/en.ts` - English translations
  - `src/lib/i18n.ts` - Main module that imports and re-exports
- Added NextAuth with Google/Facebook OAuth providers at `src/app/api/auth/[...nextauth]/route.ts`
- Created social login API endpoint at `src/app/api/auth/social/route.ts`
- Updated auth API route to handle email-based lookups
- Wired SocialLogin component to NextAuth `signIn()` calls
- Updated AuthScreen to use NextAuth sign-in for Google/Facebook
- Added `NextAuthSessionSync` component to bridge NextAuth sessions into Zustand store
- Created `Providers` component wrapping `SessionProvider`
- Updated Prisma schema with `email` field on User model
- Enhanced Google Maps with real API support via `@react-google-maps/api`:
  - Created `src/components/real-google-map.tsx` with full Google Maps integration
  - Created `src/lib/map-data.ts` with Kariakoo zone polygon coordinates
  - Updated `google-map.tsx` to conditionally render real map or SVG fallback
- Verified all feature components (HagglingAssistant, ShoppingList, GroupTour, etc.) are already wired to real API data
- Verified all 3 dashboards (Seeker, Guide, Admin) make real API calls
- Final build compiles cleanly with zero errors
- Database seeded with 5 zones, 1 admin, 3 seekers, 10 guides, 20 vendors, 50 price entries, etc.

Stage Summary:
- Runtime error fixed by clearing HMR cache and refactoring i18n.ts into smaller modules
- NextAuth social login fully integrated with Google/Facebook providers
- Google Maps enhanced with real API support (SVG fallback when no API key)
- All features confirmed functional with real API calls
- Production build passes cleanly
