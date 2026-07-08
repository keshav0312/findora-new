# Findora Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 frontend for Findora.

## Stack

- Next.js 16 / React 19, Turbopack
- Tailwind CSS v4 (design tokens in `app/globals.css`, brand palette: indigo /
  blue / green / orange / red on a slate background, Poppins for headings +
  Inter for body text — matching the product mockup)
- Socket.IO client for real-time chat
- Plain fetch-based API client (`lib/api.ts`) — no extra data-fetching library

## Getting started

Make sure the backend is running first (see `../findora-backend/README.md`,
including `npm run seed` for demo data), then:

```bash
npm install
cp .env.local.example .env.local   # points at http://localhost:5000/api by default
npm run dev                          # http://localhost:3000
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/register`, `/login`, `/forgot-password`, `/verify-email` | Auth |
| `/dashboard` | Overview: stats, recent matches, recent reports, nearby map |
| `/report`, `/report/lost`, `/report/found` | Report a lost/found item |
| `/my-reports` | Your lost & found reports |
| `/items/[type]/[id]` | Report detail page |
| `/matches` | AI-ranked possible matches, confirm/reject/mark returned |
| `/chat/[matchId]` | Real-time chat with the other party in a match |
| `/notifications` | Match / message / claim / returned notifications |
| `/profile`, `/settings` | Account management |
| `/search` | Browse & filter all open reports |
| `/admin`, `/admin/users` | Admin analytics + user moderation |
| `/police` | Read-only police portal over citizen reports |
| 404 | Custom not-found page |

## Notes

- The sidebar and cards use custom Tailwind utility classes (`.input`,
  `.input-plain`, brand color tokens) defined in `app/globals.css` — no extra
  component library is required.
- `components/map-preview.tsx` is a stylized placeholder standing in for a
  real Leaflet/Google Maps embed (the product brief's interactive map). Swap
  it for `react-leaflet` or `@vis.gl/react-google-maps` once you have an API
  key / tile provider.
- Auth state lives in `lib/auth-context.tsx`; the JWT access token is stored
  in `localStorage` under `findora_token`.
