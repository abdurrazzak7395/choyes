// Minimal store shim used by legacy route guards and utils.
// Provides `state`, `getters`, and `commit(module/mutation, payload)`.
import testCentersModule from './modules/testCenters.js';
import userModule from './modules/user.js';

const state = {
  user: typeof userModule.state === 'function' ? userModule.state() : userModule.state,
  testCenters: typeof testCentersModule.state === 'function' ? testCentersModule.state() : testCentersModule.state,
};

const getters = {};
Object.defineProperty(getters, 'isAuthenticated', {
  get() {
    return !!(state.user && state.user.token);
  },
  enumerable: true,
});

function commit(type, payload) {
  const [moduleName, mutationName] = String(type).split('/');
  if (moduleName === 'user' && userModule.mutations && typeof userModule.mutations[mutationName] === 'function') {
    userModule.mutations[mutationName](state.user, payload);
    return;
  }

  if (moduleName === 'testCenters' && testCentersModule.mutations && typeof testCentersModule.mutations[mutationName] === 'function') {
    testCentersModule.mutations[mutationName](state.testCenters, payload);
    return;
  }

  // no-op if unknown
}

export default {
  state,
  getters,
  commit,
};
