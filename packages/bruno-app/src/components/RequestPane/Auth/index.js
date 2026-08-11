import React, { useMemo } from 'react';
import get from 'lodash/get';
import AwsV4Auth from './AwsV4Auth';
import BearerAuth from './BearerAuth';
import BasicAuth from './BasicAuth';
import DigestAuth from './DigestAuth';
import WsseAuth from './WsseAuth';
import NTLMAuth from './NTLMAuth';
import OAuth1 from './OAuth1';
import { updateAuth } from 'providers/ReduxStore/slices/collections';
import { saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch, useSelector } from 'react-redux';

import ApiKeyAuth from './ApiKeyAuth';
import EdgeGridAuth from './EdgeGridAuth';
import StyledWrapper from './StyledWrapper';
import { humanizeRequestAuthMode } from 'utils/collections';
import OAuth2 from './OAuth2/index';
import { getEffectiveAuthSource } from 'utils/auth';

const Auth = ({ item, collection }) => {
  const dispatch = useDispatch();
  const authMode = item.draft ? get(item, 'draft.request.auth.mode') : get(item, 'request.auth.mode');
  const namedUid = item.draft ? get(item, 'draft.request.auth.namedAuthModeUid') : get(item, 'request.auth.namedAuthModeUid');
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);
  const globalEnvs = useSelector((s) => s.globalEnvironments?.globalEnvironments || []);
  const activeGlobalUid = useSelector((s) => s.globalEnvironments?.activeGlobalEnvironmentUid);
  const activeEnvUid = collection.activeEnvironmentUid;
  const activeEnv = (collection.environments || []).find((e) => e.uid === activeEnvUid)
    || globalEnvs.find((e) => e.uid === activeGlobalUid);

  // Create a request object to pass to the auth components
  const request = item.draft
    ? get(item, 'draft.request', {})
    : get(item, 'request', {});

  // Save function for request level
  const save = () => {
    return dispatch(saveRequest(item.uid, collection.uid));
  };

  const inheritedSource = useMemo(
    () => (authMode === 'inherit' ? getEffectiveAuthSource(collection, item) : null),
    [authMode, item, collection]
  );

  const getAuthView = () => {
    switch (authMode) {
      case 'none': {
        return <div className="mt-2">No Auth</div>;
      }
      case 'awsv4': {
        return <AwsV4Auth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'basic': {
        return <BasicAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'bearer': {
        return <BearerAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'digest': {
        return <DigestAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'ntlm': {
        return <NTLMAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'oauth1': {
        return <OAuth1 collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'oauth2': {
        return <OAuth2 collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'wsse': {
        return <WsseAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'apikey': {
        return <ApiKeyAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'akamai-edgegrid': {
        return <EdgeGridAuth collection={collection} item={item} request={request} save={save} updateAuth={updateAuth} />;
      }
      case 'inherit': {
        return (
          <>
            <div className="flex flex-row w-full gap-2">
              <div>Auth inherited from {inheritedSource.name}: </div>
              <div className="inherit-mode-text" data-testid="inherited-auth-mode">{humanizeRequestAuthMode(inheritedSource.auth?.mode)}</div>
            </div>
          </>
        );
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
    }
  };

  return (
    <StyledWrapper className="w-full overflow-auto">
      {getAuthView()}
    </StyledWrapper>
  );
};

export default Auth;
