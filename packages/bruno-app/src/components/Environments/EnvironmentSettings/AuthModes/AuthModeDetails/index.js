import React from 'react';
import { useSelector } from 'react-redux';
import CollectionAuth from 'components/CollectionSettings/Auth';

/**
 * Per-collection auth-mode editor. Renders the existing CollectionSettings Auth UI on
 * top of the auth-mode stub-collection. The global-environments-page editor uses its own
 * wrapper (WorkspaceAuthModeDetails) which adds an env-style header.
 */
const AuthModeDetails = ({ authMode }) => {
  const stub = useSelector((s) =>
    s.collections.collections.find((c) => c.__isAuthMode__ && c.uid === authMode.uid)
  );

  if (!stub) {
    return <div className="text-xs text-muted">Loading auth mode…</div>;
  }

  return (
    <div className="w-full">
      <h3 className="text-base font-medium mb-2">{authMode.name}</h3>
      <div className="text-xs text-muted mb-3">
        Configure auth here exactly as you would on a collection&apos;s Auth tab. Saved auth modes
        can be referenced from collections, requests, or environments.
      </div>
      <CollectionAuth collection={stub} authModeContext />
    </div>
  );
};

export default AuthModeDetails;
