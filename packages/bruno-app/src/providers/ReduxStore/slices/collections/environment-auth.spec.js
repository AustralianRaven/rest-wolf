import { configureStore } from '@reduxjs/toolkit';
import collectionsReducer, { addEnvironmentAuthStub, updateCollectionAuthMode, updateCollectionAuth } from './index';
import globalEnvironmentsReducer from '../global-environments';
import authModesReducer from '../auth-modes';
import { saveEnvironmentAuthFromStub, syncLinkedEnvironmentAuths } from './environment-auth';

jest.mock('@usebruno/schema', () => ({
  ...jest.requireActual('@usebruno/schema'),
  environmentSchema: { validate: jest.fn(async (environment) => environment) }
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const oauth2 = {
  mode: 'oauth2',
  oauth2: { grantType: 'client_credentials', accessTokenUrl: '{{TOKEN_URL}}', clientId: '{{CLIENT_ID}}' }
};
const editedOauth2 = { ...oauth2, oauth2: { ...oauth2.oauth2, clientId: '{{NEW_CLIENT_ID}}' } };
const linkedCopy = (auth, uid = 'kc-v2', name = 'KC V2') => ({ ...auth, namedAuthModeUid: uid, namedAuthModeName: name });
const bearer = { mode: 'bearer', bearer: { token: '{{TOKEN}}' } };

const environment = (uid, auth) => ({ uid, name: uid, variables: [], auth });

const createStore = ({ savedModes, collectionEnvironments = [], globalEnvironments = [] }) => {
  const invoke = jest.fn().mockResolvedValue(true);
  window.ipcRenderer = { invoke };
  const store = configureStore({
    reducer: {
      'collections': collectionsReducer,
      'globalEnvironments': globalEnvironmentsReducer,
      'auth-modes': authModesReducer,
      'workspaces': (state = { workspaces: [{ uid: 'ws', pathname: '/ws' }], activeWorkspaceUid: 'ws' }) => state
    },
    preloadedState: {
      'collections': {
        collections: [{ uid: 'col', name: 'col', pathname: '/col', items: [], environments: collectionEnvironments }]
      },
      'globalEnvironments': { globalEnvironments, activeGlobalEnvironmentUid: null },
      'auth-modes': { authModes: savedModes }
    }
  });
  return { store, invoke };
};

const collectionEnvironmentAuth = (store, uid) =>
  store.getState().collections.collections[0].environments.find((e) => e.uid === uid).auth;

describe('environment auth', () => {
  describe('syncLinkedEnvironmentAuths', () => {
    it('rewrites stale copies and bare references to the saved auth, and leaves other environments alone', async () => {
      const { store, invoke } = createStore({
        savedModes: [{ uid: 'kc-v2', name: 'KC V2', auth: editedOauth2 }],
        collectionEnvironments: [
          environment('stale-copy', linkedCopy(oauth2)),
          environment('bare-reference', { mode: 'named', namedAuthModeUid: 'kc-v2' }),
          environment('unrelated', bearer)
        ],
        globalEnvironments: [environment('global-copy', linkedCopy(oauth2))]
      });

      await store.dispatch(syncLinkedEnvironmentAuths('kc-v2'));

      expect(collectionEnvironmentAuth(store, 'stale-copy')).toEqual(linkedCopy(editedOauth2));
      expect(collectionEnvironmentAuth(store, 'bare-reference')).toEqual(linkedCopy(editedOauth2));
      expect(collectionEnvironmentAuth(store, 'unrelated')).toEqual(bearer);
      expect(store.getState().globalEnvironments.globalEnvironments[0].auth).toEqual(linkedCopy(editedOauth2));

      const savedCollectionEnvironments = invoke.mock.calls
        .filter(([channel]) => channel === 'renderer:save-environment')
        .map(([, , env]) => env.uid);
      expect(savedCollectionEnvironments.sort()).toEqual(['bare-reference', 'stale-copy']);
      expect(invoke).toHaveBeenCalledWith('renderer:save-global-environment', expect.objectContaining({
        environmentUid: 'global-copy',
        auth: linkedCopy(editedOauth2),
        workspacePath: '/ws'
      }));
    });

    it('does not write an environment whose copy is already current', async () => {
      const { store, invoke } = createStore({
        savedModes: [{ uid: 'kc-v2', name: 'KC V2', auth: oauth2 }],
        collectionEnvironments: [environment('current', linkedCopy(oauth2))]
      });

      await store.dispatch(syncLinkedEnvironmentAuths('kc-v2'));

      expect(invoke).not.toHaveBeenCalled();
    });

    it('updates environments linked to a saved auth that points at the edited one', async () => {
      const { store } = createStore({
        savedModes: [
          { uid: 'kc-v2', name: 'KC V2', auth: editedOauth2 },
          { uid: 'kc-alias', name: 'KC Alias', auth: { mode: 'named', namedAuthModeUid: 'kc-v2' } }
        ],
        collectionEnvironments: [environment('via-alias', linkedCopy(oauth2, 'kc-alias', 'KC Alias'))]
      });

      await store.dispatch(syncLinkedEnvironmentAuths('kc-v2'));

      expect(collectionEnvironmentAuth(store, 'via-alias')).toEqual(linkedCopy(editedOauth2, 'kc-alias', 'KC Alias'));
    });
  });

  describe('saveEnvironmentAuthFromStub', () => {
    it('stores a copy of a picked saved auth so the environment works without it', async () => {
      const { store, invoke } = createStore({
        savedModes: [{ uid: 'kc-v2', name: 'KC V2', auth: oauth2 }],
        collectionEnvironments: [environment('dev', undefined)]
      });
      store.dispatch(addEnvironmentAuthStub({
        uid: 'env-auth:dev', parentCollectionUid: 'col', environmentUid: 'dev', isGlobal: false, auth: { mode: 'none' }
      }));
      store.dispatch(updateCollectionAuthMode({ collectionUid: 'env-auth:dev', mode: 'named' }));
      store.dispatch(updateCollectionAuth({ collectionUid: 'env-auth:dev', mode: 'named', content: { namedAuthModeUid: 'kc-v2' } }));

      await store.dispatch(saveEnvironmentAuthFromStub({ uid: 'env-auth:dev' }));

      expect(collectionEnvironmentAuth(store, 'dev')).toEqual(linkedCopy(oauth2));
      expect(invoke).toHaveBeenCalledWith('renderer:save-environment', '/col', expect.objectContaining({ auth: linkedCopy(oauth2) }));
      const stub = store.getState().collections.collections.find((c) => c.uid === 'env-auth:dev');
      expect(stub.draft).toBeNull();
      expect(stub.root.request.auth).toEqual(linkedCopy(oauth2));
    });
  });
});
