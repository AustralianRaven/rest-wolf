const { ipcMain } = require('electron');
const { AzureVaultService } = require('../services/azure-vault');
const { secretManagerStore } = require('../store/secret-managers');

const PROVIDERS = {
  'azure-key-vault': (config) => new AzureVaultService(config)
};

const serviceFor = (config) => {
  const factory = PROVIDERS[config?.type];
  if (!factory) throw new Error(`Unsupported secret provider: ${config?.type}`);
  return factory(config);
};

const testSecretManager = async (config) => {
  try {
    // An unsaved form sends its own credentials; an existing provider is looked up so the
    // stored secret never has to be round-tripped through the renderer.
    const resolved = config.uid && !config.clientSecret ? secretManagerStore.resolve(config.uid) : config;
    await serviceFor(resolved).testConnection();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resolves an ordered list of {vaultName, secretName} refs. Two orderings are in play:
// the refs carry tier precedence (most specific first, so tenant beats cluster beats
// global), while a ref without a pinned vault falls back to trying each configured
// provider in order. Providers are pinned by name rather than id so the choice survives
// being shared with a teammate whose vault has a different local id.
const resolveSecretRefs = async ({ refs = [] }) => {
  const managers = secretManagerStore.all().map((m) => secretManagerStore.resolve(m.uid));
  const sources = [];

  for (const ref of refs) {
    const secretName = (ref.secretName || '').trim();
    if (!secretName) continue;

    // A pinned vault is honoured or reported; falling back to a different vault would
    // quietly hand back another environment's values under the same key.
    const candidates = ref.vaultName ? managers.filter((m) => m.name === ref.vaultName) : managers;

    if (!candidates.length) {
      const error = ref.vaultName
        ? `Vault '${ref.vaultName}' is not configured`
        : 'No secret manager configured';
      sources.push({ secretName, vaultName: ref.vaultName || null, managerName: null, ok: false, error, variables: {} });
      continue;
    }

    let resolved = null;
    const attempts = [];
    for (const manager of candidates) {
      try {
        const variables = await serviceFor(manager).fetchSecret(secretName);
        resolved = {
          secretName,
          vaultName: ref.vaultName || null,
          managerName: manager.name,
          ok: true,
          error: null,
          variables: variables || {}
        };
        break;
      } catch (error) {
        attempts.push(`${manager.name}: ${error.message}`);
      }
    }

    sources.push(
      resolved
      || { secretName, vaultName: ref.vaultName || null, managerName: null, ok: false, error: attempts.join('; '), variables: {} }
    );
  }

  // First ref to define a key keeps it, and what it shadowed is recorded - otherwise a
  // lower tier just looks silently ignored.
  const merged = {};
  const owner = {};
  const conflicts = [];

  sources.forEach((source) => {
    Object.entries(source.variables).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(merged, key)) {
        const existing = conflicts.find((c) => c.key === key);
        if (existing) {
          existing.shadowedBy.push(source.secretName);
        } else {
          conflicts.push({ key, winner: owner[key], shadowedBy: [source.secretName] });
        }
        return;
      }
      merged[key] = value;
      owner[key] = source.secretName;
    });
  });

  return { sources, merged, owner, conflicts };
};

const registerSecretManagerIpc = () => {
  ipcMain.handle('renderer:secret-managers-list', () => secretManagerStore.list());
  ipcMain.handle('renderer:secret-manager-add', (event, manager) => {
    secretManagerStore.add(manager);
    return secretManagerStore.list();
  });
  ipcMain.handle('renderer:secret-manager-update', (event, { uid, changes }) => {
    secretManagerStore.update(uid, changes);
    return secretManagerStore.list();
  });
  ipcMain.handle('renderer:secret-manager-remove', (event, { uid }) => {
    secretManagerStore.remove(uid);
    return secretManagerStore.list();
  });
  ipcMain.handle('renderer:secret-manager-reorder', (event, { orderedUids }) => {
    secretManagerStore.reorder(orderedUids);
    return secretManagerStore.list();
  });
  ipcMain.handle('renderer:secret-manager-test', (event, config) => testSecretManager(config));
  ipcMain.handle('renderer:secret-manager-resolve', (event, args) => resolveSecretRefs(args));
};

module.exports = registerSecretManagerIpc;
module.exports.testSecretManager = testSecretManager;
module.exports.resolveSecretRefs = resolveSecretRefs;
