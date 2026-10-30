import {
  copySavedAuthForEnvironment,
  detachSavedAuthCopy,
  getSavedAuthName,
  getSavedAuthsDependingOn,
  isLinkedSavedAuthCopy,
  toEnvironmentAuth
} from './index';

const oauth2 = {
  mode: 'oauth2',
  oauth2: {
    grantType: 'client_credentials',
    accessTokenUrl: '{{KEYCLOAK_ADMIN_AUTHADDRESS}}/realms/{{TENANT_ID}}/protocol/openid-connect/token',
    clientId: '{{CLIENT_ID}}',
    clientSecret: '{{CLIENT_SECRET}}'
  }
};

const savedModes = [
  { uid: 'kc-v2', name: 'KC V2', auth: oauth2 },
  { uid: 'kc-alias', name: 'KC Alias', auth: { mode: 'named', namedAuthModeUid: 'kc-v2' } },
  { uid: 'basic', name: 'Basic', auth: { mode: 'basic', basic: { username: '{{USER}}', password: '{{PASS}}' } } }
];

describe('auth-modes utils', () => {
  describe('copySavedAuthForEnvironment', () => {
    it('copies the saved auth config and records which saved auth it came from', () => {
      expect(copySavedAuthForEnvironment('kc-v2', savedModes)).toEqual({
        ...oauth2,
        namedAuthModeUid: 'kc-v2',
        namedAuthModeName: 'KC V2'
      });
    });

    it('follows a saved auth that points at another saved auth, linking to the one picked', () => {
      expect(copySavedAuthForEnvironment('kc-alias', savedModes)).toEqual({
        ...oauth2,
        namedAuthModeUid: 'kc-alias',
        namedAuthModeName: 'KC Alias'
      });
    });

    it('returns a deep copy, so editing the copy leaves the saved auth untouched', () => {
      const copy = copySavedAuthForEnvironment('kc-v2', savedModes);
      copy.oauth2.clientId = 'changed';
      expect(savedModes[0].auth.oauth2.clientId).toBe('{{CLIENT_ID}}');
    });

    it('returns null for an unknown saved auth or a reference loop', () => {
      const loop = [
        { uid: 'a', name: 'A', auth: { mode: 'named', namedAuthModeUid: 'b' } },
        { uid: 'b', name: 'B', auth: { mode: 'named', namedAuthModeUid: 'a' } }
      ];
      expect(copySavedAuthForEnvironment('missing', savedModes)).toBeNull();
      expect(copySavedAuthForEnvironment('a', loop)).toBeNull();
    });
  });

  describe('toEnvironmentAuth', () => {
    it('turns a pick of a saved auth into a copy', () => {
      const auth = toEnvironmentAuth({ mode: 'named', namedAuthModeUid: 'basic' }, savedModes);
      expect(auth).toEqual({ ...savedModes[2].auth, namedAuthModeUid: 'basic', namedAuthModeName: 'Basic' });
    });

    it('keeps a reference to a saved auth this machine does not have', () => {
      const reference = { mode: 'named', namedAuthModeUid: 'someone-elses' };
      expect(toEnvironmentAuth(reference, savedModes)).toBe(reference);
    });

    it('leaves a plain auth alone', () => {
      const bearer = { mode: 'bearer', bearer: { token: '{{TOKEN}}' } };
      expect(toEnvironmentAuth(bearer, savedModes)).toBe(bearer);
    });
  });

  describe('isLinkedSavedAuthCopy', () => {
    it('is true only for a concrete auth that records a saved auth', () => {
      expect(isLinkedSavedAuthCopy(copySavedAuthForEnvironment('kc-v2', savedModes))).toBe(true);
      expect(isLinkedSavedAuthCopy({ mode: 'named', namedAuthModeUid: 'kc-v2' })).toBe(false);
      expect(isLinkedSavedAuthCopy(oauth2)).toBe(false);
      expect(isLinkedSavedAuthCopy(undefined)).toBe(false);
    });
  });

  describe('getSavedAuthsDependingOn', () => {
    it('includes the saved auth and every saved auth pointing at it', () => {
      expect(getSavedAuthsDependingOn('kc-v2', savedModes)).toEqual(['kc-v2', 'kc-alias']);
      expect(getSavedAuthsDependingOn('basic', savedModes)).toEqual(['basic']);
    });
  });

  describe('getSavedAuthName', () => {
    it('prefers the local saved auth name, then the name recorded on the copy', () => {
      expect(getSavedAuthName({ mode: 'oauth2', namedAuthModeUid: 'kc-v2', namedAuthModeName: 'Old name' }, savedModes)).toBe('KC V2');
      expect(getSavedAuthName({ mode: 'oauth2', namedAuthModeUid: 'elsewhere', namedAuthModeName: 'KC V2' }, savedModes)).toBe('KC V2');
      expect(getSavedAuthName({ mode: 'oauth2', namedAuthModeUid: 'elsewhere' }, savedModes)).toBe('Saved Auth');
    });
  });

  describe('detachSavedAuthCopy', () => {
    it('drops the link and keeps the settings', () => {
      expect(detachSavedAuthCopy(copySavedAuthForEnvironment('kc-v2', savedModes))).toEqual(oauth2);
    });
  });
});
