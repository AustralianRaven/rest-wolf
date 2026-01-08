const { ClientSecretCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

class AzureVaultService {
  constructor(config) {
    this.config = config;
    this.credential = null;
    this.secretClient = null;
  }

  /**
   * Initialize the Azure credentials and secret client
   * @throws {Error} If configuration is invalid or credentials fail
   */
  initialize() {
    const { tenantId, clientId, clientSecret, vaultUrl } = this.config;

    if (!tenantId || !clientId || !clientSecret || !vaultUrl) {
      throw new Error('Azure Key Vault configuration is incomplete. Please check tenantId, clientId, clientSecret, and vaultUrl.');
    }

    try {
      this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      this.secretClient = new SecretClient(vaultUrl, this.credential);
    } catch (error) {
      throw new Error(`Failed to initialize Azure Key Vault client: ${error.message}`);
    }
  }

  /**
   * Test the Azure Key Vault connection
   * @returns {Promise<boolean>} True if connection successful
   * @throws {Error} If authentication fails
   */
  async testConnection() {
    if (!this.secretClient) {
      this.initialize();
    }

    try {
      // Try to list secrets to test connection (doesn't require specific secret to exist)
      await this.secretClient.listPropertiesOfSecrets().next();
      return true;
    } catch (error) {
      if (error.code === 'Forbidden') {
        throw new Error('Azure Key Vault access denied. Please check your credentials and permissions.');
      } else if (error.code === 'KeyVaultAccessForbidden') {
        throw new Error('Access to Azure Key Vault is forbidden. Verify your application has the correct permissions.');
      } else {
        throw new Error(`Azure Key Vault connection failed: ${error.message}`);
      }
    }
  }

  /**
   * Fetch a secret from Azure Key Vault
   * @param {string} secretName - Name of the secret to fetch
   * @returns {Promise<Object>} Parsed secret content as JSON object
   * @throws {Error} If secret is not found or cannot be parsed
   */
  async fetchSecret(secretName) {
    if (!this.secretClient) {
      this.initialize();
    }

    try {
      const secret = await this.secretClient.getSecret(secretName);

      if (!secret.value) {
        throw new Error(`Secret '${secretName}' has no value`);
      }

      // Try to parse as JSON
      try {
        return JSON.parse(secret.value);
      } catch (parseError) {
        throw new Error(`Secret '${secretName}' is not valid JSON: ${parseError.message}`);
      }
    } catch (error) {
      if (error.code === 'SecretNotFound') {
        throw new Error(`Secret '${secretName}' not found in Azure Key Vault`);
      } else if (error.message.includes('not valid JSON')) {
        // Re-throw JSON parsing errors as-is
        throw error;
      } else {
        throw new Error(`Failed to fetch secret '${secretName}': ${error.message}`);
      }
    }
  }

  /**
   * Fetch all secrets from vault using vault secret name
   * @param {string} vaultSecret - Name of the vault secret containing all environment variables
   * @returns {Promise<Object>} Object with all secrets from the vault
   * @throws {Error} If secret is not found or cannot be parsed
   */
  async fetchAllSecrets(vaultSecret) {
    const secretData = await this.fetchSecret(vaultSecret);

    console.log('Azure Vault - Secret name:', vaultSecret);
    console.log('Azure Vault - Raw secret data:', JSON.stringify(secretData, null, 2));

    // Return all secrets as-is
    return secretData;
  }
}

module.exports = { AzureVaultService };
