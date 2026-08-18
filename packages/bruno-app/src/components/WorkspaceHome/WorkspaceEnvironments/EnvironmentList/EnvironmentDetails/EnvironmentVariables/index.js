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
  readSecretRefs,
  serializeSecretRefs
} from 'components/Environments/VaultSecrets';
import { uuid } from 'utils/common';

// Config rows the vault panel owns; they are kept out of the editable table.
const CONFIG_VARS = [VAULT_SECRETS_VAR, LEGACY_VAULT_SECRET_VAR];

const EnvironmentVariables = ({ environment, setIsModified, collection, searchQuery = '', variableType = 'variables' }) => {
  const dispatch = useDispatch();
  const { globalEnvironmentDraft } = useSelector((state) => state.globalEnvironments);

  const savedRefs = useMemo(() => readSecretRefs(environment), [environment]);
  const [secretRefs, setSecretRefs] = useState(savedRefs);

  const prevEnvUidRef = useRef(environment.uid);
  useEffect(() => {
    if (prevEnvUidRef.current !== environment.uid) {
      prevEnvUidRef.current = environment.uid;
      setSecretRefs(savedRefs);
    }
  }, [environment.uid, savedRefs]);

  const hasDraftForThisEnv = globalEnvironmentDraft?.environmentUid === environment.uid;

  const filteredEnvironment = useMemo(() => ({
    ...environment,
    variables: (environment.variables || []).filter((v) => !CONFIG_VARS.includes(v.name))
  }), [environment]);

  const serializedRefs = useMemo(() => serializeSecretRefs(secretRefs), [secretRefs]);
  const vaultHasChanges = serializedRefs !== serializeSecretRefs(savedRefs);

  const handleSave = useCallback(
    (variables) => {
      const variablesToSave = cloneDeep(variables).filter((v) => !CONFIG_VARS.includes(v.name));
      if (serializedRefs) {
        const existing = (environment.variables || []).find((v) => v.name === VAULT_SECRETS_VAR);
        variablesToSave.push({
          uid: existing?.uid || uuid(),
          name: VAULT_SECRETS_VAR,
          value: serializedRefs,
          type: 'text',
          secret: false,
          enabled: true
        });
      }
      return dispatch(saveGlobalEnvironment({ environmentUid: environment.uid, variables: variablesToSave }));
    },
    [dispatch, environment.uid, environment.variables, serializedRefs]
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
      <VaultSecrets refs={secretRefs} onRefsChange={setSecretRefs} onApply={handleApply} />
    );
  }, [variableType, secretRefs, handleApply]);

  // The vault panel and the table are siblings in a scrolling column: the surrounding
  // layout does not scroll, so an unbounded panel would push the table's Save button out
  // of reach.
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      {renderVaultPanel()}
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
        searchQuery={searchQuery}
        variableType={variableType}
      />
    </div>
  );
};

export default EnvironmentVariables;
