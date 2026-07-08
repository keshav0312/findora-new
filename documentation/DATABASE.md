# Findora Data Model

MongoDB via Mongoose. Collections:

## User

| Field | Type | Notes |
| --- | --- | --- |
| name, email, password | string | password bcrypt-hashed, `select: false` |
| avatar | string \| null | |
| role | `user \| admin \| police` | |
| city, phone | string | |
| isVerified | boolean | doubles as an "account restricted" flag for moderation |
| trustPoints | number | incremented on confirmed returns |
| badge | `none \| bronze \| silver \| gold` | not auto-computed yet — see ROADMAP |

## LostItem / FoundItem

Structurally identical (`src/models/itemFields.ts` is the shared field set)
so the matching engine can compare them directly.

| Field | Type | Notes |
| --- | --- | --- |
| title, category, description, color, brand | string | `category` is a fixed enum, see `lib/types.ts` CATEGORIES on the frontend |
| location, city | string | free-text location + city for filtering |
| coordinates | `{ lat, lng }` | present for future real-map integration |
| date | Date | date lost/found (distinct from `createdAt`) |
| reward | number | lost items only, in ₹ |
| photos | string[] | `/uploads/<file>` paths |
| verificationQuestions | `{ question, answer }[]` | answers hidden from non-owners in API responses |
| status | `open \| matched \| closed` | |
| owner | ref User | |

Indexes: `{ category, city, status }` compound, plus a text index on
`title/description/brand` for keyword search.

## Match

Created automatically whenever a new Lost or Found report is filed and scores
above `MATCH_THRESHOLD` (45) against an open report in the opposite
collection.

| Field | Type |
| --- | --- |
| lostItem, foundItem | ref LostItem / FoundItem |
| lostOwner, foundOwner | ref User (denormalized for fast lookups) |
| score | number 0-100 |
| breakdown | `{ category, location, description, date, image }` |
| status | `suggested \| confirmed \| rejected \| returned` |

Unique index on `{ lostItem, foundItem }` — re-running matching on a new
report upserts existing pairs rather than duplicating them.

## Message

Simple flat chat log. `conversationId` is deterministic per match
(`match_<matchId>`), so history can be fetched without a separate
"conversation" collection.

## Notification

Generic per-user notification with a `type` (`match | message | claim |
returned | nearby | system`), a `link` for the frontend to route to, and a
`read` flag.
