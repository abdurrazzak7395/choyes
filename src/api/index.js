// Minimal Gateway stub for local smoke tests.
// In production this would call your backend API; for tests we return simulated responses.
export default {
  async get(path) {
    // simple simulated behavior
    if (path.includes('validate_access')) {
      return { data: { access: true } };
    }
    if (path.includes('users/me/test_centers/owner')) {
      return { data: { is_owner: true } };
    }
    return { data: {} };
  },
};
