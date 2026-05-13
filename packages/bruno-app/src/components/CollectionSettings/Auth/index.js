import React from 'react';
import get from 'lodash/get';
import { useDispatch, useSelector } from 'react-redux';
import AuthMode from './AuthMode';
import AwsV4Auth from './AwsV4Auth';
import BearerAuth from './BearerAuth';
import BasicAuth from './BasicAuth';
import DigestAuth from './DigestAuth';
import WsseAuth from './WsseAuth';
import ApiKeyAuth from './ApiKeyAuth/';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import OAuth2 from './OAuth2';
import OAuth1 from './Oauth1';
import NTLMAuth from './NTLMAuth';
import Button from 'ui/Button';
import { humanizeRequestAuthMode } from 'utils/collections';

/**
 * Props:
 *  - collection: the collection (or stub-collection) whose auth this view is editing.
 *  - authModeContext: when true, this Auth view is editing a *saved auth mode*. Hides
 *    options that don't make sense in that context (Inherit-from-Environment; "Saved Auths"
 *    nesting/circularity).
 *  - environmentAuthContext: when true, this Auth view is editing an environment's auth.
 *    Hides Inherit-from-Environment (would be circular).
 *  - hideHeader: omit the descriptive blurb above the dropdown (caller renders its own).
 *  - saveLabel: label for the Save button (default: "Save").
 */
const Auth = ({ collection, authModeContext = false, environmentAuthContext = false, hideHeader = false, saveLabel = 'Save' }) => {
  const authMode = collection.draft?.root ? get(collection, 'draft.root.request.auth.mode') : get(collection, 'root.request.auth.mode');
  const namedUid = collection.draft?.root ? get(collection, 'draft.root.request.auth.namedAuthModeUid') : get(collection, 'root.request.auth.namedAuthModeUid');
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);
  const globalEnvs = useSelector((s) => s.globalEnvironments?.globalEnvironments || []);
  const activeGlobalUid = useSelector((s) => s.globalEnvironments?.activeGlobalEnvironmentUid);
  const activeEnvUid = collection.activeEnvironmentUid;
  const activeEnv = (collection.environments || []).find((e) => e.uid === activeEnvUid)
    || globalEnvs.find((e) => e.uid === activeGlobalUid);
  const dispatch = useDispatch();

  const handleSave = () => dispatch(saveCollectionSettings(collection.uid));

  // In auth-mode and environment-auth contexts, "inherit-environment" would be circular.
  const excludeOptions = (authModeContext || environmentAuthContext) ? ['inherit-environment'] : [];
  // In auth-mode context, hide nesting saved auths within saved auths (the dropdown also
  // filters out the current uid to prevent self-reference).
  const hideSavedAuths = false;

  const getAuthView = () => {
    switch (authMode) {
      case 'awsv4': return <AwsV4Auth collection={collection} />;
      case 'basic': return <BasicAuth collection={collection} />;
      case 'bearer': return <BearerAuth collection={collection} />;
      case 'digest': return <DigestAuth collection={collection} />;
      case 'ntlm': return <NTLMAuth collection={collection} />;
      case 'oauth1': return <OAuth1 collection={collection} />;
      case 'oauth2': return <OAuth2 collection={collection} />;
      case 'wsse': return <WsseAuth collection={collection} />;
      case 'apikey': return <ApiKeyAuth collection={collection} />;
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
              <span className="text-red-500">Saved auth (missing). Pick another from the dropdown.</span>
            )}
          </div>
        );
      }
      case 'inherit-environment': {
        if (!activeEnv) {
          return <div className="mt-2 text-xs text-muted">No environment selected. Select an environment to use its auth.</div>;
        }
        const envAuth = activeEnv.auth;
        if (!envAuth || envAuth.mode === 'none' || !envAuth.mode) {
          return (
            <div className="mt-2 text-xs">
              Environment <span className="font-medium">{activeEnv.name}</span> has no auth configured.
            </div>
          );
        }
        if (envAuth.mode === 'named') {
          const mode = savedModes.find((m) => m.uid === envAuth.namedAuthModeUid);
          return (
            <div className="mt-2 text-xs">
              Inheriting from environment <span className="font-medium">{activeEnv.name}</span>:&nbsp;
              {mode ? (
                <>
                  <span className="font-medium">{mode.name}</span> ({humanizeRequestAuthMode(mode.auth?.mode)})
                </>
              ) : (
                <span className="text-red-500">missing saved auth</span>
              )}
            </div>
          );
        }
        return (
          <div className="mt-2 text-xs">
            Inheriting from environment <span className="font-medium">{activeEnv.name}</span>: {humanizeRequestAuthMode(envAuth.mode)}
          </div>
        );
      }
    }
  };

  return (
    <StyledWrapper className="w-full h-full">
      {!hideHeader && (
        <div className="text-xs mb-4 text-muted">
          Configures authentication for the entire collection. This applies to all requests using the{' '}
          <span className="font-medium">Inherit</span> option in the <span className="font-medium">Auth</span> tab.
        </div>
      )}
      <div className="flex flex-grow justify-start items-center">
        <AuthMode collection={collection} excludeOptions={excludeOptions} hideSavedAuths={hideSavedAuths} />
      </div>
      {getAuthView()}
      <div className="mt-6">
        <Button type="submit" size="sm" onClick={handleSave}>
          {saveLabel}
        </Button>
      </div>
    </StyledWrapper>
  );
};
export default Auth;
