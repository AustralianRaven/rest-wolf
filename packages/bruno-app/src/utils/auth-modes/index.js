import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

// Saved auths may point at other saved auths; matches the hop limit of resolveAuthRef in electron.
const MAX_SAVED_AUTH_HOPS = 4;

export const environmentAuthStubUid = (environmentUid) => `env-auth:${environmentUid}`;

const withoutSavedAuthLink = (auth) => omit(auth || {}, ['namedAuthModeUid', 'namedAuthModeName']);

/**
 * An environment auth that is a copy of a saved auth: a concrete mode (oauth2, basic, ...) that
 * still records which saved auth it came from. Requests use the copy directly, so it works on
 * machines that don't have the saved auth.
 */
export const isLinkedSavedAuthCopy = (auth) => !!auth?.namedAuthModeUid && auth.mode !== 'named';

const resolveSavedAuth = (savedAuthUid, savedModes, hops = 0) => {
  if (hops > MAX_SAVED_AUTH_HOPS) {
    return null;
  }
  const savedMode = savedModes.find((m) => m.uid === savedAuthUid);
  if (!savedMode?.auth) {
    return null;
  }
  if (savedMode.auth.mode === 'named') {
    return resolveSavedAuth(savedMode.auth.namedAuthModeUid, savedModes, hops + 1);
  }
  return withoutSavedAuthLink(savedMode.auth);
};

/** The auth an environment linked to a saved auth stores: its resolved config plus the link. */
export const copySavedAuthForEnvironment = (savedAuthUid, savedModes) => {
  const savedMode = savedModes.find((m) => m.uid === savedAuthUid);
  const auth = savedMode && resolveSavedAuth(savedAuthUid, savedModes);
  if (!auth) {
    return null;
  }
  return { ...cloneDeep(auth), namedAuthModeUid: savedMode.uid, namedAuthModeName: savedMode.name };
};

/**
 * The auth to write for an environment. Picking a saved auth stores a copy of it rather than a
 * bare reference, so the environment keeps working when the collection is shared. A reference
 * to a saved auth this machine doesn't have is kept as-is.
 */
export const toEnvironmentAuth = (auth, savedModes) => {
  if (auth?.mode !== 'named') {
    return auth;
  }
  return copySavedAuthForEnvironment(auth.namedAuthModeUid, savedModes) || auth;
};

/** The saved auth uids whose copies change when `savedAuthUid` changes: itself and anything pointing at it. */
export const getSavedAuthsDependingOn = (savedAuthUid, savedModes, hops = 0) => {
  if (hops > MAX_SAVED_AUTH_HOPS) {
    return [];
  }
  const dependents = savedModes
    .filter((m) => m.auth?.mode === 'named' && m.auth.namedAuthModeUid === savedAuthUid)
    .flatMap((m) => getSavedAuthsDependingOn(m.uid, savedModes, hops + 1));
  return [savedAuthUid, ...dependents];
};

export const getSavedAuthName = (auth, savedModes) => {
  const savedMode = savedModes.find((m) => m.uid === auth?.namedAuthModeUid);
  return savedMode?.name || auth?.namedAuthModeName || 'Saved Auth';
};

/** A plain, editable auth holding the same settings as a linked copy, with the link dropped. */
export const detachSavedAuthCopy = (auth) => withoutSavedAuthLink(auth);
