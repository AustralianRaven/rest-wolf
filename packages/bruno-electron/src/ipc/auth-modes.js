const { ipcMain } = require('electron');
const { authModesStore } = require('../store/auth-modes');
const { generateUniqueName, sanitizeName } = require('../utils/filesystem');

const registerAuthModesIpc = (mainWindow) => {
  ipcMain.handle('renderer:create-auth-mode', async (event, { uid, name, auth }) => {
    try {
      const existing = authModesStore.getAuthModes();
      const existingNames = existing.map((m) => m.name);
      const sanitized = sanitizeName(name);
      const uniqueName = generateUniqueName(sanitized, (n) => existingNames.includes(n));
      authModesStore.addAuthMode({ uid, name: uniqueName, auth });
      return { uid, name: uniqueName };
    } catch (error) {
      console.error('Error in renderer:create-auth-mode:', error);
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:save-auth-mode', async (event, { uid, auth }) => {
    try {
      authModesStore.saveAuthMode({ uid, auth });
    } catch (error) {
      console.error('Error in renderer:save-auth-mode:', error);
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:rename-auth-mode', async (event, { uid, name }) => {
    try {
      authModesStore.renameAuthMode({ uid, name });
    } catch (error) {
      console.error('Error in renderer:rename-auth-mode:', error);
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:copy-auth-mode', async (event, { uid, name, auth }) => {
    try {
      const existing = authModesStore.getAuthModes();
      const existingNames = existing.map((m) => m.name);
      const sanitized = sanitizeName(name);
      const uniqueName = generateUniqueName(sanitized, (n) => existingNames.includes(n));
      authModesStore.copyAuthMode({ uid, name: uniqueName, auth });
      return { uid, name: uniqueName };
    } catch (error) {
      console.error('Error in renderer:copy-auth-mode:', error);
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:delete-auth-mode', async (event, { uid }) => {
    try {
      authModesStore.deleteAuthMode({ uid });
    } catch (error) {
      console.error('Error in renderer:delete-auth-mode:', error);
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-auth-modes', async () => {
    try {
      return { authModes: authModesStore.getAuthModes() || [] };
    } catch (error) {
      console.error('Error in renderer:get-auth-modes:', error);
      return Promise.reject(error);
    }
  });
};

module.exports = registerAuthModesIpc;
