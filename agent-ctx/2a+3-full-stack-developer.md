# Task 2a + 3 — Google Map Component, Social Login, Dashboard Integration

## Agent: full-stack-developer

## Completed Work

### 1. GoogleMap Component (`/src/components/google-map.tsx`)
- Enhanced interactive SVG map of Kariakoo with hybrid approach (Google Maps API key check → SVG fallback)
- Real Kariakoo coordinates used for all 5 zones
- Zone polygons with gradient fills and interactive hover/click
- Street grid pattern (12 paths), building shapes (20 rectangles)
- Animated guide markers (pulsing green), vendor markers (store icons), user location (pulsing blue)
- Compass rose, scale indicator, Kariakoo title label
- Zoom controls (+/-), pan/drag, wheel zoom
- Search/filter for zones, "Center on me" button
- Zone detail panel with vendor/guide counts
- All glassmorphism styling using .glass-card, .gradient-border classes
- Dark/light theme support

### 2. SocialLogin Component (`/src/components/social-login.tsx`)
- Three glass-styled social login buttons (Google, Facebook, Apple)
- Google: white/light glass with colored gradient "G"
- Facebook: blue-tinted glass with "f" icon
- Apple: dark glass with Apple SVG icon
- Gradient-border effect, hover lift + glow, per-provider loading spinner
- Divider with i18n "or" text

### 3. i18n Keys Added
- sign_in_google, sign_in_facebook, sign_in_apple, or_divider (Swahili + English)

### 4. Dashboard Updates
- seeker-dashboard.tsx: 2 MapView → GoogleMap replacements
- guide-dashboard.tsx: 1 MapView → GoogleMap replacement
- All props mapped to GoogleMap format

### Verification
- ESLint: zero errors
- Dev server: compiles successfully
