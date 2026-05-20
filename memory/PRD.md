# PRD — SVP Booking Crate (Remix)

## Original Problem Statement
User imported a GitHub repo (`remix-of-svp-booking-crate`) to run and fix the Booking page where test center names were not displayed correctly. The upstream SVP API moved to a new shape returning `test_center.test_center_id`, `test_center.test_center_name`, `test_center.test_center_city`. The frontend still read legacy fields and let admin DB overrides shadow the explicit SVP center identity, causing multiple distinct centers in one city to display the same incorrect name.

User language: Bengali (technical terms in English).

## Product Requirements
- Each `exam_session` MUST display the exact `test_center_name` returned by the new SVP API.
- The Reservations page MUST also display the correct test center name per booked reservation, per the new SVP shape.
- Admin DB overrides (`exam_session_centers`, `section_center_rules`) may only apply when SVP did NOT return an explicit name + id pair.
- City filter and center options MUST work when SVP returns `site_id: null` but provides `test_center_id`.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind, served via supervisor.
- Backend (boilerplate FastAPI, unused).
- Data layer: Supabase (Auth + Edge Functions) proxying SVP International API.
- Testing: Vitest unit + integration tests.

## Architecture
- `/app/frontend/src/lib/booking-utils.ts` — shared helpers for normalizing SVP payloads.
  - `getSessionSiteCity`, `getSessionSiteId`, `getExplicitSessionCenterName`, `resolveSessionCenter` (SVP-first priority).
- `/app/frontend/src/pages/exam/BookingPage.tsx` — Booking flow.
- `/app/frontend/src/pages/exam/ReservationsPage.tsx` — Booked reservations list.
- `/app/frontend/vite.config.ts` — `allowedHosts: true` for Emergent preview.

## What's Been Implemented
- 2026-02 — Booking page SVP-first center resolution (no admin override when SVP returns name+id).
- 2026-02 — `booking-utils.ts` reads new SVP fields `test_center.test_center_city/name/id`.
- 2026-02 — Vite preview host allowlist; `start` script for supervisor.
- 2026-02 — Vitest suites: `booking-new-svp-shape`, `booking-svp-first-priority`.
- 2026-02 — Installed missing `@testing-library/dom` dependency (BookingPage integration test now passes).
- 2026-02 — ReservationsPage `getCenterName` + `getSiteId` updated to read new SVP fields (`test_center.test_center_name`, `test_center.test_center_id`, `test_center.test_center_city`).
- 2026-02 — Reschedule navigation forwards `siteCity` from new SVP `test_center_city`.
- 2026-02 — New test file `ReservationsPage.helpers.test.ts` (7 tests covering new + legacy shapes).

## Current Test Status
- 50/50 Vitest tests passing across 9 suites.

## Backlog
- P2 — Obtain fresh SVP API Bearer token for live e2e verification (current Postman token returns 401).
- P2 — Optional: lift helper functions out of `ReservationsPage.tsx` into `booking-utils.ts` for reuse and easier testing (currently duplicated logic in test).
- P3 — Add integration test for ReservationsPage rendering (depends on Supabase mocks).

## Known Risks
- SVP API token is expired → cannot run true e2e against upstream from this environment.
- Helpers in `ReservationsPage.tsx` are private; tests rely on mirrored inline copies. Drift risk if helpers change without test update.
