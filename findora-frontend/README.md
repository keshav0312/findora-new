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

Make sure the Spring Boot backend is running first (see
`../findora-springboot-backend/README.md`; it requires JDK 21, Maven, and MongoDB),
then:

```bash
npm install
cp .env.example .env.local
npm run dev                          # http://localhost:3000
```

The local environment file should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

For Netlify, set both variables in the site's environment settings to browser-
reachable Spring Boot REST and Socket.IO URLs, then redeploy. `NEXT_PUBLIC_`
values are embedded during the frontend build. Spring Boot serves REST and
Socket.IO on separate ports, so production Socket.IO needs a publicly reachable
endpoint or a reverse proxy routing Socket.IO traffic to the backend socket port.
Also set the backend's `CORS_ORIGIN` to the frontend site URL.

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
