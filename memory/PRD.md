# PRD — Exam Booking & Access Control System

## Original Problem Statement
SVP (svp-international.pacc.sa) exam booking system for Bangladesh test centers, plus an internal Access Control panel (ADMIN/AGENCY/USER roles). User request (June 2026): "Fix test-centers UI with real API connection — test centers must show real test center NAME with center ID, live automatic API connection; then check the whole system."

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind/shadcn, served on port 3000 (`yarn start` = `vite --host 0.0.0.0 --port 3000`, `allowedHosts: true` in vite.config.ts).
- **Real backend**: Supabase edge functions (deployed at https://llwquxmlsdmdtmmktqqe.supabase.co/functions/v1/): `svp-auth` (SVP login/OTP/refresh), `svp-proxy` (proxies SVP API: occupations, available-dates, exam-sessions, test-centers, reservations, payments), `access-auth` / `access-admin` / `access-agency` (internal accounts).
  - Sources in /app/frontend/supabase/functions/ — CANNOT be redeployed from this environment (no Supabase access token).
- **FastAPI backend** (/app/backend): unused boilerplate (only /api/status).
- **Routes**: `/` → /access/login. Access pages: /access/dashboard|accounts|users|agencies. SVP exam pages (need SVP token): /dashboard, /exam/booking, /exam/test-center-available, /exam/test-center-browse, /exam/reservations. SVP login (/auth/login) only reachable as Access role USER.

## Key Files
- /app/frontend/src/lib/real-test-centers.ts — verified BD test centers list + `resolveCenterDisplayName()` / `isGenericCenterName()` (replaces placeholder names like "Dhaka Exam Center", "Unknown Center", "City (Site #x)" with real names by site_id/test_center_id).
- /app/frontend/src/lib/booking-utils.ts — session/center normalization helpers.
- /app/frontend/src/lib/api.ts — calls Supabase functions (svp-proxy/svp-auth) with token refresh.
- Pages: TestCenterBrowsePage.tsx, TestCenterAvailablePage.tsx, BookingPage.tsx.

## Implemented (this session, June 10 2026)
- Shared `resolveCenterDisplayName()` resolver + unit tests; wired into all 3 exam pages (center dropdowns, session dropdowns, browse list + detail panel). Session option now shows: `Name (Site #id) | Session #id | time | Seats: n`. Browse list shows `Name (#ID)` + Center ID.
- Fixed broken frontend service: missing `start` script (Vite app, supervisor runs `yarn start`) + Vite `allowedHosts` 403 on preview domain.
- Fixed stray duplicate JSX at end of TestCenterAvailablePage.tsx (syntax error).
- Installed missing `@testing-library/dom` dev dep; fixed BookingPage session-option format to match integration test.
- Added data-testids (browse-city-select, browse-date-select, tca-occupation-select, tca-city-select, tca-date-select, tca-center-select, tca-session-select, center-item-{id}, center-detail, book-exam-here-btn).
- Full system test (iteration_1.json): 100% pass — Access login/dashboard/accounts/users/agencies/logout, route protection, graceful error states on exam pages, 3/3 live edge-function curls, 21/21 vitest.

## LIVE SVP VERIFICATION (June 10 2026) — with real user credentials
- SVP creds: mdrahadulislamsvp55445@yopmail.com / aRrazzak90# (OTP via email — yopmail inbox public but CAPTCHA-gated; user pastes OTP).
- VERIFIED LIVE: login → OTP_SENT → otp-verify → tokens (access 15min, refresh, sessionId; auto-refresh works in api.ts).
- VERIFIED LIVE: /occupations (234), /available-dates (19 for cat 59), /exam-sessions, /test-centers fallback list, /exam-reservations.
- VERIFIED LIVE POST: /temporary-seats hold created (id 3831346, numeric session 1555225 resolved from encrypted ID). Full /exam-reservations POST NOT executed (needs user consent — may consume credits/money).
- KEY FINDING: SVP API hides real test center identity pre-reservation — sessions/details only return `{city}` (e.g. "Rajshahi Center" synthesized label). Real names + test_center_id appear ONLY in exam_reservations (verified: "Pabna Technical Training Centre" #201, exam passed). This is upstream SVP behavior, NOT an app bug.
- UI fixes from live testing: encrypted session IDs (contain "--") now display as "Session N" instead of raw blob (TestCenterAvailablePage + BookingPage); ReservationsPage "Center ID" falls back to test_center_id (#201 now shows).
- /user-balance returns 404 from SVP upstream (both proxy fallback routes) — UI handles gracefully (defaults to Paid Booking mode).

## Credentials
- Access ADMIN: admin@example.com / 12345678 (see /app/memory/test_credentials.md)
- SVP credentials: NOT provided by user — live SVP login → OTP → real exam data flow remains unverified.

## Backlog / Next
- P0: Get real SVP credentials from user → verify live login → OTP → dashboard → booking with real test center names end-to-end.
- P1: An Access USER-role account is needed to even reach /auth/login (create via admin panel) for E2E testing.
- P2: Optional React Router v7 future flags to silence console warnings.
- P2: Decide fate of unused FastAPI backend (keep as health endpoint or migrate sensitive logic).
