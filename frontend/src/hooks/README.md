# React Test Center Guards & Hooks

This directory contains React-specific implementations for test-center access validation.

## Files

### Hooks
- **useTestCenterAccess.ts** — Hook to validate access to a specific test center
  - Returns: `{ hasAccess, loading, error }`
  - Options: `testCenterId`, `onAccessDenied`, `cacheDuration`
  - Usage: Call inside a component to check access before render

- **useIsTestCenterOwner()** — Hook to check if user is a test-center owner
  - Returns: `{ isOwner, loading, error }`
  - Options: `onOwnerCheckFail`, `cacheDuration`

### Components
- **TestCenterProtectedRoute.tsx** — Route wrapper component
  - Props: `testCenterId`, `fallbackPath`, `children`, `loading`
  - Usage: Wrap route content to enforce access checks

- **TestCenterOwnerRoute.tsx** — Route wrapper for owner-only routes
  - Props: `fallbackPath`, `children`, `loading`
  - Usage: Wrap admin/owner pages to ensure user is a test-center owner

- **WithTestCenterAccess.tsx** — Higher-order component
  - Usage: `<WithTestCenterAccess Component={MyPage} options={{ paramName: 'id' }} />`
  - Automatically extracts route param and validates

## Integration Examples

### Example 1: Using hook in a component
```tsx
import { useTestCenterAccess } from '@/hooks/useTestCenterAccess';
import { useParams } from 'react-router-dom';

function ViewTestCenterPage() {
  const { id } = useParams();
  const { hasAccess, loading } = useTestCenterAccess(id);

  if (loading) return <div>Validating...</div>;
  if (hasAccess === false) return <Navigate to="/" replace />;

  return <div>Test Center Details for {id}</div>;
}
```

### Example 2: Using protected route component
```tsx
import { TestCenterProtectedRoute } from '@/components/TestCenterProtectedRoute';
import { useParams } from 'react-router-dom';

function EditTestCenterPage() {
  const { id } = useParams();

  return (
    <TestCenterProtectedRoute testCenterId={id}>
      <div>Edit Test Center {id}</div>
    </TestCenterProtectedRoute>
  );
}
```

### Example 3: Using owner-only route
```tsx
import { TestCenterOwnerRoute } from '@/components/TestCenterOwnerRoute';

function AdminDashboard() {
  return (
    <TestCenterOwnerRoute fallbackPath="/access/login">
      <div>Admin Dashboard (Owner Only)</div>
    </TestCenterOwnerRoute>
  );
}
```

### Example 4: Using HOC in router config
```tsx
import { WithTestCenterAccess } from '@/components/WithTestCenterAccess';

const routes = [
  {
    path: '/test-center/centers/:id/edit',
    element: <WithTestCenterAccess Component={EditTestCenterPage} options={{ paramName: 'id' }} />
  }
];
```

## API Integration

The hooks call `TestCenterApi` methods:
- `validateAccess(testCenterId)` — GET `/test_centers/:id/validate_access`
- `checkUserIsTestCenterOwner()` — GET `/users/me/test_centers/owner`

Both return cached results (5-minute TTL by default).

## Migration from Vue Guards

If migrating from the Vue `verifyTestCenter` guard:

**Before (Vue Router):**
```js
beforeEnter: verifyTestCenter({ fromParam: 'id' })
```

**After (React Router v6):**
```tsx
element: <WithTestCenterAccess Component={MyPage} options={{ paramName: 'id' }} />
```

Or use the hook directly in your component:
```tsx
const { id } = useParams();
const { hasAccess } = useTestCenterAccess(id);
if (!hasAccess) return <Navigate to="/" />;
```
