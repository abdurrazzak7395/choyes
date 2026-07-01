# Full System Setup & Live Run Guide (React + FastAPI + Booking)

This guide walks you through running the entire choyes system locally — React frontend, FastAPI backend, and the exam booking flow.

## Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB running locally or accessible via connection string
- Git, npm, pip

## Architecture Overview
- **Frontend**: React 18 + Vite + React Router v6 (port 3000)
- **Backend**: Python FastAPI + MongoDB (port 8000)
- **State**: React Context API + Tanstack React Query
- **Auth**: JWT tokens in localStorage (key: `accessToken`)
- **Test Center Guards**: React hooks (`useTestCenterAccess`, `useIsTestCenterOwner`)

## Step 1: Install Dependencies

```bash
# Frontend
cd frontend
npm ci

# Python backend
cd ../backend
pip install -r requirements.txt
```

## Step 2: Environment Setup

### Frontend (.env.local)
Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
VITE_AUTH_API_URL=http://localhost:8000
```

### Backend (.env)
Create `backend/.env` (copy from backend/.env.example):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=choyes
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Step 3: Start Services

### Terminal 1: React Frontend (Vite)
```bash
cd frontend
npm run dev
# Opens http://localhost:3000
```

### Terminal 2: Python FastAPI Backend
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
# API at http://localhost:8000/api
```

## Step 4: Access the Application

Open http://localhost:3000 in your browser.

### Default Route Flow
1. Root `/` redirects to `/access/login`
2. Login page at `/access/login`
3. On login success, redirected to `/access/dashboard` (or user dashboard `/dashboard`)

### Mock Authentication (for testing without real backend)
Open DevTools console and paste:

```javascript
const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
const payload = btoa(JSON.stringify({ login: 'test-user', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
const token = `${header}.${payload}.`;
localStorage.setItem('accessToken', token);
window.location.reload();
```

This seeds a non-expired JWT with role `ADMIN`. You can change the role to `USER` or `AGENCY` as needed.

## Step 5: Explore the UI

### Admin Routes (requires role: ADMIN)
- `/access/dashboard` — admin dashboard
- `/access/accounts` — account management
- `/access/users` — user management (ADMIN or AGENCY)
- `/access/agencies` — agency management
- `/access/test-centers` — test center management (uses `useTestCenterAccess` hook)
- `/access/session-centers` — session center management
- `/access/section-rules` — rule configuration

### User Routes (requires role: USER)
- `/dashboard` — user dashboard
- `/exam/booking` — exam booking flow (main feature)
  - Calls: GET `/individual_labor_space/exam_sessions/available_dates`
  - Calls: GET `/individual_labor_space/test_centers/cities`
  - Calls: POST `/exam_reservations`
  - Calls: GET `/payments` and POST `/reservation_credits/use`
- `/exam/reservations` — view user reservations

## Step 6: Booking Flow (Live Test)

1. **Navigate to `/exam/booking`** (as USER role)
2. Select occupation/category → see available dates
3. Pick exam date and city → see available test centers
4. Confirm reservation → proceed to payment
5. Pay with credits or card → get confirmation ticket
6. View reservation in `/exam/reservations`

**API Calls Made:**
```
GET  /individual_labor_space/exam_sessions/available_dates?category_id=X
GET  /individual_labor_space/test_centers/cities
GET  /individual_labor_space/test_centers?city=Y
POST /exam_reservations { date, city, testCenterId, ... }
GET  /payments
POST /reservation_credits/use { reservationId, amount }
GET  /tickets/:id/show_pdf
```

## Step 7: Test Center Management (with Guards)

1. **Navigate to `/access/test-centers`** (as ADMIN)
2. Component uses `useTestCenterAccess` hook to validate each center
3. For specific center `/test-center/centers/:id`:
   - Wrapped with `<TestCenterProtectedRoute testCenterId={id}>`
   - Validates via `GET /test_centers/:id/validate_access`
   - If access denied → redirects to `/`
4. Edit/add routes use `<TestCenterOwnerRoute>` to ensure owner role

**Example Component Usage:**
```tsx
import { useParams } from 'react-router-dom';
import { useTestCenterAccess } from '@/hooks/useTestCenterAccess';

function ViewTestCenterPage() {
  const { id } = useParams();
  const { hasAccess, loading } = useTestCenterAccess(id);

  if (loading) return <div>Validating access...</div>;
  if (hasAccess === false) return <Navigate to="/" />;

  return <div>Test Center {id} Details</div>;
}
```

## Step 8: Run Playwright E2E Tests

With both frontend dev server and backend running:

```bash
cd frontend

# Run single E2E test
E2E_BASE_URL=http://localhost:3000 npx playwright test src/test/testcenter.guard.spec.ts --headed

# Or with trace for debugging
E2E_BASE_URL=http://localhost:3000 npx playwright test src/test/testcenter.guard.spec.ts --trace on
```

The test will:
- Seed auth token in localStorage
- Mock API responses for validate_access
- Assert redirect on denied access
- Assert stay on page for allowed access

## Step 9: Verify API Integration

### Check Network Requests (DevTools)
1. Open DevTools → Network tab
2. Perform booking actions
3. See requests to backend endpoints
4. Inspect response bodies and status codes

### Check Storage (DevTools)
1. Open DevTools → Application → Local Storage
2. Verify `accessToken` key contains your JWT
3. Verify other session data if present

### Check Console (DevTools)
1. Look for any errors or warnings
2. Hooks log errors like `useTestCenterAccess error: ...`
3. API failures will show in console and network tab

## Troubleshooting

### "Cannot fetch /test_centers/:id/validate_access"
- Ensure backend is running on port 8000
- Check CORS_ORIGINS in backend/.env includes http://localhost:3000
- Verify MongoDB is running and MONGO_URL is correct

### "Redirect to login immediately after seed token"
- The AuthContext checks localStorage.getItem('accessToken')
- Make sure the token payload has a valid `exp` (expiration timestamp in seconds)
- Re-paste the mock token code and reload

### "Test Center access hook returns hasAccess=false"
- Check Network tab to see if validate_access call is successful
- If 401/403, ensure backend validates JWT correctly
- If 500, check backend logs for errors
- If mock response, ensure Playwright route pattern matches the actual request

### "Lazy-load component errors"
- Check Vite console for chunk load failures
- Ensure all component paths are correct
- Hard refresh browser (Ctrl+Shift+R)

### "Payment endpoints not working"
- Verify backend has `/individual_labor_space/payments` endpoints
- Check if user has credits or payment method configured
- Use mock token with sufficient test data or mock the payment endpoints

## Key Files for Reference

- **Hooks**: `frontend/src/hooks/useTestCenterAccess.ts` (test-center validation)
- **Components**: 
  - `frontend/src/components/TestCenterProtectedRoute.tsx`
  - `frontend/src/components/TestCenterOwnerRoute.tsx`
  - `frontend/src/components/WithTestCenterAccess.tsx`
- **Auth**: `frontend/src/contexts/AuthContext.tsx`
- **API**: `frontend/src/lib/api.ts`, `frontend/src/api/testCenter.api.js`
- **Pages**: `frontend/src/pages/exam/BookingPage.tsx`
- **Backend**: `backend/server.py`
- **Tests**: `frontend/src/test/testcenter.guard.spec.ts`
- **E2E Config**: `frontend/playwright.config.ts`

## Next Steps

1. **Verify system runs locally** (all 3 services start without errors)
2. **Run E2E tests** to confirm guards work
3. **Open PR** from add/test-center-guards → main for CI validation
4. **Deploy** to staging/production once tests pass
