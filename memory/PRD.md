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

## PRE-BOOKING REAL CENTER NAMES + FULL BOOKING CONFIRM (June 10 2026, session 2)
- NEW: `CityCentersPanel` component (/app/frontend/src/components/CityCentersPanel.tsx) — after occupation → city → date selection, shows "Real Test Centers in {city}" panel with verified real names + IDs, merged from Supabase test_centers DB (45 rows, ilike city match, junk IDs >= 100000 filtered) + static REAL_TEST_CENTERS. Wired into TestCenterAvailablePage (between date and center selects) and BookingPage (after Test Center field). data-testid: live-city-centers, city-center-{id}.
- VERIFIED LIVE in browser: Rajshahi shows 5 real centers (Bogura #107, Chapainawabganj #168, Joypurhat #265, Pabna #201, Rajshahi #54) BEFORE booking.
- FULL BOOKING CONFIRMED LIVE: hold POST → reservation POST /exam-reservations returned reservation id 4249720 (draft). Body: {exam_session_id: encrypted, occupation_id: 2279, methodology, language_code: "TLREE", site_id: null, site_city, hold_id}. Draft NOT finalized — SVP requires payment (test_price 50) within ~20 min (exam-constraints reservation_duration) or auto-discards; GET detail/list 404s the unpaid draft. NO money spent. payments-validate-pending → can_proceed:true.
- BOOKING SYSTEM STATUS: works fully up to the payment gateway step (POST /payments would be next — requires real money).

## Credentials
- Access ADMIN: admin@example.com / 12345678 (see /app/memory/test_credentials.md)
- SVP: mdrahadulislamsvp55445@yopmail.com / aRrazzak90# — OTP via email each login (yopmail inbox CAPTCHA-gated; user pastes OTP).

## Backlog / Next
- P0: Payment flow (POST /payments) to finalize reservations — requires real money + gateway; UI for paid bookings.
- P1: An Access USER-role account for full browser login path (/access/login USER → /auth/login SVP).
- P2: Optional React Router v7 future flags to silence console warnings.
- P2: Decide fate of unused FastAPI backend (keep as health endpoint or migrate sensitive logic).
- Idea: Seat Availability Alert — poll live available-dates/sessions and notify on new seats.
