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
   * Construct secret name from cluster and tenant
   * @param {string} cluster - Cluster name
   * @param {string} tenantName - Tenant name
   * @returns {string} Secret name in format 'CLUSTER--TENANT_NAME'
   */
  static constructSecretName(cluster, tenantName) {
    if (!cluster || !tenantName) {
      throw new Error('Both cluster and tenant name are required to construct secret name');
    }
    return `${cluster}--${tenantName}`;
  }

  /**
   * Fetch Keycloak credentials from vault using cluster and tenant
   * @param {string} cluster - Cluster name from environment
   * @param {string} tenantName - Tenant name from environment
   * @returns {Promise<Object>} Object with keycloakClientId, keycloakClientSecret, and optionally keycloakRealmUrl
   * @throws {Error} If secret is not found or missing required fields
   */
  async fetchKeycloakCredentials(cluster, tenantName) {
    const secretName = AzureVaultService.constructSecretName(cluster, tenantName);
    const secretData = await this.fetchSecret(secretName);

    console.log('Azure Vault - Secret name:', secretName);
    console.log('Azure Vault - Raw secret data:', JSON.stringify(secretData, null, 2));
    console.log('Azure Vault - KEYCLOAK_REALM_URL value:', secretData.KEYCLOAK_REALM_URL);
    console.log('Azure Vault - KEYCLOAK_CLIENT_ID value:', secretData.KEYCLOAK_CLIENT_ID);
    console.log('Azure Vault - KEYCLOAK_CLIENT_SECRET exists:', !!secretData.KEYCLOAK_CLIENT_SECRET);

    const requiredFields = ['KEYCLOAK_REALM_URL', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET'];
    const missingFields = requiredFields.filter((field) => !secretData[field]);

    if (missingFields.length > 0) {
      console.error('Azure Vault - Missing fields:', missingFields);
      throw new Error(`Secret '${secretName}' is missing required fields: ${missingFields.join(', ')}`);
    }

    const result = {
      keycloakRealmUrl: secretData.KEYCLOAK_REALM_URL,
      keycloakClientId: secretData.KEYCLOAK_CLIENT_ID,
      keycloakClientSecret: secretData.KEYCLOAK_CLIENT_SECRET
    };

    console.log('Azure Vault - Final result:', JSON.stringify(result, null, 2));
    return result;
  }
}

module.exports = { AzureVaultService };
