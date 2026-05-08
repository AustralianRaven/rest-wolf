import React, { useEffect, useState, useRef } from 'react';
import usePrevious from 'hooks/usePrevious';
import { IconDownload, IconUpload, IconSearch, IconPlus, IconCheck, IconX, IconCopy } from '@tabler/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addGlobalEnvironment, copyGlobalEnvironment, renameGlobalEnvironment, selectGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';

/**
 * Sidebar half listing global environments. Self-contained (no right pane) so it can be
 * stacked alongside other sidebars (e.g. AuthModesSidebar) inside a shared StyledWrapper
 * that provides the common styles.
 *
 * Selection is a controlled prop: { kind: 'env', uid } | null.
 */
const EnvironmentsSidebar = ({
  selection,
  setSelection,
  onImportClick,
  onExportClick
}) => {
  const dispatch = useDispatch();
  const environments = useSelector((state) => state?.globalEnvironments?.globalEnvironments) || [];
  const activeEnvironmentUid = useSelector((state) => state?.globalEnvironments?.activeGlobalEnvironmentUid);

  const [searchText, setSearchText] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [renamingEnvUid, setRenamingEnvUid] = useState(null);
  const [newEnvName, setNewEnvName] = useState('');
  const [envNameError, setEnvNameError] = useState('');
  const inputRef = useRef(null);
  const renameContainerRef = useRef(null);
  const createContainerRef = useRef(null);

  const envUids = environments.map((env) => env.uid);
  const prevEnvUids = usePrevious(envUids);

  // Auto-select on add/remove
  useEffect(() => {
    if (!prevEnvUids) return;
    if (envUids.length > prevEnvUids.length) {
      const newEnv = environments.find((env) => !prevEnvUids.includes(env.uid));
      if (newEnv) setSelection({ kind: 'env', uid: newEnv.uid });
    }
    if (envUids.length < prevEnvUids.length && selection?.kind === 'env') {
      const stillExists = environments.some((e) => e.uid === selection.uid);
      if (!stillExists) {
        setSelection(environments[0] ? { kind: 'env', uid: environments[0].uid } : null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envUids.join(',')]);

  useEffect(() => {
    if (!renamingEnvUid) return;
    const handleClickOutside = (event) => {
      if (renameContainerRef.current && !renameContainerRef.current.contains(event.target)) handleCancelRename();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [renamingEnvUid]);

  useEffect(() => {
    if (!isCreatingInline) return;
    const handleClickOutside = (event) => {
      if (createContainerRef.current && !createContainerRef.current.contains(event.target)) handleCancelCreate();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreatingInline]);

  const validateEnvironmentName = (name, excludeUid = null) => {
    if (!name || name.trim() === '') return 'Name is required';
    if (!validateName(name)) return validateNameError(name);
    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = environments.some((env) => env?.uid !== excludeUid && env?.name?.toLowerCase().trim() === trimmedName);
    if (isDuplicate) return 'Environment already exists';
    return null;
  };

  const handleEnvironmentClick = (env) => setSelection({ kind: 'env', uid: env.uid });
  const handleEnvironmentDoubleClick = (env) => {
    setRenamingEnvUid(env.uid);
    setNewEnvName(env.name);
    setEnvNameError('');
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  };

  const handleActivateEnvironment = (e, env) => {
    e.stopPropagation();
    dispatch(selectGlobalEnvironment({ environmentUid: env.uid }))
      .then(() => toast.success(`Environment "${env.name}" activated`))
      .catch(() => toast.error('Failed to activate environment'));
  };

  const handleCopyClick = (e, env) => {
    e.stopPropagation();
    // Auto-generate a unique copy name (Foo (copy), Foo (copy 2), ...)
    const base = `${env.name} (copy)`;
    const existing = new Set(environments.map((x) => x.name));
    let candidate = base;
    let n = 2;
    while (existing.has(candidate)) {
      candidate = `${env.name} (copy ${n++})`;
    }
    dispatch(copyGlobalEnvironment({ environmentUid: env.uid, name: candidate }))
      .then(() => toast.success('Environment duplicated'))
      .catch(() => toast.error('Failed to duplicate environment'));
  };

  const handleCreateEnvClick = () => {
    setIsCreatingInline(true);
    setNewEnvName('');
    setEnvNameError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelCreate = () => { setIsCreatingInline(false); setNewEnvName(''); setEnvNameError(''); };

  const handleSaveNewEnv = () => {
    const error = validateEnvironmentName(newEnvName);
    if (error) { setEnvNameError(error); return; }
    dispatch(addGlobalEnvironment({ name: newEnvName }))
      .then(() => {
        toast.success('Environment created!');
        setIsCreatingInline(false);
        setNewEnvName('');
        setEnvNameError('');
      })
      .catch(() => toast.error('An error occurred while creating the environment'));
  };

  const handleEnvNameChange = (e) => { setNewEnvName(e.target.value); if (envNameError) setEnvNameError(''); };

  const handleEnvNameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); renamingEnvUid ? handleSaveRename() : handleSaveNewEnv(); }
    else if (e.key === 'Escape') { e.preventDefault(); renamingEnvUid ? handleCancelRename() : handleCancelCreate(); }
  };

  const handleSaveRename = () => {
    const error = validateEnvironmentName(newEnvName, renamingEnvUid);
    if (error) { setEnvNameError(error); return; }
    dispatch(renameGlobalEnvironment({ name: newEnvName, environmentUid: renamingEnvUid }))
      .then(() => {
        toast.success('Environment renamed!');
        setRenamingEnvUid(null);
        setNewEnvName('');
        setEnvNameError('');
      })
      .catch(() => toast.error('An error occurred while renaming the environment'));
  };

  const handleCancelRename = () => { setRenamingEnvUid(null); setNewEnvName(''); setEnvNameError(''); };

  const filtered = environments.filter((env) => env.name.toLowerCase().includes(searchText.toLowerCase()));
  const isSelected = (env) => selection?.kind === 'env' && selection.uid === env.uid;

  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <h2 className="title">Environments</h2>
        <div className="flex items-center gap-2">
          <button className="btn-action" onClick={handleCreateEnvClick} title="Create environment">
            <IconPlus size={16} strokeWidth={1.5} />
          </button>
          {onImportClick && (
            <button className="btn-action" onClick={onImportClick} title="Import environment">
              <IconDownload size={16} strokeWidth={1.5} />
            </button>
          )}
          {onExportClick && (
            <button className="btn-action" onClick={onExportClick} title="Export environment">
              <IconUpload size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="search-container">
        <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
        <input
          type="text"
          placeholder="Search environments..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="environments-list">
        {filtered.map((env) => (
          <div
            key={env.uid}
            id={env.uid}
            className={`environment-item ${isSelected(env) ? 'active' : ''} ${renamingEnvUid === env.uid ? 'renaming' : ''} ${activeEnvironmentUid === env.uid ? 'activated' : ''}`}
            onClick={() => renamingEnvUid !== env.uid && handleEnvironmentClick(env)}
            onDoubleClick={() => handleEnvironmentDoubleClick(env)}
          >
            {renamingEnvUid === env.uid ? (
              <div className="rename-container" ref={renameContainerRef}>
                <input
                  ref={inputRef}
                  type="text"
                  className="environment-name-input"
                  value={newEnvName}
                  onChange={handleEnvNameChange}
                  onKeyDown={handleEnvNameKeyDown}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <div className="inline-actions">
                  <button className="inline-action-btn save" onClick={handleSaveRename} onMouseDown={(e) => e.preventDefault()} title="Save">
                    <IconCheck size={14} strokeWidth={2} />
                  </button>
                  <button className="inline-action-btn cancel" onClick={handleCancelRename} onMouseDown={(e) => e.preventDefault()} title="Cancel">
                    <IconX size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="environment-name">{env.name}</span>
                <div className="environment-actions">
                  <button className="row-action-btn" onClick={(e) => handleCopyClick(e, env)} title="Duplicate">
                    <IconCopy size={14} strokeWidth={1.5} />
                  </button>
                  {activeEnvironmentUid === env.uid ? (
                    <div className="activated-checkmark" title="Active environment">
                      <IconCheck size={16} strokeWidth={2} />
                    </div>
                  ) : (
                    <button className="activate-btn" onClick={(e) => handleActivateEnvironment(e, env)} title="Activate environment">
                      <IconCheck size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {isCreatingInline && (
          <div className="environment-item creating" ref={createContainerRef}>
            <input
              ref={inputRef}
              type="text"
              className="environment-name-input"
              value={newEnvName}
              onChange={handleEnvNameChange}
              onKeyDown={handleEnvNameKeyDown}
              placeholder="Environment name..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <div className="inline-actions">
              <button className="inline-action-btn save" onClick={handleSaveNewEnv} onMouseDown={(e) => e.preventDefault()} title="Save">
                <IconCheck size={14} strokeWidth={2} />
              </button>
              <button className="inline-action-btn cancel" onClick={handleCancelCreate} onMouseDown={(e) => e.preventDefault()} title="Cancel">
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {envNameError && (isCreatingInline || renamingEnvUid) && <div className="env-error">{envNameError}</div>}

        {!filtered.length && !isCreatingInline && (
          <div className="empty-list-hint">No environments yet. Click + to create one.</div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentsSidebar;
