const { ipcMain } = require('electron');
const { AzureVaultService } = require('../services/azure-vault');
const { getPreferences } = require('../store/preferences');

const registerAzureVaultIpc = (mainWindow) => {
  /**
   * Test Azure Key Vault connection
   */
  ipcMain.handle('azure-vault:test-connection', async (event, config) => {
    try {
      const vaultService = new AzureVaultService(config);
      await vaultService.testConnection();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Fetch all secrets from Azure Key Vault
   */
  ipcMain.handle('azure-vault:fetch-secrets', async (event, { vaultSecret }) => {
    try {
      // Get Azure vault configuration from preferences
      const preferences = getPreferences();
      const azureVaultConfig = preferences?.azureVault;

      if (!azureVaultConfig?.enabled) {
        throw new Error('Azure Key Vault is not enabled in preferences');
      }

      const { tenantId, clientId, clientSecret, vaultUrl } = azureVaultConfig;

      if (!tenantId || !clientId || !clientSecret || !vaultUrl) {
        throw new Error('Azure Key Vault configuration is incomplete. Please check tenantId, clientId, clientSecret, and vaultUrl in preferences.');
      }

      const vaultService = new AzureVaultService({
        tenantId,
        clientId,
        clientSecret,
        vaultUrl
      });

      const secrets = await vaultService.fetchAllSecrets(vaultSecret);

      return {
        success: true,
        secrets
      };
    } catch (error) {
      console.error('Azure vault fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
};

module.exports = { registerAzureVaultIpc };
