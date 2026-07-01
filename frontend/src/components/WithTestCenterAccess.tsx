import { ReactNode } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TestCenterProtectedRoute } from '@/components/TestCenterProtectedRoute';

/**
 * Higher-order component: wraps a route component with test-center access validation.
 * Automatically extracts :id param and validates access.
 * Usage in routes:
 *   element: <WithTestCenterAccess><ViewTestCenterPage /></WithTestCenterAccess>
 */
export function WithTestCenterAccess(
  Component: React.ComponentType<any>,
  options?: { paramName?: string; fallbackPath?: string }
) {
  const { paramName = 'id', fallbackPath = '/' } = options || {};

  return function ProtectedComponent(props: any) {
    const params = useParams();
    const testCenterId = params[paramName];

    if (!testCenterId) {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <TestCenterProtectedRoute testCenterId={testCenterId} fallbackPath={fallbackPath}>
        <Component {...props} />
      </TestCenterProtectedRoute>
    );
  };
}
