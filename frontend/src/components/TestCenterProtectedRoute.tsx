import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTestCenterAccess } from '@/hooks/useTestCenterAccess';

/**
 * Protected route component for test-center routes with access validation.
 * Props:
 *  - testCenterId: the test center ID to validate (from route params)
 *  - fallbackPath: where to redirect if access denied (default: '/')
 *  - children: route content
 *  - loading: optional loading UI
 */
export function TestCenterProtectedRoute({
  testCenterId,
  fallbackPath = '/',
  children,
  loading: LoadingUI
}: {
  testCenterId?: string | number;
  fallbackPath?: string;
  children: ReactNode;
  loading?: ReactNode;
}) {
  const { hasAccess, loading } = useTestCenterAccess(testCenterId as string, {
    onAccessDenied: () => {
      // Redirect happens via the return statement below
    }
  });

  if (loading) {
    return (
      LoadingUI || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Validating access...</div>
        </div>
      )
    );
  }

  if (hasAccess === false) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
