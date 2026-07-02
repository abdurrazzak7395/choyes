// Minimal `user` Vuex module used by route guards.
// Keeps only the pieces `verifyTestCenter` expects: token, testCenterId, isTestCenterOwner
const state = () => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null,
  testCenterId: null,
  isTestCenterOwner: false,
});

const mutations = {
  setIsTestCenterOwner(state, val) {
    state.isTestCenterOwner = !!val;
  },
  setToken(state, token) {
    state.token = token || null;
    try {
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem('accessToken', token);
        else localStorage.removeItem('accessToken');
      }
    } catch (e) {
      // ignore localStorage errors in non-browser environments
    }
  },
  setTestCenterId(state, id) {
    state.testCenterId = id || null;
  }
};

const getters = {};

export default {
  namespaced: true,
  state,
  mutations,
  getters,
};
