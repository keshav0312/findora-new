# 📍 Findora

**Lost Something? Findora Helps You Find It.**

Findora is a community-powered Lost & Found platform. People report lost or
found items with a location, photo, and description; an AI-assisted matching
engine cross-checks every new report against open ones and surfaces likely
matches in real time; matched users chat and arrange the return, earning
trust points and climbing the community leaderboard along the way.

This is a full-stack MVP designed to run **entirely locally** — no Docker,
no cloud account required to get started. Just Node.js and MongoDB.

---

## ✨ Features

| Area | What's implemented |
|---|---|
| **Auth** | Register/login (JWT access + refresh), email verification, forgot/reset password — emailed via **Brevo** |
| **Reports** | Lost & Found CRUD, photo uploads (up to 5/report), custom verification questions hidden from everyone but the owner |
| **AI Matching** | Deterministic category/location/description/date/photo scoring engine, plus a **Groq**-generated plain-English "why this is a match" explanation on every match |
| **Live maps** | Google Maps on the report form (tap to pin the exact spot), dashboards, item detail, and police portal — powered by `@react-google-maps/api` |
| **Real-time** | Socket.IO chat between matched users + live in-app toast notifications the instant a match is found |
| **Order-style tracking** | Every report and match shows a Flipkart-style shipment tracker — *Reported → AI Matched → Notified → Connected → Returned* |
| **Dashboards** | User, Admin, and Police dashboards with **Recharts** donut/pie charts, animated stat counters, trend lines, and bar charts |
| **Dark / light mode** | App-wide theme toggle (header button + Settings page), persisted per device, zero flash on load |
| **Bookmarks** | Save any report for later from its card; view them all on `/saved` |
| **Leaderboard** | `/leaderboard` ranks the community by trust points, with a podium for the top 3 |
| **Trust & gamification** | Trust points and Bronze/Silver/Gold badges awarded on confirmed returns |
| **Admin & Police portals** | Analytics, user moderation, read-only citizen report review |
| **Polish** | Page-load animations, hover micro-interactions, skeleton-friendly empty states, a global toast system for form feedback |
| **~20 pages** | Landing, auth, dashboard, report flow, item detail, chat, search, saved items, leaderboard, notifications, profile, settings, admin, police |

---

## 🧱 Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts, `@react-google-maps/api`, Socket.IO client
- **Backend:** Express 5 + TypeScript, Mongoose (MongoDB), Socket.IO, JWT auth, Multer (photo uploads)
- **Database:** MongoDB — run locally, no Docker needed
- **AI matching:** In-house deterministic scoring engine + **Groq** (Llama 3.3 70B) for natural-language match explanations
- **Email:** **Brevo** transactional email API (verification, password reset, match alerts, return confirmations)

```
findora/
├── findora-frontend/     Next.js app — all user-facing & admin pages
├── findora-backend/      Express API — auth, reports, matching, chat, email, AI
└── documentation/        API reference, data model, roadmap
```

---

## 🗄️ Step 1 — Install MongoDB locally

You need a MongoDB server running on `localhost:27017` (the default the
backend expects). Pick whichever is easiest for your OS:

### Windows
1. Download **MongoDB Community Server** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer, choosing **"Complete"** setup and keeping **"Install MongoDB as a Service"** checked — this starts MongoDB automatically on boot.
3. That's it — it's now listening on `localhost:27017`. Verify with:
   ```powershell
   mongosh
   ```

### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Verify:
mongosh
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Verify:
mongosh
```

### Don't want to install anything?
Use a free **MongoDB Atlas** cluster instead ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
— create a free M0 cluster, get its connection string, and paste it into
`MONGODB_URI` in `findora-backend/.env` (step 2 below) instead of the local
one. Everything else works exactly the same.

---

## 🔑 Step 2 — Get API keys (all optional, all free tiers)

Findora runs with **zero API keys** — it just logs emails to the console and
shows a stylized map placeholder instead of a live one, and match
explanations fall back to a template. To unlock the full experience:

| Key | Where to get it | What it unlocks |
|---|---|---|
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free, no card | AI-written match explanations |
| `BREVO_API_KEY` | [app.brevo.com](https://app.brevo.com) → Settings → SMTP & API → API Keys — free, 300 emails/day | Verification, password reset, and match-alert emails |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [console.cloud.google.com/google/maps-apis](https://console.cloud.google.com/google/maps-apis) — enable **Maps JavaScript API**, free tier covers dev use | Live interactive maps + pin-the-spot picker |

---

## 🚀 Step 3 — Run the app

You'll need **Node.js 20+**. With MongoDB already running (step 1):

```bash
# --- Backend ---
cd findora-backend
npm install
cp .env.example .env
# Open .env and fill in GROQ_API_KEY / BREVO_API_KEY if you have them.
# MONGODB_URI already defaults to mongodb://localhost:27017/findora
npm run dev                  # starts on http://localhost:5000

# --- Seed demo data (run once, in a second terminal) ---
npm run seed

