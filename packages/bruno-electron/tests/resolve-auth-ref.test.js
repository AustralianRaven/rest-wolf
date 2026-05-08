// Unit tests for resolveAuthRef in utils/collection.js
// We mock the auth-modes store before requiring the module under test.

const mockAuthModes = [];

jest.mock('../src/store/auth-modes', () => ({
  authModesStore: {
    getAuthModes: () => mockAuthModes
  }
}));

// Avoid loading electron-store-related code paths via the preferences util
jest.mock('../src/store/preferences', () => ({
  preferencesUtil: { getRequestTimeout: () => 0 }
}));

// Avoid touching cache modules
jest.mock('../src/cache/requestUids', () => ({
  getRequestUid: () => 'r-uid',
  getExampleUid: () => 'e-uid'
}));

const { resolveAuthRef } = require('../src/utils/collection');

describe('resolveAuthRef', () => {
  beforeEach(() => {
    mockAuthModes.length = 0;
  });

  test('passthrough for direct modes', () => {
    expect(resolveAuthRef({ mode: 'none' }, null)).toEqual({ mode: 'none' });
    const basic = { mode: 'basic', basic: { username: 'u', password: 'p' } };
    expect(resolveAuthRef(basic, null)).toBe(basic);
  });

  test('named -> looks up by uid', () => {
    mockAuthModes.push({
      uid: 'm1',
      name: 'My Auth',
      auth: { mode: 'bearer', bearer: { token: 'abc' } }
    });
    const out = resolveAuthRef({ mode: 'named', namedAuthModeUid: 'm1' }, null);
    expect(out).toEqual({ mode: 'bearer', bearer: { token: 'abc' } });
  });

  test('named with missing uid returns none', () => {
    const out = resolveAuthRef({ mode: 'named', namedAuthModeUid: 'missing' }, null);
    expect(out).toEqual({ mode: 'none' });
  });

  test('inherit-environment -> uses env.auth blob directly', () => {
    const env = { uid: 'e1', name: 'prod', auth: { mode: 'basic', basic: { username: 'u', password: 'p' } } };
    const out = resolveAuthRef({ mode: 'inherit-environment' }, env);
    expect(out).toEqual({ mode: 'basic', basic: { username: 'u', password: 'p' } });
  });

  test('inherit-environment -> env.auth is named -> recursively resolves', () => {
    mockAuthModes.push({
      uid: 'm1',
      name: 'Saved',
      auth: { mode: 'bearer', bearer: { token: 'xyz' } }
    });
    const env = { uid: 'e1', auth: { mode: 'named', namedAuthModeUid: 'm1' } };
    const out = resolveAuthRef({ mode: 'inherit-environment' }, env);
    expect(out).toEqual({ mode: 'bearer', bearer: { token: 'xyz' } });
  });

  test('inherit-environment with no env or no env.auth -> none', () => {
    expect(resolveAuthRef({ mode: 'inherit-environment' }, null)).toEqual({ mode: 'none' });
    expect(resolveAuthRef({ mode: 'inherit-environment' }, { uid: 'e1' })).toEqual({ mode: 'none' });
    expect(resolveAuthRef({ mode: 'inherit-environment' }, { uid: 'e1', auth: { mode: 'none' } })).toEqual({ mode: 'none' });
  });
});
