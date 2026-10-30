import React, { useMemo } from 'react';
import get from 'lodash/get';
import { updateAuth } from 'providers/ReduxStore/slices/collections';
import { useSelector } from 'react-redux';
import { humanizeRequestAuthMode } from 'utils/collections';
import AuthMode from './AuthMode';
import { getEffectiveAuthSource } from 'utils/auth';
import AuthFields from './AuthFields';
import InheritedAuth, { InheritedAuthSourceLabel } from './InheritedAuth';

const Auth = ({ item, collection }) => {
  const authMode = item.draft ? get(item, 'draft.request.auth.mode') : get(item, 'request.auth.mode');
  const namedUid = item.draft ? get(item, 'draft.request.auth.namedAuthModeUid') : get(item, 'request.auth.namedAuthModeUid');
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);
  const globalEnvs = useSelector((s) => s.globalEnvironments?.globalEnvironments || []);
  const activeGlobalUid = useSelector((s) => s.globalEnvironments?.activeGlobalEnvironmentUid);
  const activeEnvUid = collection.activeEnvironmentUid;
  const activeEnv = (collection.environments || []).find((e) => e.uid === activeEnvUid)
    || globalEnvs.find((e) => e.uid === activeGlobalUid);

  const request = item.draft
    ? get(item, 'draft.request', {})
    : get(item, 'request', {});

  const inheritedSource = useMemo(
    () => (authMode === 'inherit' ? getEffectiveAuthSource(collection, item) : null),
    [authMode, item, collection]
  );

  const getAuthView = () => {
    switch (authMode) {
      case 'inherit': {
        return <InheritedAuth collection={collection} item={item} inheritedSource={inheritedSource} />;
      }
      case 'named': {
        const mode = savedModes.find((m) => m.uid === namedUid);
        return (
          <div className="mt-2 text-xs">
            {mode ? (
              <>
                Using saved auth: <span className="font-medium">{mode.name}</span> ({humanizeRequestAuthMode(mode.auth?.mode)}).
                <div className="text-muted mt-1">Edit in Environment Settings &rarr; Auth Modes.</div>
              </>
            ) : (
              <span className="text-red-500">Saved auth (missing).</span>
            )}
          </div>
        );
      }
      case 'inherit-environment': {
        if (!activeEnv) {
          return <div className="mt-2 text-xs text-muted">No environment selected.</div>;
        }
        const envAuth = activeEnv.auth;
        if (!envAuth || envAuth.mode === 'none' || !envAuth.mode) {
          return (
            <div className="mt-2 text-xs">
              Environment <span className="font-medium">{activeEnv.name}</span> has no auth configured.
            </div>
          );
        }
        const named = envAuth.mode === 'named' ? savedModes.find((m) => m.uid === envAuth.namedAuthModeUid) : null;
        return (
          <div className="mt-2 text-xs">
            Inheriting from environment <span className="font-medium">{activeEnv.name}</span>:&nbsp;
            {envAuth.mode === 'named' ? (
              named ? (
                <>
                  <span className="font-medium">{named.name}</span> ({humanizeRequestAuthMode(named.auth?.mode)})
                </>
              ) : (
                <span className="text-red-500">missing saved auth</span>
              )
            ) : (
              humanizeRequestAuthMode(envAuth.mode)
            )}
          </div>
        );
      }
      default: {
        return (
          <AuthFields
            authMode={authMode}
            collection={collection}
            item={item}
            request={request}
            updateAuth={updateAuth}
          />
        );
      }
    }
  };

  return (
    <div className="w-full overflow-auto">
      <div className="flex flex-col items-start gap-2 mb-4 min-w-0">
        <AuthMode item={item} collection={collection} />
        {authMode === 'inherit' && inheritedSource ? (
          <InheritedAuthSourceLabel collection={collection} inheritedSource={inheritedSource} />
        ) : null}
      </div>
      {getAuthView()}
    </div>
  );
};

export default Auth;
