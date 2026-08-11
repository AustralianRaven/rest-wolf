import React from 'react';
import { useDispatch } from 'react-redux';
import { IconGitBranch } from '@tabler/icons';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import { uuid } from 'utils/common';
import useGitStatus from 'hooks/useGitStatus';
import StyledWrapper from './StyledWrapper';

// Shown only for collections that live inside a git repository; clicking it opens the
// Git UI tab for that collection.
const GitBranchChip = ({ collection }) => {
  const dispatch = useDispatch();
  const { status } = useGitStatus(collection?.pathname);

  if (!status?.initialized || !status?.currentGitBranch) {
    return null;
  }

  const ahead = status.aheadBehind?.ahead || 0;
  const behind = status.aheadBehind?.behind || 0;

  const openGitTab = () => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'git-ui'
      })
    );
  };

  return (
    <StyledWrapper type="button" onClick={openGitTab} aria-label="Git UI" data-testid="git-branch-chip">
      <IconGitBranch size={14} strokeWidth={1.5} />
      <span className="branch-name">{status.currentGitBranch}</span>
      {(ahead > 0 || behind > 0) && (
        <span className="drift">
          {behind > 0 && `↓${behind}`}
          {ahead > 0 && `↑${ahead}`}
        </span>
      )}
    </StyledWrapper>
  );
};

export default GitBranchChip;
