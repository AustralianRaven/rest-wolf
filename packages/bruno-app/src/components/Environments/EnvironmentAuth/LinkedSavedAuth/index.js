import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { createAuthMode } from 'providers/ReduxStore/slices/auth-modes';
import AuthMode from 'components/CollectionSettings/Auth/AuthMode';
import AuthFields from 'components/RequestPane/Auth/AuthFields';
import { SensitiveFieldOwnerContext } from 'components/SensitiveFieldWarning/context';
import { humanizeRequestAuthMode } from 'utils/collections';
import { detachSavedAuthCopy, getSavedAuthName } from 'utils/auth-modes';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';

const AUTH_CONTENT_KEYS = {
  'akamai-edgegrid': 'akamaiEdgegrid'
};

const noop = () => {};
const noopUpdateAuth = () => ({ type: 'noop' });
const readOnlyFieldOwner = { updateField: noop };

/**
 * Read-only view of an environment's copy of a saved auth. The copy is what requests use, so it
 * works for anyone the collection is shared with; it can be detached into an editable auth, or
 * copied into the viewer's own saved auths.
 */
const LinkedSavedAuth = ({ stub, auth }) => {
  const dispatch = useDispatch();
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);
  const savedAuthName = getSavedAuthName(auth, savedModes);
  const isInSavedAuths = savedModes.some((m) => m.uid === auth.namedAuthModeUid);
  const detachedAuth = detachSavedAuthCopy(auth);

  const handleDetach = () => {
    const contentKey = AUTH_CONTENT_KEYS[auth.mode] ?? auth.mode;
    dispatch(updateCollectionAuth({ mode: auth.mode, collectionUid: stub.uid, content: detachedAuth[contentKey] }));
  };

  const handleCopyToSavedAuths = () => {
    dispatch(createAuthMode({ name: savedAuthName, auth: detachedAuth }))
      .then(({ name }) => toast.success(`Saved as "${name}" in Preferences → Auth Modes`))
      .catch(() => toast.error('Failed to copy to your saved auths'));
  };

  return (
    <StyledWrapper data-testid="linked-saved-auth">
      <div className="flex items-center">
        <AuthMode collection={stub} excludeOptions={['inherit-environment']} />
      </div>
      <div className="linked-saved-auth-note text-xs mt-2">
        A copy of the saved auth <span className="font-medium">{savedAuthName}</span> ({humanizeRequestAuthMode(auth.mode)}) is
        stored in this environment, so it works for anyone using this collection.{' '}
        {isInSavedAuths
          ? <>It updates automatically when you edit <span className="font-medium">{savedAuthName}</span> in Preferences &rarr; Auth Modes.</>
          : <><span className="font-medium">{savedAuthName}</span> isn&apos;t in your saved auths.</>}
      </div>
      <div className="flex gap-2 mt-3">
        {!isInSavedAuths && (
          <Button size="sm" variant="outline" onClick={handleCopyToSavedAuths} data-testid="linked-saved-auth-copy">
            Copy to my saved auths
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleDetach} data-testid="linked-saved-auth-detach">
          Detach &amp; edit
        </Button>
      </div>
      <SensitiveFieldOwnerContext.Provider value={readOnlyFieldOwner}>
        <div className="linked-saved-auth-fields mt-4">
          <AuthFields
            authMode={auth.mode}
            collection={stub}
            item={{ uid: `${stub.uid}:linked-saved-auth`, type: 'http-request', request: { auth } }}
            request={{ auth }}
            save={noop}
            updateAuth={noopUpdateAuth}
            readOnly
          />
        </div>
      </SensitiveFieldOwnerContext.Provider>
    </StyledWrapper>
  );
};

export default LinkedSavedAuth;
