import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AuthModesList from './AuthModesList';
import AuthModeDetails from './AuthModeDetails';
import StyledWrapper from './StyledWrapper';

/**
 * Preferences tab for saved auth modes. Saved auths live on this machine; an environment that
 * uses one stores a copy that is kept in sync, so shared collections still authenticate.
 */
const AuthModes = () => {
  const authModes = useSelector((state) => state['auth-modes']?.authModes || []);
  const [selectedUid, setSelectedUid] = useState(null);
  const selectedAuthMode = authModes.find((m) => m.uid === selectedUid) || authModes[0] || null;

  return (
    <StyledWrapper className="w-full h-full" data-testid="preferences-auth-modes">
      <div className="auth-modes-list-pane">
        <AuthModesList selectedUid={selectedAuthMode?.uid ?? null} onSelect={setSelectedUid} />
      </div>
      <div className="auth-mode-details-pane">
        {selectedAuthMode ? (
          <AuthModeDetails authMode={selectedAuthMode} />
        ) : (
          <div className="empty-pane">Create an authentication mode to reuse it across collections and environments.</div>
        )}
      </div>
    </StyledWrapper>
  );
};

export default AuthModes;
