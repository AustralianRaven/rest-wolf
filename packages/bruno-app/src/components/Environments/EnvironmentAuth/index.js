import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEnvironmentAuthStub, removeEnvironmentAuthStub } from 'providers/ReduxStore/slices/collections';
import CollectionAuth from 'components/CollectionSettings/Auth';
import { environmentAuthStubUid, isLinkedSavedAuthCopy } from 'utils/auth-modes';
import LinkedSavedAuth from './LinkedSavedAuth';

/**
 * An environment's Auth tab, for collection environments and (with `isGlobal`) workspace
 * environments. The auth is edited through a stub collection so the collection Auth UI can be
 * reused; a copy of a saved auth is shown read-only until it is changed or detached.
 */
const EnvironmentAuth = ({ environment, collection, isGlobal }) => {
  const dispatch = useDispatch();
  const stubUid = environmentAuthStubUid(environment.uid);
  const stub = useSelector((s) => s.collections.collections.find((c) => c.uid === stubUid));

  const registerStub = (auth) => {
    dispatch(addEnvironmentAuthStub({
      uid: stubUid,
      parentCollectionUid: isGlobal ? null : collection?.uid,
      environmentUid: environment.uid,
      isGlobal: !!isGlobal,
      auth,
      name: `${environment.name} (env auth)`
    }));
  };

  useEffect(() => {
    registerStub(environment.auth || { mode: 'none' });
    return () => {
      dispatch(removeEnvironmentAuthStub({ uid: stubUid }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment.uid]);

  // Pick up auth changed outside this panel (the file watcher, or a saved auth sync) unless
  // there are unsaved edits.
  useEffect(() => {
    if (!stub || stub.draft) return;
    const next = environment.auth || { mode: 'none' };
    if (JSON.stringify(stub.root?.request?.auth) !== JSON.stringify(next)) {
      registerStub(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment.auth]);

  if (!stub) {
    return <div className="text-xs text-muted">Loading auth…</div>;
  }

  const savedAuth = stub.root?.request?.auth;

  return (
    <div className="mt-2">
      <div className="text-xs text-muted mb-2">
        Auth used by collections/requests that select <span className="font-medium">Inherit from Environment</span>.
      </div>
      {!stub.draft && isLinkedSavedAuthCopy(savedAuth) ? (
        <LinkedSavedAuth stub={stub} auth={savedAuth} />
      ) : (
        <CollectionAuth collection={stub} environmentAuthContext hideHeader saveLabel="Save Environment Auth" />
      )}
    </div>
  );
};

export default EnvironmentAuth;
