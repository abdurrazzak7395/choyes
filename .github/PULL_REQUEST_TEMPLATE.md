# Test Center Access Guards & E2E Tests

Adds React-native test-center access validation hooks, protected route components, and Playwright E2E tests for the choyes exam booking system.

## What's New

### 1. React Hooks for Access Validation
- **`useTestCenterAccess(testCenterId, options)`** — Validates if the authenticated user has access to a specific test center
  - Caches results for 5 minutes
  - Calls `GET /test_centers/:id/validate_access` on backend
  - Returns `{ hasAccess, loading, error }`
  
- **`useIsTestCenterOwner(options)`** — Checks if the current user is a test-center owner
  - Calls `GET /users/me/test_centers/owner` on backend
  - Returns `{ isOwner, loading, error }`

### 2. Protected Route Components
- **`<TestCenterProtectedRoute />`** — Wraps routes requiring test-center access
  - Auto-redirects to fallback path (default `/`) if access denied
  - Shows loading UI while validating
  - Usage: `<TestCenterProtectedRoute testCenterId={id}><MyPage /></TestCenterProtectedRoute>`

- **`<TestCenterOwnerRoute />`** — Wraps owner-only routes
  - Enforces user must be a test-center owner
  - Usage: `<TestCenterOwnerRoute fallbackPath="/"><AdminPage /></TestCenterOwnerRoute>`

- **`<WithTestCenterAccess />`** — HOC for automatic param extraction
  - Usage: `<WithTestCenterAccess Component={MyPage} options={{ paramName: 'id' }} />`

### 3. Playwright E2E Tests
- **`frontend/src/test/testcenter.guard.spec.ts`**
  - Seeds auth token in localStorage
  - Mocks `GET /test_centers/*/validate_access` responses
  - Test 1: access denied → expects redirect to `/`
  - Test 2: access granted → expects to remain on `/test-center/centers/123`
  - Runs on push and PR (via GitHub Actions)

### 4. GitHub Actions Workflow
- **`.github/workflows/playwright-e2e.yml`**
  - Installs dependencies
  - Starts Vite dev server
  - Runs Playwright tests
  - Uploads artifacts on failure
  - Runs on: push to `add/test-center-guards`, PR to `main`

### 5. Documentation
- **`frontend/src/hooks/README.md`** — Integration guide with 4 usage examples
- **`SYSTEM_SETUP_REACT.md`** — Complete local setup, mock auth, booking flow, troubleshooting

## Files Changed

```
frontend/src/hooks/
  ├── useTestCenterAccess.ts (NEW) - React hooks for access validation
  └── README.md (NEW) - Integration guide

frontend/src/components/
  ├── TestCenterProtectedRoute.tsx (NEW) - Protected route wrapper
  ├── TestCenterOwnerRoute.tsx (NEW) - Owner-only route wrapper
  └── WithTestCenterAccess.tsx (NEW) - HOC for route protection

frontend/src/test/
  └── testcenter.guard.spec.ts (NEW) - Playwright E2E tests

.github/workflows/
  └── playwright-e2e.yml (NEW) - CI/CD workflow

SYSTEM_SETUP_REACT.md (NEW) - Full system setup guide
```

## How to Use

### Example 1: Using Hook in Component
```tsx
import { useTestCenterAccess } from '@/hooks/useTestCenterAccess';
import { useParams } from 'react-router-dom';

function ViewTestCenterPage() {
  const { id } = useParams();
  const { hasAccess, loading } = useTestCenterAccess(id);

  if (loading) return <div>Validating...</div>;
  if (hasAccess === false) return <Navigate to="/" />;

  return <div>Test Center {id}</div>;
}
```

### Example 2: Using Protected Route Component
```tsx
import { TestCenterProtectedRoute } from '@/components/TestCenterProtectedRoute';

function EditTestCenterPage() {
  const { id } = useParams();
  return (
    <TestCenterProtectedRoute testCenterId={id}>
      <div>Edit Test Center {id}</div>
    </TestCenterProtectedRoute>
  );
}
```

### Example 3: Using HOC in Router
```tsx
import { WithTestCenterAccess } from '@/components/WithTestCenterAccess';

const routes = [
  {
    path: '/test-center/centers/:id/edit',
    element: <WithTestCenterAccess Component={EditTestCenterPage} />
  }
];
```

## Running E2E Tests Locally

1. Start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. In another terminal, run Playwright tests:
   ```bash
   cd frontend
   E2E_BASE_URL=http://localhost:3000 npx playwright test src/test/testcenter.guard.spec.ts --headed
   ```

3. Watch the browser perform the test actions automatically.

## Expected CI/CD Behavior

When this PR is created:
1. GitHub Actions workflow triggers automatically
2. Vite dev server starts (waits for port 3000)
3. Playwright runs E2E tests (headless)
4. Results appear in Actions tab
5. On failure, artifacts (.zip trace files) are uploaded for debugging

## Backend Integration

The hooks call these endpoints (expected to exist on your backend):
- **`GET /test_centers/:id/validate_access`** — Returns `{ access: boolean, role: string, ... }`
- **`GET /users/me/test_centers/owner`** — Returns `{ is_owner: boolean }`

If these endpoints don't exist or differ, update the TestCenterApi methods in `src/api/testCenter.api.js`.

## Next Steps

1. ✅ Review this PR
2. ✅ Run E2E tests locally (see "Running E2E Tests Locally" above)
3. ✅ Merge into main when CI passes
4. ✅ Integrate the hooks/components into your test-center routes and pages
5. ✅ Update backend endpoints if needed

## References

- React Hooks docs: `frontend/src/hooks/README.md`
- Full system setup: `SYSTEM_SETUP_REACT.md`
- E2E test config: `frontend/playwright.config.ts`
