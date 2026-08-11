import React, { useState } from 'react';
import {
  IconGitBranch,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconMinus,
  IconArrowBackUp,
  IconClock,
  IconArrowDown,
  IconArrowUp
} from '@tabler/icons';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import MenuDropdown from 'ui/MenuDropdown';
import useGitStatus from 'hooks/useGitStatus';
import StyledWrapper from './StyledWrapper';

const FileRow = ({ file, staged, selected, onSelect, onStage, onUnstage, onDiscard }) => (
  <div
    className={`file-row${selected ? ' selected' : ''}`}
    onClick={() => onSelect(file, staged)}
    data-testid="git-file-row"
  >
    <span className="file-status">{file.fileIndex?.trim() || file.working_dir?.trim() || '?'}</span>
    {/* rtl keeps the filename visible when the path is too long to fit */}
    <span className="file-path" title={file.path}>
      {file.path}
    </span>
    <span className="row-actions" onClick={(e) => e.stopPropagation()}>
      {staged ? (
        <ActionIcon label="Unstage" size="xs" onClick={() => onUnstage([file.path])}>
          <IconMinus size={13} strokeWidth={1.5} />
        </ActionIcon>
      ) : (
        <>
          <ActionIcon label="Discard" size="xs" colorOnHover="danger" onClick={() => onDiscard([file.path])}>
            <IconArrowBackUp size={13} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label="Stage" size="xs" onClick={() => onStage([file.path])}>
            <IconPlus size={13} strokeWidth={1.5} />
          </ActionIcon>
        </>
      )}
    </span>
  </div>
);

const DiffPane = ({ diff }) => (
  <div className="diff-pane">
    {diff.split('\n').map((line, i) => {
      const cls = line.startsWith('+') ? 'diff-add' : line.startsWith('-') ? 'diff-del' : line.startsWith('@@') ? 'diff-meta' : '';
      return (
        <div key={i} className={cls}>
          {line || ' '}
        </div>
      );
    })}
  </div>
);

