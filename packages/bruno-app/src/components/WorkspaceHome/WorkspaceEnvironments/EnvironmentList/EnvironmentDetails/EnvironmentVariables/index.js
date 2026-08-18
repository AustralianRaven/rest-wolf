import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';
import {
  saveGlobalEnvironment,
  setGlobalEnvironmentDraft,
  clearGlobalEnvironmentDraft
} from 'providers/ReduxStore/slices/global-environments';
import EnvironmentVariablesTable from 'components/EnvironmentVariablesTable';
import VaultSecrets, {
  VAULT_SECRETS_VAR,
  LEGACY_VAULT_SECRET_VAR,
  readSecretNames
} from 'components/Environments/VaultSecrets';
import { uuid } from 'utils/common';

// Config rows the vault panel owns; they are kept out of the editable table.
const CONFIG_VARS = [VAULT_SECRETS_VAR, LEGACY_VAULT_SECRET_VAR];

const EnvironmentVariables = ({ environment, setIsModified, collection, searchQuery = '', variableType = 'variables' }) => {
  const dispatch = useDispatch();
  const { globalEnvironmentDraft } = useSelector((state) => state.globalEnvironments);

  const savedSecretNames = useMemo(() => readSecretNames(environment), [environment]);
  const [secretNames, setSecretNames] = useState(savedSecretNames);

  const prevEnvUidRef = useRef(environment.uid);
  useEffect(() => {
    if (prevEnvUidRef.current !== environment.uid) {
      prevEnvUidRef.current = environment.uid;
      setSecretNames(savedSecretNames);
    }
  }, [environment.uid, savedSecretNames]);

  const hasDraftForThisEnv = globalEnvironmentDraft?.environmentUid === environment.uid;

  const filteredEnvironment = useMemo(() => ({
    ...environment,
    variables: (environment.variables || []).filter((v) => !CONFIG_VARS.includes(v.name))
  }), [environment]);

  const trimmedNames = useMemo(() => secretNames.map((n) => n.trim()).filter(Boolean), [secretNames]);
  const vaultHasChanges = trimmedNames.join(',') !== savedSecretNames.join(',');

  const handleSave = useCallback(
    (variables) => {
      const variablesToSave = cloneDeep(variables).filter((v) => !CONFIG_VARS.includes(v.name));
      if (trimmedNames.length) {
        const existing = (environment.variables || []).find((v) => v.name === VAULT_SECRETS_VAR);
        variablesToSave.push({
          uid: existing?.uid || uuid(),
          name: VAULT_SECRETS_VAR,
          value: trimmedNames.join(','),
          type: 'text',
          secret: false,
          enabled: true
        });
      }
      return dispatch(saveGlobalEnvironment({ environmentUid: environment.uid, variables: variablesToSave }));
    },
    [dispatch, environment.uid, environment.variables, trimmedNames]
  );

  const handleSetIsModified = useCallback(
    (tableModified) => {
      setIsModified(tableModified || vaultHasChanges);
    },
    [setIsModified, vaultHasChanges]
  );

  const handleDraftChange = useCallback(
    (variables) => {
      dispatch(setGlobalEnvironmentDraft({ environmentUid: environment.uid, variables }));
    },
    [dispatch, environment.uid]
  );

  const handleDraftClear = useCallback(() => {
    dispatch(clearGlobalEnvironmentDraft());
  }, [dispatch]);

  // The table owns the editable rows, so resolved values are handed to it through the same
  // event the fetch flow has always used rather than being written behind its back.
  const handleApply = useCallback((merged) => {
    window.dispatchEvent(new CustomEvent('vault-secrets-fetched', { detail: merged }));
  }, []);

  const renderVaultPanel = useCallback(() => {
    if (variableType !== 'secrets') return null;
    return (
      <VaultSecrets
        environment={environment}
        secretNames={secretNames}
        onSecretNamesChange={setSecretNames}
        onApply={handleApply}
      />
    );
  }, [variableType, environment, secretNames, handleApply]);

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
      renderExtraButtonContent={renderVaultPanel}
      searchQuery={searchQuery}
      variableType={variableType}
    />
  );
};

export default EnvironmentVariables;
