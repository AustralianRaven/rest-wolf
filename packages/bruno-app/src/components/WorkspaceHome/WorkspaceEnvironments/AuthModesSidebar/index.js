import React, { useEffect, useState, useRef } from 'react';
import { IconSearch, IconPlus, IconCheck, IconX, IconCopy } from '@tabler/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  createAuthMode,
  renameAuthMode,
  copyAuthMode
} from 'providers/ReduxStore/slices/auth-modes';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import usePrevious from 'hooks/usePrevious';

/**
 * Mirror of EnvironmentsSidebar for saved auth modes. Lives in the same StyledWrapper so
 * styling stays in sync. No "activate" affordance — auth modes don't have an active state —
 * but adds Duplicate / Delete row actions.
 */
const AuthModesSidebar = ({ selection, setSelection }) => {
  const dispatch = useDispatch();
  const authModes = useSelector((s) => s['auth-modes']?.authModes || []);

  const [searchText, setSearchText] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [renamingUid, setRenamingUid] = useState(null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef(null);
  const renameContainerRef = useRef(null);
  const createContainerRef = useRef(null);

  const uids = authModes.map((m) => m.uid);
  const prevUids = usePrevious(uids);

  useEffect(() => {
    if (!prevUids) return;
    if (uids.length > prevUids.length) {
      const added = authModes.find((m) => !prevUids.includes(m.uid));
      if (added) setSelection({ kind: 'auth-mode', uid: added.uid });
    }
    if (uids.length < prevUids.length && selection?.kind === 'auth-mode') {
      const stillExists = authModes.some((m) => m.uid === selection.uid);
      if (!stillExists) {
        setSelection(authModes[0] ? { kind: 'auth-mode', uid: authModes[0].uid } : null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uids.join(',')]);

  useEffect(() => {
    if (!renamingUid) return;
    const handleClickOutside = (event) => {
      if (renameContainerRef.current && !renameContainerRef.current.contains(event.target)) handleCancelRename();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [renamingUid]);

  useEffect(() => {
    if (!isCreatingInline) return;
    const handleClickOutside = (event) => {
      if (createContainerRef.current && !createContainerRef.current.contains(event.target)) handleCancelCreate();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreatingInline]);

  const validateAuthModeName = (name, excludeUid = null) => {
    if (!name || name.trim() === '') return 'Name is required';
    if (!validateName(name)) return validateNameError(name);
    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = authModes.some((m) => m?.uid !== excludeUid && m?.name?.toLowerCase().trim() === trimmedName);
    if (isDuplicate) return 'Authentication mode already exists';
    return null;
  };

  const handleClick = (m) => setSelection({ kind: 'auth-mode', uid: m.uid });

  const handleDoubleClick = (m) => {
    setRenamingUid(m.uid);
    setNewName(m.name);
    setNameError('');
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  };

  const handleCreateClick = () => {
    setIsCreatingInline(true);
    setNewName('');
    setNameError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelCreate = () => { setIsCreatingInline(false); setNewName(''); setNameError(''); };

  const handleSaveNew = () => {
    const error = validateAuthModeName(newName);
    if (error) { setNameError(error); return; }
    dispatch(createAuthMode({ name: newName, auth: { mode: 'none' } }))
      .then(() => {
        toast.success('Authentication mode created');
        setIsCreatingInline(false);
        setNewName('');
        setNameError('');
      })
      .catch(() => toast.error('Failed to create authentication mode'));
  };

  const handleNameChange = (e) => { setNewName(e.target.value); if (nameError) setNameError(''); };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); renamingUid ? handleSaveRename() : handleSaveNew(); }
    else if (e.key === 'Escape') { e.preventDefault(); renamingUid ? handleCancelRename() : handleCancelCreate(); }
  };

  const handleSaveRename = () => {
    const error = validateAuthModeName(newName, renamingUid);
    if (error) { setNameError(error); return; }
    dispatch(renameAuthMode({ uid: renamingUid, name: newName }))
      .then(() => {
        toast.success('Authentication mode renamed');
        setRenamingUid(null);
        setNewName('');
        setNameError('');
      })
      .catch(() => toast.error('An error occurred while renaming'));
  };

  const handleCancelRename = () => { setRenamingUid(null); setNewName(''); setNameError(''); };

  const handleCopy = (e, m) => {
    e.stopPropagation();
    // Auto-generate a unique copy name
    const base = `${m.name} (copy)`;
    const existing = new Set(authModes.map((x) => x.name));
    let candidate = base;
    let n = 2;
    while (existing.has(candidate)) {
      candidate = `${m.name} (copy ${n++})`;
    }
    dispatch(copyAuthMode({ uid: m.uid, name: candidate }))
      .then(() => toast.success('Authentication mode duplicated'))
      .catch(() => toast.error('Failed to duplicate'));
  };

  const filtered = authModes.filter((m) => m.name.toLowerCase().includes(searchText.toLowerCase()));
  const isSelected = (m) => selection?.kind === 'auth-mode' && selection.uid === m.uid;

  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <h2 className="title">Authentication Modes</h2>
        <div className="flex items-center gap-2">
          <button className="btn-action" onClick={handleCreateClick} title="Create authentication mode">
            <IconPlus size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="search-container">
        <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
        <input
          type="text"
          placeholder="Search authentication modes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="environments-list">
        {filtered.map((m) => (
          <div
            key={m.uid}
            id={m.uid}
            className={`environment-item ${isSelected(m) ? 'active' : ''} ${renamingUid === m.uid ? 'renaming' : ''}`}
            onClick={() => renamingUid !== m.uid && handleClick(m)}
            onDoubleClick={() => handleDoubleClick(m)}
          >
            {renamingUid === m.uid ? (
              <div className="rename-container" ref={renameContainerRef}>
                <input
                  ref={inputRef}
                  type="text"
                  className="environment-name-input"
                  value={newName}
                  onChange={handleNameChange}
                  onKeyDown={handleNameKeyDown}
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
                <span className="environment-name">{m.name}</span>
                <div className="environment-actions">
                  <button className="row-action-btn" onClick={(e) => handleCopy(e, m)} title="Duplicate">
                    <IconCopy size={14} strokeWidth={1.5} />
                  </button>
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
              value={newName}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown}
              placeholder="Authentication mode name..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <div className="inline-actions">
              <button className="inline-action-btn save" onClick={handleSaveNew} onMouseDown={(e) => e.preventDefault()} title="Save">
                <IconCheck size={14} strokeWidth={2} />
              </button>
              <button className="inline-action-btn cancel" onClick={handleCancelCreate} onMouseDown={(e) => e.preventDefault()} title="Cancel">
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {nameError && (isCreatingInline || renamingUid) && <div className="env-error">{nameError}</div>}

        {!filtered.length && !isCreatingInline && (
          <div className="empty-list-hint">No authentication modes yet. Click + to create one.</div>
        )}
      </div>
    </div>
  );
};

export default AuthModesSidebar;
