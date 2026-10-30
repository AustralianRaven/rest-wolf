import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';
import {
  saveGlobalEnvironment,
  setGlobalEnvironmentDraft,
  clearGlobalEnvironmentDraft
} from 'providers/ReduxStore/slices/global-environments';
import { markEnvironmentVariableAsSecret } from 'providers/ReduxStore/slices/collections/actions';
import EnvironmentVariablesTable from 'components/EnvironmentVariablesTable';
import VaultSecrets, { readSecretRefs, serializeSecretRefs } from 'components/Environments/VaultSecrets';
import { uuid } from 'utils/common';
import { VAULT_SECRETS_VAR, VAULT_CONFIG_VARS } from 'utils/environments';
import SensitiveWarningPopover from 'components/SensitiveFieldWarning/SensitiveWarningPopover';
import { SENSITIVE_FIELD_WARNING, findUsedGlobalEnvironmentVariableUids } from 'utils/sensitive-fields';
import { VARIABLE_ADD_SCOPES } from 'utils/common/constants';

const EnvironmentVariables = ({ environment, setIsModified, collection, inheritedEnvironmentVariables, searchQuery = '', variableType = 'variables' }) => {
  const dispatch = useDispatch();
  const globalEnvironmentDraft = useSelector((state) => state.globalEnvironments.globalEnvironmentDraft);
  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments);
  const collections = useSelector((state) => state.collections.collections);

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
  const liveEnvironment = useMemo(() => (
    hasDraftForThisEnv ? { ...environment, variables: globalEnvironmentDraft.variables } : environment
  ), [environment, globalEnvironmentDraft, hasDraftForThisEnv]);
  const usedVariableUids = useMemo(
    () => findUsedGlobalEnvironmentVariableUids(collections, globalEnvironments, liveEnvironment),
    [collections, globalEnvironments, liveEnvironment]
  );
  const hasSensitiveUsage = useCallback((variable) => (
    !!variable?.uid && usedVariableUids.has(variable.uid)
  ), [usedVariableUids]);
  const renderSensitiveWarning = useCallback((variable, markOwnVariableAsSecret) => {
    if (!variable.secret && hasSensitiveUsage(variable)) {
      const markAsSecret = markOwnVariableAsSecret ?? (() => dispatch(markEnvironmentVariableAsSecret({
        environmentScope: VARIABLE_ADD_SCOPES.GLOBAL,
        environmentUid: variable.inheritedFrom.uid,
        variableUid: variable.uid
      })));
      return (
        <SensitiveWarningPopover
          fieldName={variable.name}
          warningMessage={SENSITIVE_FIELD_WARNING.USED_IN_SENSITIVE_FIELD}
          scope={VARIABLE_ADD_SCOPES.GLOBAL}
          variableName={variable.name}
          onMarkAsSecret={markAsSecret}
        />
      );
    }
    return null;
  }, [hasSensitiveUsage, dispatch]);

  const filteredEnvironment = useMemo(() => ({
    ...environment,
    variables: (environment.variables || []).filter((v) => !VAULT_CONFIG_VARS.includes(v.name))
  }), [environment]);

  const serializedRefs = useMemo(() => serializeSecretRefs(secretRefs), [secretRefs]);
  const vaultHasChanges = serializedRefs !== serializeSecretRefs(savedRefs);

  const handleSave = useCallback(
    (variables) => {
      const variablesToSave = cloneDeep(variables).filter((v) => !VAULT_CONFIG_VARS.includes(v.name));
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

  // Removes the rows from the table only; the environment still has to be saved, so a
  // mis-click is undone by Reset.
  const handleClear = useCallback(() => {
    window.dispatchEvent(new CustomEvent('vault-secrets-cleared'));
  }, []);

  const renderVaultPanel = useCallback(() => {
    if (variableType !== 'secrets') return null;
    return (
      <VaultSecrets refs={secretRefs} onRefsChange={setSecretRefs} onApply={handleApply} onClear={handleClear} />
    );
  }, [variableType, secretRefs, handleApply, handleClear]);

  // The vault panel and the table are siblings in a scrolling column: the surrounding
  // layout does not scroll, so an unbounded panel would push the table's Save button out
  // of reach.
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      {renderVaultPanel()}
      <EnvironmentVariablesTable
        key={environment?.uid}
        environment={filteredEnvironment}
        inheritedEnvironmentVariables={inheritedEnvironmentVariables}
        collection={collection}
        onSave={handleSave}
        draft={hasDraftForThisEnv ? globalEnvironmentDraft : null}
        onDraftChange={handleDraftChange}
        onDraftClear={handleDraftClear}
        setIsModified={handleSetIsModified}
        forceHasChanges={vaultHasChanges}
        renderSensitiveWarning={renderSensitiveWarning}
        searchQuery={searchQuery}
        variableType={variableType}
      />
    </div>
  );
};

export default EnvironmentVariables;
