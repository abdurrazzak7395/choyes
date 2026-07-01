const state = () => ({
  byId: {} // { [id]: { accessGranted: boolean, details: object, fetchedAt: string } }
});

const mutations = {
  setAccess(state, { id, access, details = null }) {
    state.byId = {
      ...state.byId,
      [id]: {
        accessGranted: !!access,
        details: details || null,
        fetchedAt: new Date().toISOString()
      }
    };
  }
};

const getters = {
  hasAccess: (state) => (id) => !!(state.byId[id] && state.byId[id].accessGranted)
};

export default {
  namespaced: true,
  state,
  mutations,
  getters
};
