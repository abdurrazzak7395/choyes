import Gateway from '@/api/index';

class TestCenterApi {
  validateAccess(testCenterId) {
    // expected response: { access: true/false, role: 'owner'|'manager'|'viewer' }
    return Gateway.get(`test_centers/${testCenterId}/validate_access`);
  }

  checkUserIsTestCenterOwner() {
    // expected response: { is_owner: true/false }
    return Gateway.get('users/me/test_centers/owner');
  }

  getTestCenterById(testCenterId) {
    return Gateway.get(`test_centers/${testCenterId}`);
  }
}

export default new TestCenterApi();
