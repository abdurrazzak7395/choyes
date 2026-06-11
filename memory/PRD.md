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

## LIVE AUTO-BOOKING E2E VERIFIED (June 11 2026, forked session)
- FIXED: Forked env lost .env files → recreated /app/backend/.env (MONGO_URL, DB_NAME) and /app/frontend/.env (REACT_APP_BACKEND_URL=https://live-exam-platform.preview.emergentagent.com, VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY=placeholder — real anon key still needed from user for BookingPage DB fallback query).
- FIXED BookingPage deep-link auto-fill: occupation-resolve effect was wiping URL-provided city/date (urlPrefillOccupationRef/urlPrefillCityRef guards added).
- FIXED auto-booking stale closure: polling interval captured stale languageCode/occupations → stuck on "Waiting for occupation/language data". Now uses autoBookAttemptRef (latest closure each render); attempt returns "waiting" sentinel; booking body uses effOccupationId/effCity.
- LIVE E2E PROVEN (real OTP 924572 from user): login → OTP verify → session → /exam/test-center-available (occupation→city→date→8 real Dhaka centers panel) → ⚡Auto-Book deep link → auto-fill OK → hold #3842434 (numeric session 1556646) → POST /exam-reservations → **Reservation #4258539 — "Narsingdi Technical Training Center" (#218) real name resolved at booking time**.
- Same as before: unpaid draft hidden upstream (list/detail 404) until payment; balance 0, credits 0 → payment gateway step is the only remaining unproven step (needs real money).
- Reservations page verified live: #4066364 completed → "Pabna Technical Training Centre" (#201).

## AUTO-BOOKING REMOVED + SUPABASE KEY NOTE (June 11 2026)
- User requested removal of auto-booking: deleted autoBook states, autoBookAttempt, polling watcher effect, AUTO-BOOKING panel (BookingPage.tsx), and "⚡ Auto-Book this selection" link (TestCenterAvailablePage.tsx — "Continue to booking" deep-link prefill kept and working). toast/sonner import removed. tsc clean, 21/21 vitest pass, live UI verified (panel gone, prefill works).
- User shared key sb_publishable_oMM1GbrJwXTDSB4LMFvdIQ_OMQ7TDSr for project cwonwsnnhojghneeqwpf — WRONG PROJECT: it has NO svp-proxy/svp-auth functions and NO test_centers table (verified 404s). App stays on llwquxmlsdmdtmmktqqe (functions live there, verify_jwt off so frontend works without its anon key). Key stored in frontend/.env anyway; BookingPage supabase.from DB fallback remains inactive (names covered by static map + /center-directory).

## REAL CENTER NAMES IN BOOKING TEST CENTER DROPDOWN (June 11 2026)
- User wanted real center names selectable in the booking flow Test Center row (not "Dhaka Center"). Since SVP hides center identity pre-booking, BookingPage now: when all session-derived center options are unidentified placeholders, the Test Center dropdown lists the verified REAL centers of the selected city (static REAL_TEST_CENTERS + DB merge via new `fetchCityCenters()` in real-test-centers.ts; CityCentersPanel refactored to reuse it).
- Selecting a real center (option key `real-{id}`): siteId set to the numeric id → booking POST carries site_id + site_city; session list NOT filtered (any session bookable); session option + status panel show the chosen real name/Site ID. selectedSession effect no longer wipes siteId when session carries no identity.
- VERIFIED LIVE: Dhaka 13/06 → dropdown shows 8 real centers (German #45, Korea #17, BRTC #115, Kishoreganj #220, Manikganj #223, Narsingdi #218, Shariatpur #221, Tangail #102); picked Korea TTC #17 → session label "Bangladesh Korea TTC Dhaka (Site #17) | Session 1", Site ID: 17 in panel. tsc clean, 21/21 vitest.
- NOTE: SVP may still assign its own center at reservation time (site_id is a hint upstream may ignore).

## LIVE MANUAL BOOKING VERIFIED + 2 FIXES (June 11 2026)
- LIVE manual flow proven: deep-link prefill → real center pick (Korea TTC #17) → **Reservation confirmed #4258777** (site_id 17, Bengali OFFBB) via UI Confirm Booking. Second run: **Create Hold #3842682** (numeric session 1556646) works after fix.
- FIX 1: createHold getEncryptedSessionToken now includes `item?.id` candidate (session list items carry the encrypted token in `id`) — manual Create Hold was failing with "No encrypted SVP exam session tokens found".
- FIX 2: openTicketPdf failure after new booking no longer surfaces raw SVP 400 ("Reservation is not paid or canceled") — status now says "ticket PDF will be available after payment".
- tsc clean, 21/21 vitest. As always: unpaid reservations stay hidden upstream until payment.

## STRICT CENTER->SESSION FILTERING + TOKEN REFRESH FIX (June 11 2026, session 3)
- User chose STRICT mode (B): selecting a test center shows ONLY that center's confirmed sessions.
- BookingPage.tsx: new `sessionCenterIds` state (sessionId -> resolved center id, captured from /exam-sessions/:id detail fetches in the existing name-resolution effect); `getResolvedSessionCenterId()`; strict `filteredSessions` (real-{id} -> only matching; "city-all" -> only undisclosed); `realCenterSessionCounts` (incl "__unresolved__" key); center options labeled "| Sessions: N" or "| No confirmed sessions"; explicit last option "Other {city} sessions — center not disclosed by SVP" (value "city-all", siteId set to "" so booking POST sends site_id null); auto-select prefers real center with confirmed sessions and upgrades auto-picks when resolution lands (centerAutoPickedRef, cleared on manual change); deep-link numeric siteId maps to real-{id}; note data-testid="no-center-sessions-note" when selected center has 0 confirmed sessions.
- api.ts: SINGLE-FLIGHT token refresh (`refreshAccessToken()` shares one in-flight promise). Root cause found live: SVP rotates refresh token on every refresh AND revokes the session on reuse — parallel 401s previously fired concurrent refreshes -> "Session revoked" random logouts.
- LIVE VERIFIED (2 real OTP logins): Rajshahi 2026-06-16 cat 59 -> 1 session, test_center {test_center_id:null, site_id:null, name:"Rajshahi Center"} in list AND detail (identity hidden upstream, confirmed again). UI: default auto-select city-all "Sessions: 1"; Pabna #201 -> session row empty+disabled + note + Site ID 201; back to city-all -> session reappears.
- New test file BookingPage.strictfilter.integration.test.tsx (2 tests). 23/23 vitest, tsc clean.
- Live available dates (June 2026): only Rajshahi/Khulna/Barishal, 18 entries, cat 59.
- NOTE: playwright token injection must avoid hand-copied JWTs (one typo caused refresh storm + session revocation during testing). Trick used: write tokens to frontend/public/svp_tokens.json (same-origin fetch), DELETE after.

## LIVE FULL BOOKING RE-VERIFIED WITH STRICT MODE (June 11 2026, session 3)
- Complete UI flow proven live AFTER strict-filter changes: deep link (occ 2279/cat 59, Rajshahi 2026-06-16) -> city-all bucket auto-selected (1 session) -> Create Hold -> **Hold #3844770 (numeric session 1556481)** -> Confirm Booking -> **Reservation confirmed #4260588** (English TLREE, site_id null, "ticket PDF will be available after payment"). Unpaid draft as always; no money spent.
- Single-flight refresh held up through the whole run (no session revocation).

## FINAL BOOKING FLOW UX (June 11 2026, session 3 cont.) — per user direction in Bengali
- User rejected strict-empty UX. FINAL behavior on BookingPage:
  - Occupation -> City -> Date -> Test Center dropdown shows ONLY verified real centers "Name (Site #ID)" (no "Sessions: N" labels, NO "city-all" bucket, CityCentersPanel REMOVED from BookingPage — still used on TestCenterAvailablePage).
  - Selecting a center shows the sessions AVAILABLE at it: undisclosed-center sessions (SVP norm) are bookable at the selected center (site_id sent with booking); sessions resolved to a DIFFERENT center are excluded (+ note via data-testid="no-center-sessions-note" when all sessions belong elsewhere).
  - Session option labeled with the selected center's name (Site #id).
- sessionCenterIds resolution + single-flight refresh kept. centerAutoPickedRef/counts removed.
- LIVE VERIFIED (refresh-token reuse, no new OTP needed): Rajshahi 16/06 -> clean dropdown (5 centers), Pabna #201 -> session "Pabna Technical Training Centre (Site #201) | Session 1", Site ID: 201. 24/24 vitest, tsc clean.

## Credentials
- Access ADMIN: admin@example.com / 12345678 (see /app/memory/test_credentials.md)
- SVP: mdrahadulislamsvp55445@yopmail.com / aRrazzak90# — OTP via email each login (yopmail inbox CAPTCHA-gated; user pastes OTP).

## Backlog / Next
- P0: Payment flow (POST /payments) to finalize reservations — requires real money + gateway; UI for paid bookings.
- P0: Get real Supabase anon/publishable key from user (frontend/.env currently has placeholder — only affects BookingPage supabase.from("test_centers") DB fallback; static map + center-directory cover names).
- P1: An Access USER-role account for full browser login path (/access/login USER → /auth/login SVP).
- P2: Optional React Router v7 future flags to silence console warnings.
- P2: Decide fate of unused FastAPI backend (keep as health endpoint or migrate sensitive logic).
- Idea: Seat Availability Alert — poll live available-dates/sessions and notify on new seats.