# --- Frontend (in a third terminal) ---
cd ../findora-frontend
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY if you have one.
npm run dev                  # starts on http://localhost:3000
```

Open **http://localhost:3000** — you're up and running.

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| User | `arjun@example.com` | `password123` |
| User | `priya@example.com` | `password123` |
| User | `ramesh@example.com` | `password123` |
| Admin | `admin@findora.app` | `admin12345` |
| Police | `police@findora.app` | `police12345` |

### Everyday commands

```bash
# Backend
cd findora-backend
npm run dev      # start with hot reload (tsx watch)
npm run build    # compile TypeScript -> dist/
npm start        # run the compiled build
npm run seed     # (re)seed demo users, reports, and matches

# Frontend
cd findora-frontend
npm run dev      # start Next.js dev server
npm run build    # production build
npm start        # serve the production build
npm run lint     # ESLint
```

To reset your data, drop the database from `mongosh`:
```js
use findora
db.dropDatabase()
```
then run `npm run seed` again.

---

## 🌗 Dark & light mode

Click the sun/moon toggle in the top-right of any page (or Settings →
Appearance) to switch themes. The choice is saved to `localStorage` and
re-applied instantly on next visit with zero flash — an inline script in
`app/layout.tsx` sets the `dark` class before React even hydrates.

---

## 📦 Order-style item tracking

Every report and match renders a `TrackingStepper`
(`findora-frontend/components/tracking-stepper.tsx`) — the same visual
language as an e-commerce shipment tracker — so users always know exactly
where their item stands:

```
● Reported  →  ● AI Matched  →  ● Notified  →  ○ Connected  →  ○ Returned
```

Completed steps are filled green with a checkmark, the current step pulses
in indigo, and upcoming steps are greyed out. It's driven purely by each
report's `status` (`open` / `matched` / `closed`) and each match's `status`
(`suggested` / `confirmed` / `rejected` / `returned`) — no extra backend
state needed.

---

## 🗺️ How the AI matching actually works

1. **Deterministic scoring** (`findora-backend/src/utils/matching.ts`) runs
   the instant a report is submitted, comparing it against every open report
   in the opposite collection (lost ↔ found) on category, location, free-text
   description, date proximity, and photo/color presence. Fast, free, works
   with zero API keys, and fully explainable — every match stores its exact
   score breakdown.
2. Any pair scoring **45+** becomes a `Match` document.
3. **Groq** (`findora-backend/src/services/ai.service.ts`) turns that
   structured score into one human sentence — shown on the Matches page and
   emailed to both parties.
4. Both matched users get an **in-app real-time toast** (Socket.IO), a
   persisted **notification**, and an **email** (Brevo).

---

## 🔌 Real-time & notifications

- The frontend connects to Socket.IO once logged in (`lib/socket.ts`) and
  joins a private room named after the user's ID.
- The backend targets that room directly — `io.to(userId).emit(...)` — for
  new matches, chat messages, and "item returned" events.
- Every push is also written to Mongo (`Notification` model) so
  `/notifications` always shows full history and works even if the user was
  offline when it happened.

---

## 📊 Dashboards & leaderboard

- **User dashboard:** animated stat cards, recent matches, nearby reports on
  a live map, and a category-breakdown donut chart.
- **Admin dashboard:** 6-month report-volume trend line, category donut
  chart, city breakdown, recent reports table.
- **Police dashboard:** lost-vs-found donut chart, a live map of all
  reported locations, read-only citizen reports table.
- **Leaderboard (`/leaderboard`):** top 20 members by trust points, podium
  styling for the top 3, badge tiers (Bronze/Silver/Gold).

All charts are built with **Recharts** (`findora-frontend/components/charts.tsx`).

---

## 📖 Route map (frontend)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/register`, `/login`, `/forgot-password`, `/verify-email` | Auth |
| `/dashboard` | User dashboard |
| `/report`, `/report/lost`, `/report/found` | Report an item (with map picker) |
| `/my-reports` | Your lost & found reports |
| `/matches` | AI-suggested matches, confirm/reject/mark returned, tracking stepper |
| `/items/[type]/[id]` | Full report detail, map, owner card, tracking stepper |
| `/chat/[matchId]` | Real-time chat with the matched user |
| `/search` | Browse/filter all open reports |
| `/saved` | Your bookmarked reports |
| `/leaderboard` | Community trust-points ranking |
| `/notifications` | Notification history |
| `/profile`, `/settings` | Account management, theme, notification prefs |
| `/admin`, `/admin/users` | Admin analytics + user moderation |
| `/police` | Police read-only portal |

---

## 🧩 Environment variables reference

**`findora-backend/.env`:**

```
PORT, NODE_ENV, MONGODB_URI
JWT_SECRET, JWT_REFRESH_SECRET
CORS_ORIGIN, FRONTEND_URL
GROQ_API_KEY, GROQ_MODEL
BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET   (optional)
```

**`findora-frontend/.env.local`:**

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

Everything except `MONGODB_URI` and `JWT_SECRET` is optional — the app
degrades gracefully (console-logged emails, template match explanations,
placeholder maps) without the rest.

---

## 🧭 What's next (see `documentation/ROADMAP.md`)

- Real image-embedding similarity (currently a heuristic photo/color signal)
- Cloudinary/S3 photo storage in production (currently local disk `/uploads`)
- Push notifications (web push / FCM) alongside in-app + email
- Rating/review system after a confirmed return

---

## 📄 License

MIT — build on it, ship it, make it yours.
