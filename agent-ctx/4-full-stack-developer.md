# Task 4 - PWA Support

## Agent: full-stack-developer

## Task Summary
Add Progressive Web App (PWA) support to the Kariako Guide platform.

## Files Created/Modified

### 1. `/public/manifest.json` (NEW)
- PWA manifest with all required fields
- name: "Kariako Guide", short_name: "Kariako"
- background_color: #f59e0b (amber-500), theme_color: #d97706 (amber-600)
- Standalone display, portrait-primary orientation, lang: "sw"
- SVG icons at 192x192 and 512x512 (both any and maskable purposes)
- Categories: shopping, travel, lifestyle
- Shortcuts for "Post Request" and "Price Radar"

### 2. `/public/sw.js` (NEW)
- Service worker with cache name 'kariako-guide-v1'
- Precaches: /, /manifest.json, /logo.svg, /robots.txt
- Cache-first strategy for static assets
- Network-first strategy for API calls (/api/*)
- Navigation fallback: tries network, falls back to cached /, ultimate fallback is bilingual offline page
- Cleans up old caches on activate event
- skipWaiting + clients.claim for immediate activation

### 3. `/src/components/pwa-register.tsx` (NEW)
- 'use client' component
- Registers service worker on mount
- Listens for beforeinstallprompt event
- Shows dismissible "Install App" banner at bottom of screen
- Amber/orange themed to match app design
- Bilingual text (Swahili/English) using auth store's language
- Uses shadcn Button component
- Properly typed BeforeInstallPromptEvent interface

### 4. `/src/app/layout.tsx` (MODIFIED)
- Added Viewport export with themeColor: #d97706
- Added manifest: "/manifest.json" to metadata
- Updated icons to use /logo.svg (local) instead of CDN
- Added appleWebApp metadata (capable, statusBarStyle, title)
- Added <head> tags: manifest link, theme-color meta, apple-touch-icon links, apple-mobile-web-app meta tags
- Imported and rendered PWARegister component

## Verification
- Lint passes clean with zero errors
- Dev server compiles and serves pages successfully
