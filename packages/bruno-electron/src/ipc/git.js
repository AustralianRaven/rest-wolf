const { ipcMain } = require('electron');
const path = require('path');
const {
  cloneGitRepository,
  getCollectionGitRootPath,
  getCollectionGitData,
  getChangedFilesInCollectionGit,
  getAheadBehindCount,
  getStagedFileDiff,
  getUnstagedFileDiff,
  stageChanges,
  unstageChanges,
  discardChanges,
  commitChanges,
  pushGitChanges,
  pullGitChanges,
  fetchChanges,
  canPush,
  initGit,
  checkoutGitBranch
} = require('../utils/git');
const { createDirectory, removePath } = require('../utils/filesystem');

// Every handler below is keyed on a collection path; git operations run against the
// repository root that contains it, which may sit above the collection folder.
const resolveGitRoot = (collectionPath) => {
  const gitRootPath = getCollectionGitRootPath(collectionPath);
  if (!gitRootPath) {
    throw new Error(`No git repository found for collection: ${collectionPath}`);
  }
  return gitRootPath;
};

// Single round trip for the git panel: repo metadata, working-tree changes and how far
// the branch has drifted from its upstream. Fetching these separately would let the
// panel render a file list against a stale branch header.
const getGitPanelState = async ({ collectionPath }) => {
  const gitRootPath = getCollectionGitRootPath(collectionPath);
  if (!gitRootPath) {
    return { initialized: false };
  }

  // A repository with no commits or no 'origin' makes the branch/remote lookups fail.
  // That is the normal state right after Initialize, so the panel still needs the
  // working-tree changes rather than an error.
  const [gitData, changes, aheadBehind] = await Promise.all([
    getCollectionGitData(gitRootPath, collectionPath).catch(() => ({ gitRootPath })),
    getChangedFilesInCollectionGit(gitRootPath, collectionPath),
    getAheadBehindCount(gitRootPath)
  ]);

  return { initialized: true, ...gitData, gitRootPath, changes, aheadBehind };
};

const initializeGitRepository = async ({ collectionPath }) => {
  await initGit(collectionPath);
  return getGitPanelState({ collectionPath });
};

const stageCollectionChanges = async ({ collectionPath, files }) => {
  await stageChanges(resolveGitRoot(collectionPath), files);
  return getGitPanelState({ collectionPath });
};

const unstageCollectionChanges = async ({ collectionPath, files }) => {
  await unstageChanges(resolveGitRoot(collectionPath), files);
  return getGitPanelState({ collectionPath });
};

const discardCollectionChanges = async ({ collectionPath, files }) => {
  await discardChanges(resolveGitRoot(collectionPath), files);
  return getGitPanelState({ collectionPath });
};

const commitCollectionChanges = async ({ collectionPath, message }) => {
  if (!message || !message.trim()) {
    throw new Error('Commit message is required');
  }
  await commitChanges(resolveGitRoot(collectionPath), message.trim());
  return getGitPanelState({ collectionPath });
};

const getCollectionFileDiff = async ({ collectionPath, filePath, staged }) => {
  const gitRootPath = resolveGitRoot(collectionPath);
  // git status reports repo-relative paths, but getUnstagedFileDiff matches against
  // absolute ones and falls back to reading the file straight off disk.
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(gitRootPath, filePath);
  return staged ? getStagedFileDiff(gitRootPath, absolutePath) : getUnstagedFileDiff(gitRootPath, absolutePath);
};

const canPushCollection = async ({ collectionPath }) => canPush(resolveGitRoot(collectionPath));

const fetchCollectionChanges = async ({ collectionPath, remote }) => {
  await fetchChanges(resolveGitRoot(collectionPath), remote || 'origin');
  return getGitPanelState({ collectionPath });
};

const registerGitIpc = (mainWindow) => {
  ipcMain.handle('renderer:clone-git-repository', async (event, { url, path, processUid }) => {
    let directoryCreated = false;
    try {
      await createDirectory(path);
      directoryCreated = true;
      await cloneGitRepository(mainWindow, { url, path, processUid });
      return 'Repository cloned successfully';
    } catch (error) {
      if (directoryCreated) {
        await removePath(path);
      }
      return Promise.reject(error);
    }
  });

  // git refuses to switch away from a dirty tree when the checkout would clobber local
  // edits; that error is surfaced to the panel rather than being forced through.
  ipcMain.handle('renderer:git-checkout', async (event, { collectionPath, branchName, processUid, shouldCreate }) => {
    await checkoutGitBranch(mainWindow, {
      gitRootPath: resolveGitRoot(collectionPath),
      branchName,
      processUid,
      shouldCreate
    });
    return getGitPanelState({ collectionPath });
  });

  ipcMain.handle('renderer:git-status', (event, args) => getGitPanelState(args));
  ipcMain.handle('renderer:git-init', (event, args) => initializeGitRepository(args));
  ipcMain.handle('renderer:git-stage', (event, args) => stageCollectionChanges(args));
  ipcMain.handle('renderer:git-unstage', (event, args) => unstageCollectionChanges(args));
  ipcMain.handle('renderer:git-discard', (event, args) => discardCollectionChanges(args));
  ipcMain.handle('renderer:git-commit', (event, args) => commitCollectionChanges(args));
  ipcMain.handle('renderer:git-file-diff', (event, args) => getCollectionFileDiff(args));
  ipcMain.handle('renderer:git-can-push', (event, args) => canPushCollection(args));
  ipcMain.handle('renderer:git-fetch', (event, args) => fetchCollectionChanges(args));

  // push/pull stream progress to the renderer over main:update-git-operation-progress,
  // so they take the window and a processUid the way clone does.
  ipcMain.handle('renderer:git-push', async (event, { collectionPath, processUid, remote, remoteBranch }) => {
    await pushGitChanges(mainWindow, {
      gitRootPath: resolveGitRoot(collectionPath),
      processUid,
      remote,
      remoteBranch
    });
    return getGitPanelState({ collectionPath });
  });

  // pullGitChanges rejects unless strategy is one of its two accepted values, so the
  // default is spelled out here rather than left to the caller.
  ipcMain.handle('renderer:git-pull', async (event, { collectionPath, processUid, remote, remoteBranch, strategy }) => {
    await pullGitChanges(mainWindow, {
      gitRootPath: resolveGitRoot(collectionPath),
      processUid,
      remote,
      remoteBranch,
      strategy: strategy || '--no-rebase'
    });
    return getGitPanelState({ collectionPath });
  });
};

module.exports = registerGitIpc;
module.exports.getGitPanelState = getGitPanelState;
module.exports.initializeGitRepository = initializeGitRepository;
module.exports.stageCollectionChanges = stageCollectionChanges;
module.exports.unstageCollectionChanges = unstageCollectionChanges;
module.exports.discardCollectionChanges = discardCollectionChanges;
module.exports.commitCollectionChanges = commitCollectionChanges;
module.exports.getCollectionFileDiff = getCollectionFileDiff;
module.exports.canPushCollection = canPushCollection;
module.exports.fetchCollectionChanges = fetchCollectionChanges;
