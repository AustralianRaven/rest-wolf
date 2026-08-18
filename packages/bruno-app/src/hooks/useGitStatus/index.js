import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { uuid } from 'utils/common';

// Shared git state for a collection. Both the toolbar branch chip and the Git UI tab
// read from here, so an operation in the tab updates the chip without a second query.
const useGitStatus = (collectionPath) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!collectionPath) return;
    try {
      const result = await window.ipcRenderer.invoke('renderer:git-status', { collectionPath });
      setStatus(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err?.message || String(err));
    }
  }, [collectionPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Every mutating call returns the recomputed panel state, so the caller never has to
  // re-query. Git operations are silent when they succeed, so each one reports through a
  // toast; without it a no-op push is indistinguishable from a broken button.
  const run = useCallback(
    async (channel, args = {}, successMessage) => {
      if (!collectionPath) return;
      setLoading(true);
      setError(null);
      try {
        const result = await window.ipcRenderer.invoke(channel, { collectionPath, ...args });
        if (result) setStatus(result);
        if (successMessage) toast.success(successMessage);
        return result;
      } catch (err) {
        const message = err?.message || String(err);
        setError(message);
        toast.error(message.split('\n')[0]);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionPath]
  );

  const ahead = status?.aheadBehind?.ahead || 0;
  const behind = status?.aheadBehind?.behind || 0;

  return {
    status,
    loading,
    error,
    ahead,
    behind,
    clearError: () => setError(null),
    refresh,
    init: () => run('renderer:git-init', {}, 'Repository initialised'),
    stage: (files) => run('renderer:git-stage', { files }),
    unstage: (files) => run('renderer:git-unstage', { files }),
    discard: (files) => run('renderer:git-discard', { files }, 'Changes discarded'),
    commit: (message) => run('renderer:git-commit', { message }, 'Changes committed'),
    fetch: () => run('renderer:git-fetch', {}, 'Fetched from remote'),
    pull: () => run('renderer:git-pull', { processUid: uuid() }, 'Pulled from remote'),
    push: () =>
      run('renderer:git-push', { processUid: uuid() }, ahead > 0 ? `Pushed ${ahead} commit(s)` : 'Already up to date'),
    // Pull before push so a push that would be rejected as non-fast-forward gets the
    // remote commits first - the same order VS Code's Sync uses.
    sync: async () => {
      if (behind > 0) await run('renderer:git-pull', { processUid: uuid() });
      return run('renderer:git-push', { processUid: uuid() }, 'Synced with remote');
    },
    checkout: (branchName, shouldCreate = false) =>
      run('renderer:git-checkout', { branchName, shouldCreate, processUid: uuid() }, `Switched to ${branchName}`)
  };
};

export default useGitStatus;
