# Kariako Guide — API Reference

Base URL: `http://localhost:3000/api`

All endpoints return JSON. Standard error format:

```json
{ "error": "Description of the error" }
```

---

## Table of Contents

- [Auth](#auth)
- [Users](#users)
- [Guides](#guides)
- [Requests](#requests)
- [Sessions](#sessions)
- [Messages](#messages)
- [Vendors](#vendors)
- [Zones](#zones)
- [Price Radar](#price-radar)
- [Payouts](#payouts)
- [Badges](#badges)
- [Admin — Stats](#admin--stats)
- [Admin — Verify](#admin--verify)
- [Admin — Disputes](#admin--disputes)
- [Socket.io Events](#socketio-events)

---

## Auth

### POST /api/auth

Authenticate or register a user by phone number. If the phone does not exist a new user is created.

**Request Body**

| Field  | Type   | Required | Description                         |
| ------ | ------ | -------- | ----------------------------------- |
| phone  | string | Yes      | Phone number (e.g. `+255712000001`) |
| name   | string | No*      | Display name — required for new users |

\* If the phone is not found and `name` is omitted, the request returns **400**.

**Response `200`** — Existing user logged in

```json
{
  "user": {
    "id": "clx…",
    "phone": "+255712000001",
    "name": "Hamisi Juma",
    "role": "guide",
    "languagePref": "sw",
    "avatarUrl": null,
    "createdAt": "2024-12-01T08:00:00.000Z",
    "updatedAt": "2024-12-15T10:30:00.000Z"
  },
  "token": "token_clx…_1734000000000"
}
```

An `auth_token` cookie is set (httpOnly, 7-day max-age).

**Status Codes**

| Code | Meaning                         |
| ---- | ------------------------------- |
| 200  | User authenticated / registered |
| 400  | Missing phone or name           |
| 500  | Server error                    |

---

## Users

### GET /api/users

List all users, optionally filtered by role.

**Query Parameters**

| Param | Type   | Description                          |
| ----- | ------ | ------------------------------------ |
| role  | string | Filter by role: `seeker`, `guide`, `admin` |

**Response `200`**

```json
{
  "users": [ { "id": "…", "phone": "…", "name": "…", "role": "…", … } ]
}
```

### PATCH /api/users

Update user profile fields.

**Request Body**

| Field        | Type   | Required | Description            |
| ------------ | ------ | -------- | ---------------------- |
| id           | string | Yes      | User ID to update      |
| name         | string | No       | New display name       |
| languagePref | string | No       | `sw` or `en`           |
| avatarUrl    | string | No       | URL to avatar image    |

**Response `200`**

```json
{ "user": { "id": "…", "name": "…", … } }
```

**Status Codes**

| Code | Meaning          |
| ---- | ---------------- |
| 200  | Updated          |
| 400  | Missing id       |
| 404  | User not found   |
| 500  | Server error     |

---

## Guides

### GET /api/guides

List guide profiles with their user info and badges.

**Query Parameters**

| Param  | Type   | Description                                   |
| ------ | ------ | --------------------------------------------- |
| status | string | Filter by profile status: `pending`, `active`, `suspended` |

**Response `200`**

```json
{
  "guides": [
    {
      "id": "…",
      "userId": "…",
      "bio": "…",
      "status": "active",
      "zones": "[\"zone_id_1\"]",
      "languages": "[\"sw\",\"en\"]",
      "avgRating": 4.8,
      "totalSessions": 187,
      "isOnline": true,
      "currentStatus": "online",
      "user": { "id": "…", "name": "Hamisi Juma", "phone": "…", "avatarUrl": null, "languagePref": "sw" },
      "badges": [ { "id": "…", "badgeType": "verified_elite", … } ]
    }
  ]
}
```

### GET /api/guides/[id]

Get a single guide profile by its profile ID.

**Response `200`** — Same shape as a single guide object above.

**Status Codes**: 200 | 404 | 500

### PATCH /api/guides/[id]

Update a guide profile.

**Request Body**

| Field     | Type     | Required | Description                                |
| --------- | -------- | -------- | ------------------------------------------ |
| bio       | string   | No       | Bio text                                   |
| zones     | string[] | No       | Array of zone IDs (stored as JSON)         |
| languages | string[] | No       | Array of language codes (stored as JSON)   |
| status    | string   | No       | `pending`, `active`, `suspended`           |

**Response `200`** — Updated guide profile with user and badges.

---

## Requests

### GET /api/requests

List requests with seeker and zone info.

**Query Parameters**

| Param    | Type   | Description                                        |
| -------- | ------ | -------------------------------------------------- |
| status   | string | `open`, `matched`, `active`, `completed`, `cancelled` |
| zoneId   | string | Filter by zone (many-to-many)                      |
| seekerId | string | Filter by seeker user ID                           |

**Response `200`**

```json
{
  "requests": [
    {
      "id": "…",
      "seekerId": "…",
      "description": "Looking for quality kitchenware",
      "zoneIds": "[\"zone_id\"]",
      "budget": 80000,
      "photoUrl": null,
      "status": "open",
      "createdAt": "…",
      "updatedAt": "…",
      "seeker": { "id": "…", "name": "…", "phone": "…", "avatarUrl": null },
      "zones": [ { "id": "…", "name": "Vyombo Zone", "nameSw": "Eneo la Vyombo", "color": "#E67E22" } ]
    }
  ]
}
```

### POST /api/requests

Create a new help request.

**Request Body**

| Field       | Type     | Required | Description                          |
| ----------- | -------- | -------- | ------------------------------------ |
| seekerId    | string   | Yes      | User ID of the seeker                |
| description | string   | Yes      | What the seeker is looking for       |
| zoneIds     | string[] | No       | Zone IDs for the request             |
| budget      | number   | No       | Budget in TZS (default 0)           |
| photoUrl    | string   | No       | Optional photo URL                   |

**Response `201`** — Created request with seeker and zones.

### GET /api/requests/[id]

Get a single request with seeker, zones, and any sessions.

**Response `200`**

```json
{
  "request": {
    "id": "…",
    "seeker": { … },
    "zones": [ … ],
    "sessions": [ { "id": "…", "guide": { … }, "seeker": { … } } ]
  }
}
```

### PATCH /api/requests/[id]

Update a request's status.

**Request Body**

| Field  | Type   | Required | Description                                             |
| ------ | ------ | -------- | ------------------------------------------------------- |
| status | string | Yes      | `open`, `matched`, `active`, `completed`, `cancelled`  |

**Response `200`** — Updated request with seeker and zones.

---

## Sessions

### GET /api/sessions

List sessions with guide, seeker, and request info.

**Query Parameters**

| Param    | Type   | Description                                                       |
| -------- | ------ | ----------------------------------------------------------------- |
| guideId  | string | Filter by guide user ID                                          |
| seekerId | string | Filter by seeker user ID                                         |
| status   | string | Filter by escrow status: `pending`, `held`, `released`, `refunded`, `disputed` |

**Response `200`**

```json
{
  "sessions": [
    {
      "id": "…",
      "requestId": "…",
      "guideId": "…",
      "seekerId": "…",
      "sessionCode": "KG-M1Q2Z3",
      "startedAt": "…",
      "completedAt": null,
      "escrowStatus": "held",
      "amount": 15000,
      "platformFee": 1500,
      "ratingSeeker": null,
      "ratingGuide": null,
      "disputeFlag": false,
      "emergencyFlag": false,
      "seekerConfirmed": true,
      "guideConfirmed": true,
      "guide": { "id": "…", "name": "…", "phone": "…", "avatarUrl": null },
      "seeker": { "id": "…", "name": "…", "phone": "…", "avatarUrl": null },
      "request": { "id": "…", "description": "…", "status": "matched" }
    }
  ]
}
```

### POST /api/sessions

Create a new session (guide accepts a request). Automatically:
- Sets request status to `matched`
- Sets guide's `currentStatus` to `busy`
- Generates a unique session code (`KG-xxxxx`)

**Request Body**

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| requestId   | string | Yes      | The request being accepted           |
| guideId     | string | Yes      | Guide user ID                        |
| seekerId    | string | Yes      | Seeker user ID                       |
| amount      | number | No       | Session fee in TZS (default 0)      |
| platformFee | number | No       | Platform commission (default 0)     |

**Response `201`** — Created session with guide, seeker, and request.

### GET /api/sessions/[id]

Get a single session with full detail including messages.

**Response `200`**

```json
{
  "session": {
    "id": "…",
    "guide": { …, "languagePref": "sw" },
    "seeker": { …, "languagePref": "en" },
    "request": { …, "budget": 80000 },
    "messages": [
      {
        "id": "…",
        "sessionId": "…",
        "senderId": "…",
        "content": "Hi!",
        "translatedContent": null,
        "createdAt": "…",
        "sender": { "id": "…", "name": "…", "avatarUrl": null }
      }
    ]
  }
}
```

### PATCH /api/sessions/[id]

Update a session with various actions.

**Request Body**

| Field          | Type   | Required | Description                                    |
| -------------- | ------ | -------- | ---------------------------------------------- |
| action         | string | Yes      | `complete`, `rate`, `dispute`, `emergency`, `confirm` |
| ratingSeeker   | number | No       | Seeker's rating (1-5), used with `rate`        |
| ratingGuide    | number | No       | Guide's rating (1-5), used with `rate`         |
| reviewSeeker   | string | No       | Seeker's review text, used with `rate`         |
| reviewGuide    | string | No       | Guide's review text, used with `rate`          |
| disputeReason  | string | No       | Reason for dispute, used with `dispute`        |
| confirmAs      | string | No       | `seeker` or `guide`, used with `confirm`       |

**Side Effects by Action**

| Action     | Side Effects                                                       |
| ---------- | ------------------------------------------------------------------ |
| `complete` | Sets `completedAt`, `escrowStatus=released`, both confirmed flags. Updates guide profile stats (`totalSessions`, `avgRating`, `currentStatus=online`). Updates request status to `completed`. |
| `rate`     | Sets rating/review fields on the session.                          |
| `dispute`  | Sets `disputeFlag=true`, `escrowStatus=disputed`.                  |
| `emergency`| Sets `emergencyFlag=true`.                                         |
| `confirm`  | Sets `seekerConfirmed` or `guideConfirmed` depending on `confirmAs`. |

**Response `200`** — Updated session.

---

## Messages

### GET /api/messages

List messages for a session.

**Query Parameters**

| Param     | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| sessionId | string | Yes      | Session ID to fetch messages for |

**Response `200`**

```json
{
  "messages": [
    {
      "id": "…",
      "sessionId": "…",
      "senderId": "…",
      "content": "Hello!",
      "translatedContent": "Mambo!",
      "createdAt": "…",
      "sender": { "id": "…", "name": "…", "avatarUrl": null }
    }
  ]
}
```

### POST /api/messages

Send a message in a session.

**Request Body**

| Field             | Type   | Required | Description                       |
| ----------------- | ------ | -------- | --------------------------------- |
| sessionId         | string | Yes      | Target session ID                 |
| senderId          | string | Yes      | User ID of the sender             |
| content           | string | Yes      | Message content                   |
| translatedContent | string | No       | Translated version of the content |

**Response `201`** — Created message with sender info.

---

## Vendors

### GET /api/vendors

List vendors with their zone info.

**Query Parameters**

| Param    | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| zoneId   | string  | Filter by zone ID                                   |
| category | string  | Filter by category (substring match on JSON array)  |
| approved | boolean | Filter by approval status (`true`/`false`)          |

**Response `200`**

```json
{
  "vendors": [
    {
      "id": "…",
      "name": "Kitenge Palace",
      "zoneId": "…",
      "categories": "[\"Kitenge\",\"Vitenge\"]",
      "stallNumber": "F-301",
      "contact": "+255713003001",
      "geoLat": -6.8264,
      "geoLng": 39.2695,
      "approved": true,
      "recommendations": 88,
      "openHours": "8:00-18:00",
      "zone": { "id": "…", "name": "Fabric Zone", "nameSw": "Eneo la Vitenge", "color": "#E91E63" }
    }
  ]
}
```

### POST /api/vendors

Create a new vendor.

**Request Body**

| Field          | Type     | Required | Description                          |
| -------------- | -------- | -------- | ------------------------------------ |
| name           | string   | Yes      | Vendor name                          |
| zoneId         | string   | Yes      | Zone ID where the vendor is located  |
| categories     | string[] | No       | Categories (stored as JSON)          |
| stallNumber    | string   | No       | Stall/booth number                   |
| contact        | string   | No       | Contact phone number                 |
| geoLat         | number   | No       | Latitude (default -6.8264)          |
| geoLng         | number   | No       | Longitude (default 39.2695)         |
| approved       | boolean  | No       | Approval status (default false)     |
| recommendations| number   | No       | Recommendation count (default 0)    |
| openHours      | string   | No       | Opening hours (default "8:00-18:00")|

**Response `201`** — Created vendor with zone info.

---

## Zones

### GET /api/zones

List all zones with counts of vendors, price radar entries, and requests.

**Response `200`**

```json
{
  "zones": [
    {
      "id": "…",
      "name": "Vyombo Zone",
      "nameSw": "Eneo la Vyombo",
      "description": "Kitchenware, utensils…",
      "geoBounds": "{…}",
      "color": "#E67E22",
      "createdAt": "…",
      "updatedAt": "…",
      "_count": { "vendors": 4, "priceRadar": 10, "requests": 3 }
    }
  ]
}
```

### POST /api/zones

Create a new zone.

**Request Body**

| Field       | Type   | Required | Description                            |
| ----------- | ------ | -------- | -------------------------------------- |
| name        | string | Yes      | Zone name (English)                    |
| nameSw      | string | No       | Zone name (Swahili)                    |
| description | string | No       | Zone description                       |
| geoBounds   | object | No       | GeoJSON bounds (stored as JSON string) |
| color       | string | No       | Hex color (default `#4CAF50`)         |

**Response `201`** — Created zone.

### GET /api/zones/[id]

Get a single zone with its vendors, price radar entries, and requests.

**Response `200`**

```json
{
  "zone": {
    "id": "…",
    "name": "…",
    "vendors": [ … ],
    "priceRadar": [ … ],
    "requests": [ { "id": "…", "seeker": { … } } ],
    "_count": { "vendors": 4, "priceRadar": 10, "requests": 3 }
  }
}
```

### PATCH /api/zones/[id]

Update a zone.

**Request Body**

| Field       | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| name        | string | No       | Zone name            |
| nameSw      | string | No       | Swahili name         |
| description | string | No       | Description          |
| geoBounds   | object | No       | GeoJSON bounds       |
| color       | string | No       | Hex color            |

**Response `200`** — Updated zone.

### DELETE /api/zones/[id]

Delete a zone and all its cascading records (vendors, price radar, requests).

**Response `200`**

```json
{ "message": "Zone deleted successfully" }
```

---

## Price Radar

### GET /api/price-radar

List price radar entries with zone info.

**Query Parameters**

| Param    | Type   | Description              |
| -------- | ------ | ------------------------ |
| zoneId   | string | Filter by zone ID        |
| category | string | Filter by exact category |

**Response `200`**

```json
{
  "entries": [
    {
      "id": "…",
      "category": "Aluminium Sufuria (Large)",
      "zoneId": "…",
      "priceMin": 8000,
      "priceMax": 15000,
      "updatedAt": "…",
      "updatedBy": "admin",
      "zone": { "id": "…", "name": "Vyombo Zone", "nameSw": "…", "color": "…" }
    }
  ]
}
```

### POST /api/price-radar

Create a price radar entry.

**Request Body**

| Field     | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| category  | string | Yes      | Item category name        |
| zoneId    | string | Yes      | Zone ID                   |
| priceMin  | number | Yes      | Minimum price (TZS)      |
| priceMax  | number | Yes      | Maximum price (TZS)      |
| updatedBy | string | No       | Updater name (default "admin") |

**Response `201`** — Created entry with zone.

### PATCH /api/price-radar/[id]

Update a price radar entry.

**Request Body**

| Field     | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| category  | string | No       | Category name      |
| zoneId    | string | No       | Zone ID            |
| priceMin  | number | No       | Minimum price      |
| priceMax  | number | No       | Maximum price      |
| updatedBy | string | No       | Updater name       |

`updatedAt` is automatically set to current time.

**Response `200`** — Updated entry with zone.

### DELETE /api/price-radar/[id]

Delete a price radar entry.

**Response `200`**

```json
{ "message": "Price radar entry deleted successfully" }
```

---

## Payouts

### GET /api/payouts

List payouts with guide info.

**Query Parameters**

| Param   | Type   | Description                                      |
| ------- | ------ | ------------------------------------------------ |
| guideId | string | Filter by guide user ID                          |
| status  | string | `pending`, `processed`, `failed`                  |

**Response `200`**

```json
{
  "payouts": [
    {
      "id": "…",
      "guideId": "…",
      "amount": 120000,
      "status": "processed",
      "mobileMoneyNumber": "+255712000001",
      "processedAt": "2024-12-20T10:00:00.000Z",
      "createdAt": "…",
      "guide": { "id": "…", "name": "Hamisi Juma", "phone": "…", "avatarUrl": null }
    }
  ]
}
```

### POST /api/payouts

Create a payout request for a guide.

**Request Body**

| Field             | Type   | Required | Description                       |
| ----------------- | ------ | -------- | --------------------------------- |
| guideId           | string | Yes      | Guide user ID                     |
| amount            | number | Yes      | Payout amount in TZS             |
| mobileMoneyNumber | string | No       | Mobile money number for transfer  |

**Response `201`** — Created payout with guide info.

---

## Badges

### GET /api/badges

List badges with user and guide profile info.

**Query Parameters**

| Param   | Type   | Description              |
| ------- | ------ | ------------------------ |
| guideId | string | Filter by guide user ID  |

**Response `200`**

```json
{
  "badges": [
    {
      "id": "…",
      "guideId": "…",
      "badgeType": "verified_elite",
      "awardedAt": "…",
      "user": { "id": "…", "name": "…", "avatarUrl": null },
      "guideProfile": { "id": "…", "bio": "…", "status": "active" }
    }
  ]
}
```

**Badge Types**: `verified_elite`, `vyombo_specialist`, `fabric_expert`, `spice_master`, `electronics_pro`, `wholesale_guru`, `100_sessions`, `7_day_streak`, `top_rated`, `guide_of_week`

### POST /api/badges

Award a badge to a guide.

**Request Body**

| Field     | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| guideId   | string | Yes      | Guide user ID            |
| badgeType | string | Yes      | Badge type identifier    |

The user must have a guide profile; otherwise returns **400**.

**Response `201`** — Created badge with user and profile.

---

## Admin — Stats

### GET /api/admin/stats

Get platform-wide statistics.

**Response `200`**

```json
{
  "stats": {
    "users": {
      "seekers": 3,
      "guides": 10,
      "admins": 1,
      "total": 14
    },
    "sessions": {
      "active": 1,
      "total": 3
    },
    "requests": {
      "open": 1,
      "matched": 1,
      "completed": 2,
      "cancelled": 0
    },
    "revenue": {
      "total": 5500
    },
    "rating": {
      "average": 4.9
    },
    "guides": {
      "pendingVerification": 2
    },
    "zones": 5,
    "vendors": 20
  }
}
```

---

## Admin — Verify

### POST /api/admin/verify

Approve or reject a guide's verification.

**Request Body**

| Field   | Type   | Required | Description                        |
| ------- | ------ | -------- | ---------------------------------- |
| guideId | string | Yes      | Guide user ID                      |
| action  | string | Yes      | `approve` or `reject`             |
| reason  | string | No       | Optional reason (especially for reject) |

**Side Effects**

- On **approve**: Sets guide profile status to `active` and awards a `verified_elite` badge if not already present.
- On **reject**: Sets guide profile status to `suspended`.

**Response `200`**

```json
{
  "guide": { … },
  "action": "approve",
  "reason": null,
  "newStatus": "active"
}
```

---

## Admin — Disputes

### GET /api/admin/disputes

List all sessions with an active dispute flag, including messages.

**Response `200`**

```json
{
  "disputes": [
    {
      "id": "…",
      "disputeFlag": true,
      "disputeReason": "Guide did not show up",
      "escrowStatus": "disputed",
      "guide": { … },
      "seeker": { … },
      "request": { … },
      "messages": [ … ]
    }
  ]
}
```

### POST /api/admin/disputes

Resolve a dispute by releasing or refunding the escrow.

**Request Body**

| Field      | Type   | Required | Description                      |
| ---------- | ------ | -------- | -------------------------------- |
| sessionId  | string | Yes      | Session with the dispute         |
| resolution | string | Yes      | `release` or `refund`           |
| reason     | string | No       | Admin's resolution reason        |

**Side Effects**

- On **release**: Sets `escrowStatus=released`, creates a payout for the guide (amount minus platform fee), updates guide status to `online`, updates request status to `completed`.
- On **refund**: Sets `escrowStatus=refunded`, updates guide status to `online`, updates request status to `completed`.
- Clears `disputeFlag` and sets `completedAt`.

**Response `200`**

```json
{
  "session": { … },
  "resolution": "release",
  "reason": "Guide completed the task satisfactorily",
  "escrowStatus": "released"
}
```

---

## Socket.io Events

The realtime service runs on **port 3003**. Connect via:

```js
import { io } from 'socket.io-client';
const socket = io('/?XTransformPort=3003');
```

### Client → Server Events

| Event              | Payload                                                                 | Description                                      |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `guide:online`     | `{ userId, zones: string[], location?: { lat, lng } }`                  | Guide comes online; joins zone rooms             |
| `guide:status`     | `{ userId, status: 'online' \| 'offline' \| 'busy' }`                  | Guide updates availability status                |
| `guide:location`   | `{ userId, lat, lng }`                                                  | Guide shares GPS coordinates                     |
| `request:create`   | `{ requestId, seekerId, zoneIds, description?, category? }`             | Seeker creates a help request                    |
| `request:cancel`   | `{ requestId, seekerId }`                                               | Seeker cancels a pending request                 |
| `request:accept`   | `{ requestId, guideId, seekerId, sessionId }`                           | Guide accepts a request                          |
| `request:timeout`  | `{ requestId }`                                                         | Client-side timeout trigger                      |
| `session:start`    | `{ sessionId, guideId, seekerId }`                                      | Both parties start the session                   |
| `session:message`  | `{ sessionId, senderId, senderType, content }`                          | Chat message in a session                        |
| `session:location` | `{ sessionId, senderId, lat, lng }`                                     | Live location share during session               |
| `session:complete` | `{ sessionId, completedBy, completedByType, rating?, review? }`         | End a session                                    |
| `session:emergency`| `{ sessionId, senderId, senderType, message, lat?, lng? }`              | Emergency alert — notifies session + admins      |
| `admin:join`       | `{ adminId }`                                                           | Admin joins the admin room                       |
| `admin:stats`      | *(none)*                                                                | Request current platform stats                   |

### Server → Client Events

| Event               | Payload                                                                    | Recipients                       |
| ------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| `guides:updated`    | `{ online: number, busy: number }`                                         | All connected clients            |
| `request:new`       | `{ requestId, seekerId, zoneIds, description, expanded? }`                 | Online guides in matching zones  |
| `request:accepted`  | `{ requestId, guideId, sessionId, timestamp }`                             | The seeker who created the request|
| `request:cancelled` | `{ requestId, seekerId }`                                                  | Guides in the request's zones    |
| `request:timeout`   | `{ requestId, message, expandedZones }`                                    | The seeker                        |
| `request:expired`   | `{ requestId, message }`                                                   | The seeker                        |
| `request:unavailable`| `{ requestId, message }`                                                  | Guide who tried to accept too late|
| `session:started`   | `{ sessionId, guideId, seekerId, timestamp }`                              | Both guide and seeker             |
| `session:message`   | `{ sessionId, senderId, senderType, content, timestamp }`                  | Session room (guide + seeker)     |
| `session:location`  | `{ sessionId, senderId, lat, lng, timestamp }`                             | Session room                      |
| `session:completed` | `{ sessionId, completedBy, completedByType, rating?, review?, timestamp }` | Session room                      |
| `session:disrupted` | `{ sessionId, message, guideId? \| seekerId? }`                            | The remaining party               |
| `session:emergency` | `{ sessionId, senderId, senderType, message, lat?, lng?, timestamp }`      | Session room + admins             |
| `admin:stats`       | `{ onlineGuides, busyGuides, activeSessions, pendingRequests }`            | Admin room                        |
| `admin:emergency`   | *(same as session:emergency)*                                               | Admin room                        |
| `admin:disruption`  | `{ sessionId, type, userId }`                                               | Admin room                        |

### Timeout & Zone Expansion

1. When a request is created, a **5-minute** server-side timer starts.
2. If no guide accepts within 5 minutes, the server:
   - Notifies the seeker (`request:timeout`)
   - Re-broadcasts the request to **ALL** online guides (not just zone-matched ones), flagged `expanded: true`
3. A further **2-minute** timer starts; if still unaccepted, the seeker receives `request:expired` and the request is removed from the pending pool.
