# Chimbo Direct — Entity Relationship Diagram

## Mermaid Diagram

```mermaid
erDiagram
    User {
        String id PK
        String phone UK
        String name
        String role "seeker | guide | admin"
        String languagePref "sw | en"
        String avatarUrl
        DateTime createdAt
        DateTime updatedAt
    }

    GuideProfile {
        String id PK
        String userId UK FK
        String bio
        String idDocumentUrl
        String status "pending | active | suspended"
        String zones "JSON array of zone IDs"
        String languages "JSON array of language codes"
        Float avgRating
        Int totalSessions
        Boolean isOnline
        String currentStatus "online | offline | busy"
        DateTime createdAt
        DateTime updatedAt
    }

    Zone {
        String id PK
        String name
        String nameSw
        String description
        String geoBounds "JSON GeoJSON polygon"
        String color
        DateTime createdAt
        DateTime updatedAt
    }

    Request {
        String id PK
        String seekerId FK
        String description
        String zoneIds "JSON array of zone IDs"
        Float budget
        String photoUrl
        String status "open | matched | active | completed | cancelled"
        DateTime createdAt
        DateTime updatedAt
    }

    Session {
        String id PK
        String requestId FK
        String guideId FK
        String seekerId FK
        String sessionCode
        DateTime startedAt
        DateTime completedAt
        String escrowStatus "pending | held | released | refunded | disputed"
        Float amount
        Float platformFee
        Float ratingSeeker
        Float ratingGuide
        String reviewSeeker
        String reviewGuide
        Boolean disputeFlag
        String disputeReason
        Boolean emergencyFlag
        Boolean seekerConfirmed
        Boolean guideConfirmed
        DateTime createdAt
        DateTime updatedAt
    }

    Message {
        String id PK
        String sessionId FK
        String senderId FK
        String content
        String translatedContent
        DateTime createdAt
    }

    Vendor {
        String id PK
        String name
        String zoneId FK
        String categories "JSON array"
        String stallNumber
        String contact
        Float geoLat
        Float geoLng
        Boolean approved
        Int recommendations
        String openHours
        DateTime createdAt
        DateTime updatedAt
    }

    PriceRadar {
        String id PK
        String category
        String zoneId FK
        Float priceMin
        Float priceMax
        DateTime updatedAt
        String updatedBy
    }

    Payout {
        String id PK
        String guideId FK
        Float amount
        String status "pending | processed | failed"
        String mobileMoneyNumber
        DateTime processedAt
        DateTime createdAt
    }

    Badge {
        String id PK
        String guideId FK
        String badgeType
        DateTime awardedAt
    }

    %% ── Relationships ──────────────────────────────────────────────

    User ||--o| GuideProfile : "has one"
    User ||--o{ Request : "SeekerRequests"
    User ||--o{ Session : "GuideSessions"
    User ||--o{ Session : "SeekerSessions"
    User ||--o{ Message : "SentMessages"
    User ||--o{ Badge : "earns"
    User ||--o{ Payout : "receives"

    GuideProfile ||--o{ Badge : "has"

    Zone ||--o{ Request : "has"
    Zone ||--o{ Vendor : "contains"
    Zone ||--o{ PriceRadar : "tracks"

    Request ||--o{ Session : "generates"
    Session ||--o{ Message : "contains"
```

---

## Key Relationships

### One-to-One

| From          | To            | Field     | Notes                                     |
| ------------- | ------------- | --------- | ----------------------------------------- |
| User          | GuideProfile  | `userId`  | A user with `role=guide` has exactly one profile. The FK is unique. |

### One-to-Many

| From          | To            | Relation Name     | Notes                                              |
| ------------- | ------------- | ----------------- | -------------------------------------------------- |
| User (seeker) | Request       | `SeekerRequests`  | A seeker creates many requests.                    |
| User (guide)  | Session       | `GuideSessions`   | A guide participates in many sessions.             |
| User (seeker) | Session       | `SeekerSessions`  | A seeker participates in many sessions.            |
| User          | Message       | `SentMessages`    | A user sends many messages.                        |
| User (guide)  | Badge         | —                 | A guide earns many badges.                         |
| User (guide)  | Payout        | —                 | A guide receives many payouts.                     |
| GuideProfile  | Badge         | —                 | A guide profile is linked to its badges.           |
| Zone          | Request       | —                 | A zone contains many requests.                     |
| Zone          | Vendor        | —                 | A zone contains many vendors.                      |
| Zone          | PriceRadar    | —                 | A zone tracks many price entries.                  |
| Request       | Session       | —                 | A request can generate sessions (typically one).   |
| Session       | Message       | —                 | A session contains many messages.                  |

### Many-to-Many

| From    | To     | Join Table | Notes                                                      |
| ------- | ------ | ---------- | ---------------------------------------------------------- |
| Request | Zone   | Prisma implicit | A request can span multiple zones. Zones have many requests. |

This is modeled with Prisma's implicit many-to-many relation (`zones` field on `Request`). Prisma creates a hidden join table `_RequestToZone` under the hood.

### JSON Pseudo-Relations

The following fields store arrays as JSON strings because SQLite does not support native list types:

| Model        | Field      | Stores                            |
| ------------ | ---------- | --------------------------------- |
| GuideProfile | `zones`    | JSON array of Zone IDs            |
| GuideProfile | `languages`| JSON array of language codes      |
| Request      | `zoneIds`  | JSON array of Zone IDs (redundant with many-to-many for quick access) |
| Vendor       | `categories`| JSON array of category strings   |
| Zone         | `geoBounds`| GeoJSON Polygon object            |

---

## Cascade Deletes

| Parent        | Child         | On Delete  |
| ------------- | ------------- | ---------- |
| User          | GuideProfile  | Cascade    |
| User          | Badge         | Cascade    |
| User          | Payout        | Cascade    |
| Zone          | Vendor        | Cascade    |
| Zone          | PriceRadar    | Cascade    |
| Request       | Session       | Cascade    |
| Session       | Message       | Cascade    |

**Note**: Session → User (guide/seeker) relations do **not** cascade — deleting a user will fail if they have sessions. Delete sessions first or handle manually.
