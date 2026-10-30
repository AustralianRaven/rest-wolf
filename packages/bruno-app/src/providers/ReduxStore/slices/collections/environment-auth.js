import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import toast from 'react-hot-toast';
import { environmentSchema } from '@usebruno/schema';
import { findCollectionByUid, findEnvironmentInCollection } from 'utils/collections/index';
import {
  copySavedAuthForEnvironment,
  environmentAuthStubUid,
  getSavedAuthsDependingOn,
  toEnvironmentAuth
} from 'utils/auth-modes';
import { replaceEnvironmentAuthStubAuth, setCollectionEnvironmentAuth } from './index';

/**
 * Writes an environment's auth to disk and to the store. `collectionUid` is null for a
 * workspace (global) environment.
 */
const persistEnvironmentAuth = ({ collectionUid, environmentUid, auth }) => async (dispatch, getState) => {
  const { ipcRenderer } = window;
  const state = getState();

  if (!collectionUid) {
    const environment = state.globalEnvironments.globalEnvironments.find((e) => e?.uid === environmentUid);
    if (!environment) {
      throw new Error('Global environment not found');
    }
    const { workspaces } = state;
    const workspace = workspaces?.workspaces?.find((w) => w.uid === workspaces.activeWorkspaceUid);
    await ipcRenderer.invoke('renderer:save-global-environment', {
      environmentUid,
      variables: environment.variables || [],
      auth,
      workspaceUid: workspace?.uid,
      workspacePath: workspace?.pathname
    });
    dispatch({ type: 'global-environments/_setGlobalEnvironmentAuth', payload: { environmentUid, auth } });
  } else {
    const collection = findCollectionByUid(state.collections.collections, collectionUid);
    if (!collection) {
      throw new Error('Collection not found');
    }
    const environment = findEnvironmentInCollection(collection, environmentUid);
    if (!environment) {
      throw new Error('Environment not found');
    }
    const sanitizedEnvironment = await environmentSchema.validate({ ...cloneDeep(environment), auth }, { stripUnknown: true });
    await ipcRenderer.invoke('renderer:save-environment', collection.pathname, sanitizedEnvironment);
    dispatch(setCollectionEnvironmentAuth({ collectionUid, environmentUid, auth }));
  }

  dispatch(replaceEnvironmentAuthStubAuth({ uid: environmentAuthStubUid(environmentUid), auth }));
};

/**
 * Persist an environment-auth stub-collection's draft to disk.
 * The stub carries: parentCollectionUid (or null for global), environmentUid, isGlobalEnvironment.
 */
export const saveEnvironmentAuthFromStub = ({ uid }) => (dispatch, getState) => {
  const state = getState();
  const stub = state.collections.collections.find((c) => c.__isEnvironmentAuth__ && c.uid === uid);
  if (!stub) {
    return Promise.reject(new Error('Environment auth stub not found'));
  }
  const stubAuth = stub.draft?.root?.request?.auth || stub.root?.request?.auth || { mode: 'none' };

  return dispatch(persistEnvironmentAuth({
    collectionUid: stub.isGlobalEnvironment ? null : stub.parentCollectionUid,
    environmentUid: stub.environmentUid,
    auth: toEnvironmentAuth(stubAuth, state['auth-modes'].authModes)
  }));
};

/**
 * Rewrites the copy held by every loaded environment linked to `savedAuthUid` (directly, or
 * through a saved auth that points at it), so a shared environment follows edits to the saved
 * auth. Bare references written before copies existed are upgraded the same way. Covers open
 * collections and the active workspace's environments.
 */
export const syncLinkedEnvironmentAuths = (savedAuthUid) => async (dispatch, getState) => {
  const state = getState();
  const savedModes = state['auth-modes'].authModes;
  const affectedUids = new Set(getSavedAuthsDependingOn(savedAuthUid, savedModes));

  const updates = [];
  const queueUpdate = (collectionUid, environment) => {
    const linkedUid = environment.auth?.namedAuthModeUid;
    if (!affectedUids.has(linkedUid)) {
      return;
    }
    const copy = copySavedAuthForEnvironment(linkedUid, savedModes);
    if (copy && !isEqual(environment.auth, copy)) {
      updates.push({ collectionUid, environmentUid: environment.uid, auth: copy });
    }
  };

  state.collections.collections
    .filter((c) => !c.__isAuthMode__ && !c.__isEnvironmentAuth__)
    .forEach((collection) => (collection.environments || []).forEach((env) => queueUpdate(collection.uid, env)));
  (state.globalEnvironments.globalEnvironments || []).forEach((env) => queueUpdate(null, env));

  if (!updates.length) {
    return;
  }

  const results = await Promise.allSettled(updates.map((update) => dispatch(persistEnvironmentAuth(update))));
  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error('Failed to update linked environment auth:', r.reason));

  const updated = results.length - failed.length;
  if (updated) {
    toast.success(`Updated ${updated} linked environment${updated === 1 ? '' : 's'}`);
  }
  if (failed.length) {
    toast.error(`Failed to update ${failed.length} linked environment${failed.length === 1 ? '' : 's'}`);
  }
};
