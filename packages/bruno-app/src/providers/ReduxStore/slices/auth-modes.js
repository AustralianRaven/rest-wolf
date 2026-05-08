import { createSlice } from '@reduxjs/toolkit';
import { uuid } from 'utils/common/index';
import cloneDeep from 'lodash/cloneDeep';
import {
  addAuthModeStubCollection,
  removeAuthModeStubCollection,
  renameAuthModeStubCollection,
  replaceAuthModeStubAuth
} from 'providers/ReduxStore/slices/collections';

const initialState = {
  authModes: []
};

const emptyAuth = () => ({ mode: 'none' });

export const authModesSlice = createSlice({
  name: 'auth-modes',
  initialState,
  reducers: {
    setAuthModes: (state, action) => {
      state.authModes = Array.isArray(action.payload?.authModes) ? action.payload.authModes : [];
    },
    _addAuthMode: (state, action) => {
      const { uid, name, auth } = action.payload;
      state.authModes.push({ uid, name, auth: auth || emptyAuth() });
    },
    _renameAuthMode: (state, action) => {
      const { uid, name } = action.payload;
      const m = state.authModes.find((m) => m.uid === uid);
      if (m) m.name = name;
    },
    _deleteAuthMode: (state, action) => {
      const { uid } = action.payload;
      state.authModes = state.authModes.filter((m) => m.uid !== uid);
    },
    _saveAuthMode: (state, action) => {
      const { uid, auth } = action.payload;
      const m = state.authModes.find((m) => m.uid === uid);
      if (m) m.auth = cloneDeep(auth);
    }
  }
});

export const {
  setAuthModes,
  _addAuthMode,
  _renameAuthMode,
  _deleteAuthMode,
  _saveAuthMode
} = authModesSlice.actions;

// --- Thunks ---

export const loadAuthModes = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    ipcRenderer
      .invoke('renderer:get-auth-modes')
      .then(({ authModes }) => {
        const list = authModes || [];
        dispatch(setAuthModes({ authModes: list }));
        // Mirror each saved mode as a stub collection so the existing Auth UI can edit it.
        list.forEach((m) => {
          dispatch(addAuthModeStubCollection({ uid: m.uid, name: m.name, auth: m.auth }));
        });
        resolve(list);
      })
      .catch(reject);
  });
};

export const createAuthMode = ({ name, auth }) => (dispatch) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    const uid = uuid();
    const initialAuth = auth || emptyAuth();
    ipcRenderer
      .invoke('renderer:create-auth-mode', { uid, name, auth: initialAuth })
      .then((result) => {
        const finalUid = result?.uid || uid;
        const finalName = result?.name || name;
        dispatch(_addAuthMode({ uid: finalUid, name: finalName, auth: initialAuth }));
        dispatch(addAuthModeStubCollection({ uid: finalUid, name: finalName, auth: initialAuth }));
        resolve({ uid: finalUid, name: finalName });
      })
      .catch(reject);
  });
};

export const renameAuthMode = ({ uid, name }) => (dispatch) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    ipcRenderer
      .invoke('renderer:rename-auth-mode', { uid, name })
      .then(() => {
        dispatch(_renameAuthMode({ uid, name }));
        dispatch(renameAuthModeStubCollection({ uid, name }));
        resolve();
      })
      .catch(reject);
  });
};

export const copyAuthMode = ({ uid, name }) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    const state = getState();
    const base = state['auth-modes'].authModes.find((m) => m.uid === uid);
    if (!base) return reject(new Error('Auth mode not found'));
    const newUid = uuid();
    const auth = cloneDeep(base.auth);
    ipcRenderer
      .invoke('renderer:copy-auth-mode', { uid: newUid, name, auth })
      .then((result) => {
        const finalUid = result?.uid || newUid;
        const finalName = result?.name || name;
        dispatch(_addAuthMode({ uid: finalUid, name: finalName, auth }));
        dispatch(addAuthModeStubCollection({ uid: finalUid, name: finalName, auth }));
        resolve({ uid: finalUid, name: finalName });
      })
      .catch(reject);
  });
};

export const deleteAuthMode = ({ uid }) => (dispatch) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    ipcRenderer
      .invoke('renderer:delete-auth-mode', { uid })
      .then(() => {
        dispatch(_deleteAuthMode({ uid }));
        dispatch(removeAuthModeStubCollection({ uid }));
        resolve();
      })
      .catch(reject);
  });
};

// Persists the auth blob currently held by the stub-collection's draft (or root).
// Called from the modified saveCollectionSettings thunk when it detects __isAuthMode__.
export const saveAuthModeFromStub = ({ uid }) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    const state = getState();
    const stub = state.collections.collections.find((c) => c.__isAuthMode__ && c.uid === uid);
    if (!stub) return reject(new Error('Auth mode stub not found'));
    const auth = stub.draft?.root?.request?.auth || stub.root?.request?.auth || emptyAuth();
    ipcRenderer
      .invoke('renderer:save-auth-mode', { uid, auth })
      .then(() => {
        dispatch(_saveAuthMode({ uid, auth }));
        dispatch(replaceAuthModeStubAuth({ uid, auth }));
        resolve();
      })
      .catch(reject);
  });
};

export default authModesSlice.reducer;
