import store from '@/store';
import TestCenterApi from '@/api/testCenter.api';
import { TestCenterDefaultPathName } from '@/app/testCenter/routes/utils';

// Options:
//  - fromParam: read test center id from to.params[fromParam]
//  - fromStore: read test center id from store.state.user.testCenterId
//  - requireOwner: check only that the user is a test-center owner

export default function verifyTestCenter(options = {}) {
  const { fromParam = null, fromStore = false, requireOwner = false } = options;

  return async (to) => {
    // 1) auth check (adjust getter name if your store differs)
    if (!store.getters?.isAuthenticated) {
      return { path: '/access/login', replace: true };
    }

    // 2) require owner quick check
    if (requireOwner) {
      if (store.state.user?.isTestCenterOwner) return true;
      try {
        const resp = await TestCenterApi.checkUserIsTestCenterOwner();
        if (resp?.data?.is_owner) {
          // commit mutation if present
          if (store.commit) store.commit('user/setIsTestCenterOwner', true);
          return true;
        } else {
          return { path: '/' };
        }
      } catch (err) {
        console.error('verifyTestCenter(requireOwner) error', err);
        return { path: '/' };
      }
    }

    // 3) identify test center id
    let testCenterId = null;
    if (fromParam) testCenterId = to.params[fromParam];
    if (fromStore && !testCenterId) testCenterId = store.state.user?.testCenterId;

    // 4) no id => allow (top-level pages)
    if (!testCenterId) return true;

    // 5) check cache
    const cached = store.state.testCenters?.byId?.[testCenterId];
    if (cached) return cached.accessGranted ? true : { path: '/' };

    // 6) server validation
    try {
      const resp = await TestCenterApi.validateAccess(testCenterId);
      const ok = resp?.data?.access === true || resp?.data?.allowed === true;
      if (store.commit) store.commit('testCenters/setAccess', { id: testCenterId, access: !!ok, details: resp.data });
      return ok ? true : { path: '/' };
    } catch (err) {
      console.error('verifyTestCenter(validateAccess) error', err);
      return { path: '/' };
    }
  };
}
