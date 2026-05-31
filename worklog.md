---
Task ID: 4
Agent: Main Agent
Task: M-Pesa Daraja API Integration, End-to-End Booking Flow, Security Hardening

Work Log:
- Read worklog.md and all existing files: wallet page, seeker/guide bookings pages, session page, middleware, auth route, prisma schema, auth store
- Created /src/lib/mpesa.ts: M-Pesa Daraja API helpers (getAccessToken, generatePassword, initiateSTKPush, querySTKStatus, isDemoMode, generateMockReceipt) - supports sandbox/production and demo mode fallback
- Created /src/app/api/payments/mpesa/stk-push/route.ts: STK Push endpoint with input sanitization, demo mode
- Created /src/app/api/payments/mpesa/callback/route.ts: Daraja callback handler, extracts transaction result, always returns success to Safaricom
- Created /src/app/api/payments/mpesa/status/route.ts: Query STK Push transaction status
- Updated /src/app/(app)/wallet/page.tsx: Added M-Pesa Top Up section with phone input, preset amounts (5K/10K/25K/50K TZS), STK Push integration with pending/success/failed states, receipt display, Swahili i18n
- Created /src/app/api/bookings/route.ts: GET (list bookings for seeker/guide) and POST (create booking) with demo data fallback
- Created /src/app/api/bookings/[id]/route.ts: GET (single booking detail) and PATCH (update status - confirm/start/complete/cancel/dispute/review) with demo fallback
- Created /src/components/booking-card.tsx: Reusable SeekerBookingCard and GuideBookingCard components with status badges, payment badges, timeline, action buttons
- Updated /src/app/(app)/seeker/bookings/page.tsx: Tab filters (Upcoming/Active/Completed/Cancelled), "Book a Guide" CTA, cancel/dispute/review dialogs
- Updated /src/app/(app)/guide/bookings/page.tsx: Tab filters (Pending/Confirmed/Active/Completed), earnings summary, accept/reject/start session/end session buttons
- Updated /src/app/(app)/seeker/session/[id]/page.tsx: Full session detail with status timeline, chat, QR check-in, live location, payment status, review/rating section
- Created /src/lib/rate-limit.ts: In-memory rate limiter with per-identifier sliding window, pre-configured limiters (api: 100/min, auth: 10/min, payment: 5/min, booking: 20/min)
- Created /src/lib/sanitize.ts: Input sanitization utilities (sanitizeString, sanitizePhone, sanitizeEmail, sanitizeNumber, sanitizeBookingStatus, sanitizeRole)
- Updated /src/middleware.ts: Added rate limiting for API/auth/payment routes, CSRF origin validation for state-changing methods, security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) - all existing RBAC logic preserved
- Updated /src/app/api/auth/route.ts: Added rate limiting (5 attempts/min per IP), input sanitization for phone/email/name/role - all existing logic preserved
- Verified all APIs working: bookings (seeker+guide), M-Pesa STK push, M-Pesa status, booking detail, booking PATCH, security headers, CSRF protection, rate limiting

Stage Summary:
- 4 new API route files: /api/payments/mpesa/stk-push, /callback, /status; /api/bookings, /api/bookings/[id]
- 2 new lib files: mpesa.ts, rate-limit.ts, sanitize.ts
- 4 updated pages: wallet, seeker/bookings, guide/bookings, seeker/session/[id]
- 1 new component: booking-card.tsx
- 2 updated core files: middleware.ts (security), auth route (rate limiting)
- All features work in demo mode when env vars are missing
- Security: rate limiting, CSRF, security headers, input sanitization all verified

---
Task ID: 4-remaining
Agent: Main Agent
Task: M-Pesa Wallet Top-Up Fix, Middleware Security Headers Hardening, Build Verification

Work Log:
- Read worklog.md and all existing files: wallet page, middleware, status API route, stk-push route, mpesa.ts lib, auth store, rate-limit.ts, sanitize.ts
- Task 1: M-Pesa Top Up already existed in wallet page from previous task. Updated status API to support GET with query params per spec:
  - Added GET handler to /src/app/api/payments/mpesa/status/route.ts that reads CheckoutRequestID from searchParams (?CheckoutRequestID=xxx)
  - Kept existing POST handler for backward compatibility
  - Updated wallet page polling to use GET instead of POST: `fetch('/api/payments/mpesa/status?CheckoutRequestID=...')` instead of POST with JSON body
  - All M-Pesa features preserved: preset amounts (5K/10K/25K/50K TZS), phone pre-fill, STK Push integration, pending/success/failed states, receipt display, wallet balance update
- Task 2: Refactored middleware security headers to apply to ALL responses:
  - Created `withSecurityHeaders()` helper function that adds all 5 security headers to any NextResponse
  - Previously, security headers were only on the initial `NextResponse.next()` — 429, 403, and redirect responses lacked them
  - Now ALL response paths (rate limit 429, CSRF 403, login redirect, role redirects, normal next) go through `withSecurityHeaders()`
  - Moved CSRF protection to run before API-specific logic so it applies to ALL POST/PUT/DELETE/PATCH requests (not just API routes)
  - For non-API routes with invalid origin, returns 403 plain text response with security headers
  - All existing RBAC and auth logic preserved intact
- Task 3: Verified build — `npx next build` completed clean, `bun run lint` passed with no errors

Stage Summary:
- 2 updated files: /src/app/api/payments/mpesa/status/route.ts (added GET handler), /src/middleware.ts (security headers on all responses, CSRF broadened)
- 1 updated file: /src/app/(app)/wallet/page.tsx (status polling uses GET with query params)
- Build and lint both pass clean
- All security headers now guaranteed on every response (429, 403, redirects, normal)
- CSRF protection applies to all routes, not just API
