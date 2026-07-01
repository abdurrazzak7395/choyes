import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TestCenterApi from '@/api/testCenter.api';

// Cache for access validation results
const accessCache = {};

/**
 * React hook to validate test center access.
 * Options:
 *  - testCenterId: the ID of the test center to check access for
 *  - onAccessDenied: callback fired when access is denied (use for redirect)
 *  - cacheDuration: how long (ms) to keep cache before refreshing (default 5 min)
 */
export function useTestCenterAccess(testCenterId, { onAccessDenied = null, cacheDuration = 5 * 60 * 1000 } = {}) {
  const { isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(null); // null = loading, true/false = result
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !testCenterId) {
      setHasAccess(false);
      return;
    }

    const validateAccess = async () => {
      // Check cache
      const cached = accessCache[testCenterId];
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setHasAccess(cached.access);
        if (!cached.access && onAccessDenied) onAccessDenied();
        return;
      }

      try {
        const resp = await TestCenterApi.validateAccess(testCenterId);
        const ok = resp?.data?.access === true || resp?.data?.allowed === true;
        
        // Cache result
        accessCache[testCenterId] = { access: !!ok, timestamp: Date.now() };
        
        setHasAccess(!!ok);
        setError(null);
        
        if (!ok && onAccessDenied) onAccessDenied();
      } catch (err) {
        console.error('useTestCenterAccess error:', err);
        setError(err);
        setHasAccess(false);
        if (onAccessDenied) onAccessDenied();
      }
    };

    validateAccess();
  }, [isAuthenticated, testCenterId, onAccessDenied, cacheDuration]);

  return { hasAccess, loading: hasAccess === null, error };
}

/**
 * React hook to check if the current user is a test center owner.
 * Options:
 *  - onOwnerCheckFail: callback if not an owner
 *  - cacheDuration: cache duration (default 5 min)
 */
export function useIsTestCenterOwner({ onOwnerCheckFail = null, cacheDuration = 5 * 60 * 1000 } = {}) {
  const { isAuthenticated } = useAuth();
  const [isOwner, setIsOwner] = useState(null);
  const [error, setError] = useState(null);

  const ownerCacheKey = '__isTestCenterOwner';

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOwner(false);
      return;
    }

    const checkOwner = async () => {
      // Check cache
      const cached = accessCache[ownerCacheKey];
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setIsOwner(cached.access);
        if (!cached.access && onOwnerCheckFail) onOwnerCheckFail();
        return;
      }

      try {
        const resp = await TestCenterApi.checkUserIsTestCenterOwner();
        const ok = resp?.data?.is_owner === true;
        
        accessCache[ownerCacheKey] = { access: !!ok, timestamp: Date.now() };
        
        setIsOwner(!!ok);
        setError(null);
        
        if (!ok && onOwnerCheckFail) onOwnerCheckFail();
      } catch (err) {
        console.error('useIsTestCenterOwner error:', err);
        setError(err);
        setIsOwner(false);
        if (onOwnerCheckFail) onOwnerCheckFail();
      }
    };

    checkOwner();
  }, [isAuthenticated, onOwnerCheckFail, cacheDuration]);

  return { isOwner, loading: isOwner === null, error };
}
