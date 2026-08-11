import { useCallback, useEffect, useState } from 'react';
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
  // re-query. Errors surface to the panel instead of rejecting into an unhandled promise.
  const run = useCallback(
    async (channel, args = {}) => {
      if (!collectionPath) return;
      setLoading(true);
      setError(null);
      try {
        const result = await window.ipcRenderer.invoke(channel, { collectionPath, ...args });
        if (result) setStatus(result);
        return result;
      } catch (err) {
        setError(err?.message || String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionPath]
  );

  return {
    status,
    loading,
    error,
    clearError: () => setError(null),
    refresh,
    init: () => run('renderer:git-init'),
    stage: (files) => run('renderer:git-stage', { files }),
    unstage: (files) => run('renderer:git-unstage', { files }),
    discard: (files) => run('renderer:git-discard', { files }),
    commit: (message) => run('renderer:git-commit', { message }),
    fetch: () => run('renderer:git-fetch'),
    pull: () => run('renderer:git-pull', { processUid: uuid() }),
    push: () => run('renderer:git-push', { processUid: uuid() }),
    checkout: (branchName, shouldCreate = false) =>
      run('renderer:git-checkout', { branchName, shouldCreate, processUid: uuid() })
  };
};

export default useGitStatus;
