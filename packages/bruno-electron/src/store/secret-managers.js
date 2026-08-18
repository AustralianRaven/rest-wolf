const Store = require('electron-store');
const { uuid } = require('../utils/common');
const { encryptString, decryptString } = require('../utils/encryption');

// Credentials for external secret providers. The non-sensitive fields stay readable so
// the renderer can list and reorder providers; the client secret is encrypted at rest and
// never leaves the main process.
class SecretManagerStore {
  constructor() {
    this.store = new Store({
      name: 'secret-managers',
      clearInvalidConfig: true
    });
  }

  // Order is meaningful: it is the precedence used when resolving a secret that exists in
  // more than one provider, first match winning.
  all() {
    return this.store.get('managers', []) || [];
  }

  // Safe to hand to the renderer - carries a configured flag instead of the secret itself.
  list() {
    return this.all().map(({ clientSecret, ...manager }) => ({
      ...manager,
      hasClientSecret: Boolean(clientSecret)
    }));
  }

  // Main-process only: the decrypted form used to talk to the provider.
  resolve(uid) {
    const manager = this.all().find((m) => m.uid === uid);
    if (!manager) return null;
    let clientSecret = '';
    if (manager.clientSecret) {
      try {
        clientSecret = decryptString(manager.clientSecret);
      } catch (err) {
        console.error(`Failed to decrypt credentials for secret manager ${uid}:`, err.message);
      }
    }
    return { ...manager, clientSecret };
  }

  add(manager) {
    const managers = this.all();
    const record = {
      ...manager,
      uid: uuid(),
      clientSecret: manager.clientSecret ? encryptString(manager.clientSecret) : ''
    };
    managers.push(record);
    this.store.set('managers', managers);
    return record.uid;
  }

  update(uid, changes) {
    const managers = this.all();
    const index = managers.findIndex((m) => m.uid === uid);
    if (index === -1) throw new Error(`Secret manager ${uid} not found`);

    const next = { ...managers[index], ...changes, uid };
    // An empty secret in an edit means "unchanged", so the stored one is kept rather than
    // being wiped by a form that never displays it.
    next.clientSecret = changes.clientSecret
      ? encryptString(changes.clientSecret)
      : managers[index].clientSecret;

    managers[index] = next;
    this.store.set('managers', managers);
  }

  remove(uid) {
    this.store.set('managers', this.all().filter((m) => m.uid !== uid));
  }

  reorder(orderedUids) {
    const managers = this.all();
    const byUid = new Map(managers.map((m) => [m.uid, m]));
    const reordered = orderedUids.map((uid) => byUid.get(uid)).filter(Boolean);
    // Anything the caller did not mention keeps its relative position at the end.
    const missing = managers.filter((m) => !orderedUids.includes(m.uid));
    this.store.set('managers', [...reordered, ...missing]);
  }
}

const secretManagerStore = new SecretManagerStore();

module.exports = { secretManagerStore, SecretManagerStore };
