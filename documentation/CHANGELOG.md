# Changelog

## v0.2.0 — AI, real-time, and UI overhaul

- Backend: Groq-powered AI match explanations, Brevo transactional email
  (verification, password reset, match alerts, return confirmations), full
  email verification + password reset flow, Socket.IO per-user rooms for
  targeted real-time push, bookmarks (`Bookmark` model + `/users/me/saved`
  routes), leaderboard endpoint, 6-month analytics trend aggregation
- Frontend: dark/light theme system (header toggle + Settings page, zero
  flash on load), Flipkart-style `TrackingStepper` on item detail & matches
  pages, Recharts donut/trend/bar charts on all three dashboards, live
  Google Maps (`LiveMap`) replacing static previews, bookmark toggle on
  every item card + `/saved` page, `/leaderboard` page with podium styling,
  global toast notification system, animated stat counters, page-load
  animations (fade/slide/blob gradients), mobile bottom tab bar
- Removed all Docker/Jenkins tooling in favor of a local-only setup
  (local MongoDB + `npm run dev`) — see README for per-OS install steps

## v0.1.0 — MVP

- Backend: auth (JWT access/refresh), Lost/Found CRUD with photo uploads,
  matching engine + auto-generated Match records, Socket.IO chat, notifications,
  admin analytics & user moderation, seed script with demo data
- Frontend: 20 pages (landing, auth x4, dashboard, report flow, my reports,
  item details, matches, chat, notifications, profile, settings, search,
  admin x2, police, 404) built with Next.js 16 + Tailwind v4, styled to match
  the product mockup's indigo/blue/green/orange/red palette and Poppins/Inter
  typography
- Docs: root README, per-app READMEs, API reference, data model, roadmap
- Infra: local MongoDB setup (no Docker) — see README for install instructions per OS
