import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { markEnvironmentVariableAsSecret, saveEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { setEnvironmentsDraft, clearEnvironmentsDraft } from 'providers/ReduxStore/slices/collections';
import SensitiveWarningPopover from 'components/SensitiveFieldWarning/SensitiveWarningPopover';
import EnvironmentVariablesTable from 'components/EnvironmentVariablesTable';
import VaultSecrets, { readSecretRefs, serializeSecretRefs } from 'components/Environments/VaultSecrets';
import { uuid } from 'utils/common';
import { VAULT_SECRETS_VAR, VAULT_CONFIG_VARS } from 'utils/environments';
import { SENSITIVE_FIELD_WARNING, findUsedEnvironmentVariableUids } from 'utils/sensitive-fields';
import { VARIABLE_ADD_SCOPES } from 'utils/common/constants';

const EnvironmentVariables = ({ environment, setIsModified, collection, inheritedEnvironmentVariables, searchQuery = '', variableType = 'variables' }) => {
  const dispatch = useDispatch();

  const environmentsDraft = collection?.environmentsDraft;
  const hasDraftForThisEnv = environmentsDraft?.environmentUid === environment.uid;

  const savedRefs = useMemo(() => readSecretRefs(environment), [environment]);
  const [secretRefs, setSecretRefs] = useState(savedRefs);

  const prevEnvUidRef = useRef(environment.uid);
  useEffect(() => {
    if (prevEnvUidRef.current !== environment.uid) {
      prevEnvUidRef.current = environment.uid;
      setSecretRefs(savedRefs);
    }
  }, [environment.uid, savedRefs]);

  const filteredEnvironment = useMemo(() => ({
    ...environment,
    variables: (environment.variables || []).filter((v) => !VAULT_CONFIG_VARS.includes(v.name))
  }), [environment]);

  const serializedRefs = useMemo(() => serializeSecretRefs(secretRefs), [secretRefs]);
  const vaultHasChanges = serializedRefs !== serializeSecretRefs(savedRefs);

  const liveEnvironment = useMemo(() => (
    hasDraftForThisEnv ? { ...environment, variables: environmentsDraft.variables } : environment
  ), [environment, environmentsDraft, hasDraftForThisEnv]);

  const usedVariableUids = useMemo(
    () => findUsedEnvironmentVariableUids(collection, liveEnvironment),
    [collection, liveEnvironment]
  );

  const hasSensitiveUsage = useCallback((variable) => (
    !!variable?.uid && usedVariableUids.has(variable.uid)
  ), [usedVariableUids]);

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
      return dispatch(saveEnvironment(variablesToSave, environment.uid, collection.uid));
    },
    [dispatch, environment.uid, environment.variables, collection.uid, serializedRefs]
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
        setEnvironmentsDraft({
          collectionUid: collection.uid,
          environmentUid: environment.uid,
          variables
        })
      );
    },
    [dispatch, collection.uid, environment.uid]
  );

  const handleDraftClear = useCallback(() => {
    dispatch(clearEnvironmentsDraft({ collectionUid: collection.uid }));
  }, [dispatch, collection.uid]);

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

  const renderSensitiveWarning = useCallback(
    (variable, markOwnVariableAsSecret) => {
      if (!variable.secret && hasSensitiveUsage(variable)) {
        const markAsSecret = markOwnVariableAsSecret ?? (() => dispatch(markEnvironmentVariableAsSecret({
          collectionUid: collection.uid,
          environmentScope: VARIABLE_ADD_SCOPES.ENVIRONMENT,
          environmentUid: variable.inheritedFrom.uid,
          variableUid: variable.uid
        })));
        return (
          <SensitiveWarningPopover
            fieldName={variable.name}
            warningMessage={SENSITIVE_FIELD_WARNING.USED_IN_SENSITIVE_FIELD}
            scope={VARIABLE_ADD_SCOPES.ENVIRONMENT}
            variableName={variable.name}
            onMarkAsSecret={markAsSecret}
          />
        );
      }
      return null;
    },
    [hasSensitiveUsage, dispatch, collection.uid]
  );

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
        draft={hasDraftForThisEnv ? environmentsDraft : null}
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
