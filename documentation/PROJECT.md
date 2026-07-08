# Findora — Project Overview

## What is Findora?

Findora is a community-powered Lost & Found platform that helps people
reconnect with their lost belongings by matching Lost and Found reports using
location, date, category, and similarity scoring — instead of relying on
scattered WhatsApp groups, Facebook posts, and printed posters.

## Objectives

- Help people recover lost belongings faster than social media posts allow
- Give police stations and organizations a shared system to log recovered items
- Reduce fraud through hidden verification details and a trust-points system

## Target users

- **Individuals** — students, travelers, families
- **Businesses** — malls, restaurants, hotels, airports, railway stations
- **Authorities** — police stations, municipal offices, schools/colleges/universities

## Core user flow

1. Sign up / log in
2. Choose "I Lost Something" or "I Found Something"
3. Fill in item details (title, category, color, brand, location, date,
   optional reward, photos, and — for lost reports — private verification
   questions)
4. Findora immediately cross-matches the new report against open reports in
   the opposite collection (see `findora-backend/src/utils/matching.ts`)
5. If a match scores above the threshold, both parties are notified
6. Users chat in-app, verify ownership via the private questions, and agree on
   a handover
7. Either party marks the match as returned — both earn trust points

## Trust & safety model

- Verification question **answers** are only ever visible to the report
  owner; everyone else only sees the question text (enforced server-side in
  `itemFactory.ts`'s `getOne` handler, not just hidden in the UI)
- Trust points accrue on confirmed returns (10 pts to the lost-item owner, 15
  to the finder) and roll up into bronze/silver/gold badges
- Admins can restrict (mark unverified) misbehaving accounts; police accounts
  get read-only visibility into citizen reports without ever seeing private
  verification answers

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Express 5, TypeScript (ESM), MongoDB/Mongoose 9 |
| Real-time | Socket.IO |
| Auth | JWT access + refresh tokens |
| Uploads | Multer → local disk (swap for Cloudinary/S3 later) |
| Infra | Local MongoDB + Node.js dev servers (no Docker required) |

See `documentation/DATABASE.md` for the schema and `documentation/API.md` for
the endpoint reference.
