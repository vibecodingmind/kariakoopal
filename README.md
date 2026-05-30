# Kariako Guide

**Connect with verified local market guides in Kariakoo, Dar es Salaam.**

_Kariako Guide — Ungana na miongozo wa soko wa Kariakoo, Dar es Salaam._

> Kariako Guide is a marketplace platform that connects tourists and buyers to trusted, verified local guides in Kariakoo — East Africa's largest open market. Navigate the market like a local, find fair prices, and explore with confidence.

## Screenshots

<!-- Add screenshots here once deployed -->
<!-- ![Seeker Dashboard](./docs/screens/seeker.png) -->
<!-- ![Guide Dashboard](./docs/screens/guide.png) -->
<!-- ![Admin Dashboard](./docs/screens/admin.png) -->

---

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                           |
| Language        | TypeScript 5                                      |
| Styling         | Tailwind CSS 4 + shadcn/ui (New York style)       |
| Database        | Prisma ORM + SQLite                               |
| State           | Zustand (client) + TanStack Query (server)        |
| Realtime        | Socket.io (mini-service on port 3003)             |
| Charts          | Recharts                                          |
| Animations      | Framer Motion                                     |
| i18n            | Custom Swahili/English system (224+ keys)         |
| Icons           | Lucide React                                      |

---

## Features

### For Seekers (Tourists / Buyers)
- Post help requests describing what you need and your budget
- Get matched with verified guides in the relevant market zones
- Live matching view with real-time guide arrivals
- In-session chat with auto-translation (Swahili ↔ English)
- Live GPS tracking of your guide
- Emergency button with admin escalation
- Rate and review after session completion
- Price Radar — check fair market prices before you buy
- Vendor directory with zone-based browsing

### For Guides
- Toggle online/offline/busy status with animated indicator
- Receive live requests from seekers in your zones
- Accept requests and start guided sessions
- In-session chat and location sharing
- Earnings dashboard with 7-day bar chart
- Payout management (mobile money)
- Badge and leaderboard system
- Profile management with bio, zones, and languages

### For Admins
- Platform overview with key metrics and charts
- Guide verification queue (approve / reject with reason)
- Zone management (CRUD)
- Price Radar management (CRUD)
- Analytics with Recharts (bar, line, donut charts)
- User management with role filtering
- Dispute resolution (release escrow / refund)