const GitUI = ({ collection }) => {
  const git = useGitStatus(collection?.pathname);
  const [message, setMessage] = useState('');
  const [changesOpen, setChangesOpen] = useState(true);
  const [selected, setSelected] = useState(null);
  const [diff, setDiff] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const status = git.status;
  const staged = status?.changes?.staged || [];
  const unstaged = status?.changes?.unstaged || [];
  const renamed = status?.changes?.renamed || [];
  const hasChanges = staged.length + unstaged.length + renamed.length > 0;
  const ahead = status?.aheadBehind?.ahead || 0;
  const behind = status?.aheadBehind?.behind || 0;

  const showDiff = async (file, isStaged) => {
    setSelected(file.path);
    try {
      const result = await window.ipcRenderer.invoke('renderer:git-file-diff', {
        collectionPath: collection.pathname,
        filePath: file.path,
        staged: isStaged
      });
      setDiff(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (err) {
      setDiff(`Unable to load diff: ${err?.message || err}`);
    }
  };

  const commit = async () => {
    // Committing with nothing staged would fail in git; stage everything first so the
    // single Commit button behaves the way the empty-stage case implies.
    if (!staged.length) {
      const paths = [...unstaged, ...renamed].map((f) => f.path);
      if (paths.length) await git.stage(paths);
    }
    await git.commit(message);
    setMessage('');
  };

  // git itself blocks a checkout that would overwrite local edits; surface that message
  // instead of trying to force or auto-stash it.
  const switchBranch = async (branchName) => {
    try {
      await git.checkout(branchName);
      setDiff(null);
      setSelected(null);
    } catch {
      // useGitStatus already captured the message for the error banner
    }
  };

  const branchItems = (status?.branches || []).map((branch) => ({
    id: branch,
    label: branch,
    onClick: () => switchBranch(branch)
  }));

  // run() rethrows so callers can branch on failure; these buttons only need the toast,
  // so the rejection is absorbed here rather than escaping as an unhandled rejection.
  const ignoreFailure = (fn) => () => { fn()?.catch?.(() => {}); };

  const runFetch = async () => {
    await git.fetch();
    setLastFetched(new Date());
  };

  // Mirrors VS Code's wording so the button says what it is about to move.
  const syncLabel = (() => {
    if (git.loading) return 'Syncing…';
    if (ahead && behind) return `Sync ${behind} down, ${ahead} up`;
    if (ahead) return `Push ${ahead} commit${ahead > 1 ? 's' : ''}`;
    if (behind) return `Pull ${behind} commit${behind > 1 ? 's' : ''}`;
    return 'Sync Changes';
  })();

  if (status && status.initialized === false) {
    return (
      <StyledWrapper>
        <div className="git-main">
          <IconGitBranch size={44} strokeWidth={1.2} />
          <div className="main-hint">This collection is not under version control yet.</div>
          <Button size="sm" onClick={ignoreFailure(git.init)} data-testid="git-initialize">
            Initialize
          </Button>
          {git.error && <div className="error-banner">{git.error}</div>}
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="git-sidebar">
        <div className="repo-header">
          <IconGitBranch size={15} strokeWidth={1.5} />
          <span>{status?.gitRepoUrl?.split('/').pop()?.replace(/\.git$/, '') || collection?.name}</span>
        </div>

        <div className="section-title" onClick={() => setChangesOpen((v) => !v)}>
          {changesOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          Changes
        </div>

        {changesOpen && (
          <>
            <div className="commit-area">
              <textarea
                className="commit-message"
                placeholder="Enter commit message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="git-commit-message"
              />
              <Button
                size="sm"
                className="w-full mt-2"
                disabled={!message.trim() || !hasChanges || git.loading}
                onClick={ignoreFailure(commit)}
                data-testid="git-commit-btn"
              >
                Commit Changes
              </Button>
            </div>

            {git.error && <div className="error-banner">{git.error}</div>}

            <div className="changes-list">
              {!hasChanges && <div className="empty-note">Your branch has no local changes</div>}

              {!!staged.length && <div className="changes-group-label">Staged</div>}
              {staged.map((file) => (
                <FileRow
                  key={`s-${file.path}`}
                  file={file}
                  staged
                  selected={selected === file.path}
                  onSelect={showDiff}
                  onUnstage={git.unstage}
                />
              ))}

              {!!(unstaged.length + renamed.length) && <div className="changes-group-label">Changes</div>}
              {[...unstaged, ...renamed].map((file) => (
                <FileRow
                  key={`u-${file.path}`}
                  file={file}
                  staged={false}
                  selected={selected === file.path}
                  onSelect={showDiff}
                  onStage={git.stage}
                  onDiscard={git.discard}
                />
              ))}
            </div>
          </>
        )}

        <div className="branch-footer">
          <MenuDropdown items={branchItems} placement="top-start" selectedItemId={status?.currentGitBranch} showTickMark>
            <span className="branch-trigger" data-testid="git-branch-switcher">
              <IconGitBranch size={14} strokeWidth={1.5} />
              <span>{status?.currentGitBranch || '—'}</span>
              <IconChevronDown size={13} strokeWidth={1.5} />
            </span>
          </MenuDropdown>
        </div>
      </div>

      {diff ? (
        <DiffPane diff={diff} />
      ) : (
        <div className="git-main">
          <IconGitBranch size={44} strokeWidth={1.2} />
          <div className="main-hint">Perform git actions or open files from sidebar to view</div>

          <Button size="sm" onClick={ignoreFailure(git.sync)} disabled={git.loading} data-testid="git-sync">
            <IconRefresh size={14} strokeWidth={1.5} className="mr-1" />
            {syncLabel}
          </Button>

          <div className="action-row">
            <Button size="sm" color="secondary" onClick={ignoreFailure(runFetch)} disabled={git.loading} data-testid="git-fetch">
              <IconRefresh size={14} strokeWidth={1.5} className="mr-1" />
              Fetch
            </Button>
            <Button size="sm" color="secondary" onClick={ignoreFailure(git.pull)} disabled={git.loading} data-testid="git-pull">
              <IconDownload size={14} strokeWidth={1.5} className="mr-1" />
              Pull
            </Button>
            <Button size="sm" color="secondary" onClick={ignoreFailure(git.push)} disabled={git.loading} data-testid="git-push">
              <IconUpload size={14} strokeWidth={1.5} className="mr-1" />
              Push
            </Button>
          </div>

          {git.error && <div className="error-banner">{git.error}</div>}

          {lastFetched && (
            <div className="meta-line">
              <IconClock size={14} strokeWidth={1.5} />
              Last fetched: just now
            </div>
          )}

          <div className="meta-line">
            <IconArrowDown size={14} strokeWidth={1.5} />
            {behind} Behind
            <IconArrowUp size={14} strokeWidth={1.5} className="ml-2" />
            {ahead} Ahead
          </div>

          {!ahead && !behind && (
            <div className="status-card">
              <IconCheck size={16} strokeWidth={1.5} />
              Your branch is up to date
            </div>
          )}
        </div>
      )}
    </StyledWrapper>
  );
};

export default GitUI;
