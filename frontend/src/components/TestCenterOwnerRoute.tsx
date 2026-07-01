import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsTestCenterOwner } from '@/hooks/useTestCenterAccess';

/**
 * Protected route component requiring user to be a test-center owner.
 * Props:
 *  - fallbackPath: where to redirect if not an owner (default: '/')
 *  - children: route content
 *  - loading: optional loading UI
 */
export function TestCenterOwnerRoute({
  fallbackPath = '/',
  children,
  loading: LoadingUI
}: {
  fallbackPath?: string;
  children: ReactNode;
  loading?: ReactNode;
}) {
  const { isOwner, loading } = useIsTestCenterOwner({
    onOwnerCheckFail: () => {
      // Redirect happens via the return statement below
    }
  });

  if (loading) {
    return (
      LoadingUI || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Checking permissions...</div>
        </div>
      )
    );
  }

  if (isOwner === false) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
