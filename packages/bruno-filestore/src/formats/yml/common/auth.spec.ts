import { toOpenCollectionAuth, toBrunoAuth } from './auth';

describe('bruno-specific auth modes', () => {
  it('toOpenCollectionAuth: keeps inherit-environment instead of dropping it', () => {
    expect(toOpenCollectionAuth({ mode: 'inherit-environment' } as any)).toBe('inherit-environment');
  });

  it('toBrunoAuth: reads inherit-environment back', () => {
    expect(toBrunoAuth('inherit-environment' as any)?.mode).toBe('inherit-environment');
  });

  it('toOpenCollectionAuth: keeps the named mode along with its uid', () => {
    expect(toOpenCollectionAuth({ mode: 'named', namedAuthModeUid: 'auth-1' } as any)).toEqual({
      type: 'named',
      uid: 'auth-1'
    });
  });

  it('toBrunoAuth: reads the named mode and its uid back', () => {
    const out = toBrunoAuth({ type: 'named', uid: 'auth-1' } as any);
    expect(out?.mode).toBe('named');
    expect(out?.namedAuthModeUid).toBe('auth-1');
  });

  it('round-trips every mode that has no dedicated auth block', () => {
    const modes = ['inherit', 'inherit-environment', 'named'] as const;
    modes.forEach((mode) => {
      const oc = toOpenCollectionAuth({ mode, namedAuthModeUid: 'auth-1' } as any);
      expect(toBrunoAuth(oc as any)?.mode).toBe(mode);
    });
  });

  it('leaves none as an absent auth block', () => {
    expect(toOpenCollectionAuth({ mode: 'none' } as any)).toBeUndefined();
    expect(toBrunoAuth(undefined)?.mode).toBe('none');
  });
});
