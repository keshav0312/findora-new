# Findora Backend

Express + TypeScript + MongoDB (Mongoose) API for the Findora lost & found platform.

## Stack

- Express 5, TypeScript (ESM / `nodenext`)
- MongoDB via Mongoose 9
- JWT access + refresh tokens
- Multer (local disk storage) for photo uploads
- Socket.IO for real-time chat
- Helmet, CORS, rate limiting, compression

## Getting started

```bash
npm install
cp .env.example .env      # edit MONGODB_URI / secrets if needed
npm run dev                # http://localhost:5000
npm run seed                # optional: populate demo data (see below)
```

`npm run seed` wipes the database and inserts demo users, lost/found reports and
pre-computed matches so the frontend dashboards aren't empty on first run.

Demo logins after seeding:

| Role   | Email               | Password     |
| ------ | -------------------- | ------------ |
| user   | arjun@example.com     | password123 |
| user   | priya@example.com     | password123 |
| admin  | admin@findora.app     | admin12345  |
| police | police@findora.app    | police12345 |

## Scripts

- `npm run dev` — start with hot reload (tsx)
- `npm run build` — type-check + emit to `dist/`
- `npm start` — run the compiled build
- `npm run seed` — reset & seed the database

## API overview

All routes are prefixed with `/api`. See `../documentation/API.md` for the full
reference. Highlights:

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`
- `GET/POST /lost`, `GET/POST /found` (+ `/:id`, `/mine`, `/:id/resolve`)
- `GET /matches`, `PATCH /matches/:id` (confirm / reject / mark returned)
- `GET/POST /messages` (REST history; live delivery via Socket.IO `message:new`)
- `GET /notifications`, `PATCH /notifications/:id/read`
- `GET /admin/analytics`, `GET /admin/users`, `PATCH /admin/users/:id/ban` (admin only)
- `GET /admin/reports` (admin + police, read-only)

## Matching engine

`src/utils/matching.ts` computes a 0-100 similarity score between a lost and a
found report (category 25%, location 35%, description 20%, date 10%, photo
signal 10%) and is re-run automatically whenever a new report is created. It's
a deterministic, explainable stand-in for the "AI-powered similarity"
described in the product brief — swap in real vector embeddings or an image
model later without changing its `{ score, breakdown }` return shape.

## Photo uploads

Uploaded photos are stored on local disk under `/uploads` and served
statically at `http://localhost:5000/uploads/<file>`. Swap
`src/middleware/upload.middleware.ts` for a Cloudinary (or S3) uploader for
production use — the `.env.example` already has placeholders for Cloudinary
credentials.

## Match alerts and secure handover

Email match alerts use Brevo. WhatsApp alerts use Meta's WhatsApp Cloud API,
and SMS alerts use Twilio. Configure the relevant credentials in `.env`.
Users opt in to WhatsApp/SMS in Settings and must add a phone number to their
profile. External alerts contain only a generic notice and a sign-in link;
item details and other users' contact information stay in Findora.
For WhatsApp delivery outside the customer-service window, configure an
approved match template with one body placeholder for the link.

After both users confirm a match, either can create a QR handover link from
the Matches page. The QR expires after 15 minutes, requires both match
participants to confirm, and only then closes the match and awards trust
points. When scanning from another device during local development, set
`FRONTEND_URL` to an address that device can reach and configure the frontend
API URL/CORS origin for that same address.

## What's stubbed / left for you

- Email delivery for `forgot-password` and email verification (currently a
  no-op that always returns success)
- Background jobs (BullMQ) for nearby-alerts / digest emails
- Cloudinary/S3 photo storage (currently local disk)
- Payment integration for in-app rewards
