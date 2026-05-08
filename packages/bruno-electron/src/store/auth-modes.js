const Store = require('electron-store');
const { authModeSchema } = require('@usebruno/schema');

class AuthModesStore {
  constructor() {
    this.store = new Store({
      name: 'auth-modes',
      clearInvalidConfig: true
    });
  }

  filterValidAuthModes(authModes) {
    if (!Array.isArray(authModes)) return [];
    return authModes.filter((m) => {
      try {
        authModeSchema.validateSync(m);
        return true;
      } catch (error) {
        console.error('Invalid auth mode:', m);
        console.error(error);
        return false;
      }
    });
  }

  getAuthModes() {
    let authModes = this.store.get('authModes', []);
    authModes = this.filterValidAuthModes(authModes);
    return authModes;
  }

  setAuthModes(authModes) {
    authModes = this.filterValidAuthModes(authModes);
    return this.store.set('authModes', authModes);
  }

  addAuthMode({ uid, name, auth }) {
    const authModes = this.getAuthModes();
    if (authModes.find((m) => m?.name === name)) {
      throw new Error('Auth mode with the same name already exists');
    }
    authModes.push({ uid, name, auth: auth || { mode: 'none' } });
    this.setAuthModes(authModes);
  }

  saveAuthMode({ uid, auth }) {
    const authModes = this.getAuthModes();
    const m = authModes.find((m) => m?.uid === uid);
    if (m) m.auth = auth;
    this.setAuthModes(authModes);
  }

  renameAuthMode({ uid, name }) {
    const authModes = this.getAuthModes();
    const m = authModes.find((m) => m?.uid === uid);
    if (m) m.name = name;
    this.setAuthModes(authModes);
  }

  copyAuthMode({ uid, name, auth }) {
    const authModes = this.getAuthModes();
    authModes.push({ uid, name, auth });
    this.setAuthModes(authModes);
  }

  deleteAuthMode({ uid }) {
    const authModes = this.getAuthModes().filter((m) => m?.uid !== uid);
    this.setAuthModes(authModes);
  }
}

const authModesStore = new AuthModesStore();

module.exports = { authModesStore };
