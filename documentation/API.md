# Findora API Reference

Base URL: `http://localhost:5000/api`

All authenticated routes expect `Authorization: Bearer <accessToken>`.
Responses follow `{ success: boolean, message?, data?, ... }`.

## Auth — `/auth`

| Method | Path | Auth | Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/register` | — | `{ name, email, password, city? }` | Returns `{ user, accessToken, refreshToken }`; sends a verification email via Brevo |
| POST | `/login` | — | `{ email, password }` | Same shape as register |
| POST | `/verify-email` | — | `{ token }` (or `?token=` query) | Marks the account verified |
| POST | `/resend-verification` | ✔ | — | Re-sends the verification email |
| POST | `/forgot-password` | — | `{ email }` | Always returns success (doesn't leak registered emails); emails a reset link if the account exists |
| POST | `/reset-password` | — | `{ token, password }` | Sets a new password |
| GET | `/me` | ✔ | — | Current user profile |
| PATCH | `/me` | ✔ | `{ name?, city?, phone?, avatar?, notificationPreferences? }` | Update profile and match-alert channel preferences |

`notificationPreferences` accepts any subset of `matchInApp`, `matchEmail`,
`matchWhatsApp`, and `matchSms` boolean values. Email alerts default on;
WhatsApp and SMS default off and require the user to opt in and add a profile
phone number.

For phone scanning during local development, the QR link's `FRONTEND_URL`
must be reachable from the scanning device (for example, the development
computer's LAN address rather than `localhost`).

## Lost / Found reports — `/lost`, `/found`

Identical shape for both collections.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | — | Query: `category, city, status, q, color, brand, page, limit` |
| GET | `/mine` | ✔ | Current user's reports |
| GET | `/:id` | — | Verification answers hidden unless you're the owner |
| POST | `/` | ✔ | `multipart/form-data` — see fields below; auto-runs matching against the opposite collection |
| PATCH | `/:id` | ✔ (owner or admin) | Partial update |
| PATCH | `/:id/resolve` | ✔ (owner or admin) | Sets `status: closed` |
| DELETE | `/:id` | ✔ (owner or admin) | |

Create body fields (multipart): `title, category, description, color, brand,
location, city, date, reward, lat, lng, photos[] (files, max 5),
verificationQuestions (JSON string, lost only)`.

## Matches — `/matches`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | ✔ | All matches where the user owns either side, sorted by score |
| PATCH | `/:id` | ✔ (a party to the match) | `{ status: "confirmed" \| "rejected" }`; returned status cannot be set directly |
| POST | `/:id/handover` | ✔ (a party to a confirmed match) | Creates a one-time QR handover link that expires in 15 minutes |
| POST | `/:id/handover/confirm` | ✔ (a party to the match) | `{ token }`; both distinct participants must confirm before the match is returned and trust points are awarded |

Each match includes an `aiExplanation` string — a short, Groq-generated
sentence explaining why the two reports were matched (falls back to a
template if `GROQ_API_KEY` isn't set). Real-time updates are pushed over
Socket.IO to `io.to(userId)` as `notification:new` (new match / return) and
`match:updated` (status change).

External email, WhatsApp, and SMS match alerts contain only a generic notice
and a sign-in link; item details and personal contact information remain in
the authenticated app. WhatsApp and SMS require explicit user opt-in and
configured provider credentials.
WhatsApp messages sent outside the customer-service window also require a
Meta-approved template configured in the backend environment.

## Messages — `/messages`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | ✔ | List of conversations the user is part of |
| GET | `/:matchId` | ✔ | Full message history for a match's conversation |
| POST | `/` | ✔ | `{ matchId, recipient, text }` — also emitted live via Socket.IO `message:new` |

### Socket.IO events

- Client → server: `conversation:join` / `conversation:leave` (room = `match_<matchId>`), `typing`
- Server → client: `message:new`, `typing`

## Notifications — `/notifications`

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | ✔ |
| PATCH | `/:id/read` | ✔ |
| PATCH | `/read-all` | ✔ |

## Admin / Police — `/admin`

All routes require role `admin` or `police` unless noted.

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/analytics` | admin, police | Totals, recovery rate, top categories/cities, 6-month trend |
| GET | `/reports` | admin, police | Recent lost + found reports, combined |
| GET | `/users` | admin only | All users |
| PATCH | `/users/:id/ban` | admin only | Restricts (unverifies) a user |

## Users — `/users`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/leaderboard` | ✔ | Top 20 users by `trustPoints`, for the `/leaderboard` page |
| GET | `/me/saved` | ✔ | Full report objects the current user has bookmarked |
| GET | `/me/saved/ids` | ✔ | Lightweight `["lost:<id>", "found:<id>", ...]` list for UI bookmark state |
| POST | `/me/saved/:itemType/:itemId` | ✔ | Toggle a bookmark on/off; `itemType` is `lost` or `found` |

## Health check

`GET /api/health` (or `/health`) → `{ status: "success" }` (public; no token required)
