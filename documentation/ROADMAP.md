# Findora Roadmap

This MVP covers the core loop end-to-end: report → match → notify → chat →
resolve, plus admin/police visibility. Suggested next steps, roughly in order
of impact:

1. **Real email delivery** — wire `POST /auth/forgot-password` and an
   email-verification flow to a provider (Resend, SendGrid, SES). The
   `/verify-email` frontend page already exists as a placeholder.
2. **Real map integration** — replace `components/map-preview.tsx` with
   `react-leaflet` (OpenStreetMap tiles, no API key) or Google Maps
   (`@vis.gl/react-google-maps`) using the `coordinates.lat/lng` fields
   already stored on each report.
3. **Cloudinary/S3 uploads** — swap `findora-backend/src/middleware/upload.middleware.ts`'s
   disk storage for a cloud provider so uploads survive redeploys.
4. **Real image similarity** — replace the placeholder photo-score heuristic
   in `utils/matching.ts` with an actual embedding model (e.g. CLIP) so two
   photos of the same wallet score higher than two unrelated black wallets.
5. **Background jobs (BullMQ + Redis)** — nearby-report alerts, weekly email
   digests, and re-scoring older open reports as new ones come in (currently
   matching only runs at creation time).
6. **Automatic badge computation** — derive `bronze/silver/gold` from
   `trustPoints` thresholds instead of leaving it manually set.
7. **OCR for ID documents** — Aadhaar/PAN/Passport field extraction, plus
   QR-code generation per report, as described in the original product brief.
8. **Public API / partner integrations** — scoped API keys for malls,
   airports, and universities to submit/query reports programmatically.
9. **Reward payments** — in-app secure transfer for the reward amounts
   currently just stored as a number on lost reports.