### Platform-Wide
- Bilingual interface: Swahili (default) and English
- Dark mode support
- Mobile-first responsive design
- Onboarding flow for new seekers
- Quick demo login (Seeker / Guide / Admin)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Browser / Mobile                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Seeker   │  │ Guide    │  │ Admin    │               │
│  │ Dashboard│  │ Dashboard│  │ Dashboard│               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │                      │
│       └──────────┬───┴──────────────┘                     │
│                  │                                        │
│       ┌──────────▼──────────┐                             │
│       │  Next.js App Shell  │                             │
│       │  (Single-Page App)  │                             │
│       └──────┬──────┬───────┘                             │
│              │      │                                     │
│   ┌──────────▼┐  ┌──▼──────────────┐                     │
│   │ REST API   │  │ Socket.io       │                     │
│   │ /api/*     │  │ (port 3003)     │                     │
│   └──────┬─────┘  └───────┬─────────┘                     │
│          │                │                                │
│   ┌──────▼────────────────▼──────┐                        │
│   │     Prisma ORM + SQLite      │                        │
│   └──────────────────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

- **Next.js** serves the frontend SPA and all REST API routes.
- **Socket.io mini-service** runs on a separate process (port 3003) for realtime events.
- **Caddy** gateway routes requests based on `XTransformPort` query parameter.
- **SQLite** via Prisma handles all persistent data.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18 (for Next.js compatibility)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-project

# Install dependencies
bun install
```

### Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your actual values (see .env.example for descriptions)
```

The minimal required variable for local development:

```env
DATABASE_URL="file:./dev.db"
```

All other services (Africa's Talking, Flutterwave, Mapbox, Cloudinary, Firebase) are optional for development — the app runs with demo data and mock flows without them.

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to SQLite database
bun run db:push
```

### Seeding

Populate the database with realistic Kariakoo market data:

```bash
bun run db:seed
```

This creates:
- 5 zones (Vyombo, Electronics, Fabric, Spices, Wholesale)
- 10 guide profiles (7 active, 2 pending, 1 suspended)
- 3 seekers + 1 admin
- 20 vendors across all zones
- 50 price radar entries
- Badges, requests, sessions, messages, and payouts

### Running the Realtime Service

The Socket.io service must be started separately:

```bash
cd mini-services/realtime-service
bun install
bun run dev
```

This starts the realtime server on port 3003. The main Next.js app connects via the Caddy gateway using `XTransformPort=3003`.

### Running the App

The dev server is started automatically. To run manually:

```bash
bun run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
my-project/
├── prisma/
│   ├── schema.prisma          # Database schema (11 models)
│   └── seed.ts                # Seed script with Kariakoo data
├── src/
│   ├── app/
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # POST /api/auth
│   │   │   ├── users/         # GET/PATCH /api/users
│   │   │   ├── guides/        # GET /api/guides, GET/PATCH /api/guides/[id]
│   │   │   ├── requests/      # GET/POST /api/requests, GET/PATCH /api/requests/[id]
│   │   │   ├── sessions/      # GET/POST /api/sessions, GET/PATCH /api/sessions/[id]
│   │   │   ├── messages/      # GET/POST /api/messages
│   │   │   ├── vendors/       # GET/POST /api/vendors
│   │   │   ├── zones/         # GET/POST /api/zones, GET/PATCH/DELETE /api/zones/[id]
│   │   │   ├── price-radar/   # GET/POST /api/price-radar, PATCH/DELETE /api/price-radar/[id]
│   │   │   ├── payouts/       # GET/POST /api/payouts
│   │   │   ├── badges/        # GET/POST /api/badges
│   │   │   └── admin/         # GET /api/admin/stats, POST /api/admin/verify, GET/POST /api/admin/disputes
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Main SPA entry (auth + role-based routing)
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (40+)
│   │   ├── seeker-dashboard.tsx   # Seeker view (8 sub-views)
│   │   ├── guide-dashboard.tsx    # Guide view (6 sub-views)
│   │   ├── admin-dashboard.tsx    # Admin view (7 sub-views)
│   │   ├── session-chat.tsx       # Chat component
│   │   ├── session-tracker.tsx    # Live GPS tracker
│   │   ├── vendor-directory.tsx   # Vendor browser
│   │   ├── price-radar-panel.tsx  # Price comparison
│   │   ├── leaderboard.tsx        # Guide leaderboard
│   │   ├── onboarding.tsx         # First-time seeker flow
│   │   ├── language-toggle.tsx    # SW/EN switch
│   │   └── …                     # Other shared components
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── utils.ts           # Tailwind merge utility
│   │   ├── i18n.ts            # Bilingual translations (224+ keys)
│   │   └── stores/            # Zustand stores
│   │       ├── auth-store.ts  # Auth state (persisted)
│   │       ├── session-store.ts # Session state
│   │       ├── guide-store.ts # Guide dashboard state
│   │       └── app-store.ts   # App-wide state (persisted)
│   └── hooks/
│       └── use-mobile.ts      # Mobile detection hook
├── mini-services/
│   └── realtime-service/
│       ├── index.ts           # Socket.io server
│       └── package.json       # Separate bun project
├── docs/
│   ├── API.md                 # API reference
│   └── ERD.md                 # Entity relationship diagram
├── .env.example               # Environment variable template
├── Caddyfile                  # Gateway config
├── package.json               # Scripts and dependencies
└── worklog.md                 # Development work log
```

---

## Deployment

### Vercel (Frontend + API)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set all environment variables from `.env.example` in the Vercel dashboard.
4. For production, switch `DATABASE_URL` to a managed PostgreSQL or MySQL connection string and update `prisma/schema.prisma` accordingly.
5. Deploy.

### Railway / Render (Realtime Service)

1. Create a new service on [Railway](https://railway.app) or [Render](https://render.com).
2. Point it to the `mini-services/realtime-service` directory.
3. Set `SOCKET_PORT` to the port assigned by the platform.
4. Deploy.
5. Update the frontend's Socket.io connection URL to point to the deployed service.

### Production Database

For production, replace SQLite with PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Run `bun run db:push` or `bun run db:migrate` to create tables.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request.

### Guidelines

- Write TypeScript throughout — no `any` types.
- Use existing shadcn/ui components; avoid building UI from scratch.
- Follow the existing project structure and naming conventions.
- Ensure mobile-first responsive design.
- Test both Swahili and English text for any new UI.
- Run `bun run lint` before submitting — zero errors required.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Contact

**Kariako Guide Team**

- Project: [GitHub Repository](https://github.com/kariako-guide)
- Location: Kariakoo, Dar es Salaam, Tanzania
- Email: hello@kariako.guide
