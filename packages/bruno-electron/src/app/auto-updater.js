const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const isDev = require('electron-is-dev');

const log = {
  info: (...args) => console.log('[auto-updater]', ...args),
  warn: (...args) => console.warn('[auto-updater]', ...args),
  error: (...args) => console.error('[auto-updater]', ...args)
};

autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function initAutoUpdater(mainWindow) {
  if (isDev) return;

  autoUpdater.on('error', (err) => {
    log.error('AutoUpdater error:', err);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: `RestWolf ${info.version} has been downloaded.`,
      detail: 'Restart the app to apply the update. Otherwise it will be installed the next time you quit.'
    });
    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.warn('Initial update check failed:', err);
  });

  // Re-check every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => log.warn('Update check failed:', err));
  }, 6 * 60 * 60 * 1000);
}

module.exports = { initAutoUpdater };
