import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { IconDownload } from '@tabler/icons';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';
import {
  saveGlobalEnvironment,
  setGlobalEnvironmentDraft,
  clearGlobalEnvironmentDraft
} from 'providers/ReduxStore/slices/global-environments';
import EnvironmentVariablesTable from 'components/EnvironmentVariablesTable';
import toast from 'react-hot-toast';
import { uuid } from 'utils/common';
import Button from 'ui/Button';

const EnvironmentVariables = ({ environment, setIsModified, collection, searchQuery = '' }) => {
  const dispatch = useDispatch();
  const { globalEnvironmentDraft } = useSelector((state) => state.globalEnvironments);
  const preferences = useSelector((state) => state.app.preferences);

  const [isFetchingFromVault, setIsFetchingFromVault] = useState(false);
  const [vaultSecretName, setVaultSecretName] = useState(
    () => (environment.variables || []).find((v) => v.name === 'VAULT_SECRET')?.value || ''
  );

  // Reset vault secret name when switching environments
  const prevEnvUidRef = useRef(environment.uid);
  useEffect(() => {
    if (prevEnvUidRef.current !== environment.uid) {
      prevEnvUidRef.current = environment.uid;
      setVaultSecretName(
        (environment.variables || []).find((v) => v.name === 'VAULT_SECRET')?.value || ''
      );
    }
  }, [environment.uid, environment.variables]);

  const hasDraftForThisEnv = globalEnvironmentDraft?.environmentUid === environment.uid;

  // Filter VAULT_SECRET from the environment passed to the table so it
  // doesn't appear as a regular editable row.
  const filteredEnvironment = useMemo(() => ({
    ...environment,
    variables: (environment.variables || []).filter((v) => v.name !== 'VAULT_SECRET')
  }), [environment]);

  const savedVaultSecret = useMemo(
    () => (environment.variables || []).find((v) => v.name === 'VAULT_SECRET')?.value || '',
    [environment.variables]
  );

  const vaultHasChanges = vaultSecretName.trim() !== savedVaultSecret;

  const handleSave = useCallback(
    (variables) => {
      const variablesToSave = cloneDeep(variables);
      if (vaultSecretName.trim()) {
        const existingVaultVar = (environment.variables || []).find((v) => v.name === 'VAULT_SECRET');
        variablesToSave.push({
          uid: existingVaultVar?.uid || uuid(),
          name: 'VAULT_SECRET',
          value: vaultSecretName.trim(),
          type: 'text',
          secret: false,
          enabled: true
        });
      }
      return dispatch(saveGlobalEnvironment({ environmentUid: environment.uid, variables: variablesToSave }));
    },
    [dispatch, environment.uid, environment.variables, vaultSecretName]
  );

  const handleSetIsModified = useCallback(
    (tableModified) => {
      setIsModified(tableModified || vaultHasChanges);
    },
    [setIsModified, vaultHasChanges]
  );

  const handleDraftChange = useCallback(
    (variables) => {
      dispatch(
        setGlobalEnvironmentDraft({
          environmentUid: environment.uid,
          variables
        })
      );
    },
    [dispatch, environment.uid]
  );

  const handleDraftClear = useCallback(() => {
    dispatch(clearGlobalEnvironmentDraft());
  }, [dispatch]);

  const handleFetchFromVault = async () => {
    if (!preferences.azureVault?.enabled) {
      toast.error('Azure Key Vault is not configured. Please check your preferences.');
      return;
    }
    if (!vaultSecretName.trim()) {
      toast.error('Please enter a Vault Secret name before fetching.');
      return;
    }
    setIsFetchingFromVault(true);
    try {
      const result = await window.ipcRenderer.invoke('azure-vault:fetch-secrets', {
        vaultSecret: vaultSecretName.trim()
      });
      if (result.success && result.secrets) {
        // Fire a custom event so EnvironmentVariablesTable can merge the fetched secrets.
        // We pass the secrets via the event so the table can update its formik state.
        window.dispatchEvent(new CustomEvent('vault-secrets-fetched', { detail: result.secrets }));
        const secretCount = Object.keys(result.secrets).length;
        toast.success(`Successfully fetched ${secretCount} secrets from Azure Key Vault`);
      } else {
        toast.error(result.error || 'Failed to fetch secrets from Azure Key Vault');
      }
    } catch (error) {
      toast.error(`Failed to fetch from vault: ${error.message}`);
    } finally {
      setIsFetchingFromVault(false);
    }
  };

  const renderVaultUI = useCallback(() => {
    if (!preferences.azureVault?.enabled) return null;
    return (
      <div className="vault-secret-row ml-2">
        <label className="vault-secret-label" htmlFor="vault-secret-input">
          Vault Secret
        </label>
        <input
          id="vault-secret-input"
          type="text"
          className="vault-secret-input mousetrap"
          placeholder="Secret name"
          value={vaultSecretName}
          onChange={(e) => setVaultSecretName(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <Button
          type="button"
          size="sm"
          color="primary"
          variant="outline"
          onClick={handleFetchFromVault}
          disabled={isFetchingFromVault}
          data-testid="fetch-from-vault"
        >
          <IconDownload size={14} strokeWidth={1.5} className="mr-1" />
          {isFetchingFromVault ? 'Fetching...' : 'Fetch from Vault'}
        </Button>
      </div>
    );
  }, [preferences.azureVault?.enabled, vaultSecretName, isFetchingFromVault, handleFetchFromVault]);

  return (
    <EnvironmentVariablesTable
      key={environment?.uid}
      environment={filteredEnvironment}
      collection={collection}
      onSave={handleSave}
      draft={hasDraftForThisEnv ? globalEnvironmentDraft : null}
      onDraftChange={handleDraftChange}
      onDraftClear={handleDraftClear}
      setIsModified={handleSetIsModified}
      forceHasChanges={vaultHasChanges}
      renderExtraButtonContent={renderVaultUI}
      searchQuery={searchQuery}
    />
  );
};

export default EnvironmentVariables;
