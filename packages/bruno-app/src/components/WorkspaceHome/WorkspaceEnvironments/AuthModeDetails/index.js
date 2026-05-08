import { IconCopy, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons';
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { renameAuthMode } from 'providers/ReduxStore/slices/auth-modes';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import CollectionAuth from 'components/CollectionSettings/Auth';
import CopyAuthMode from '../CopyAuthMode';
import DeleteAuthMode from '../DeleteAuthMode';
import StyledWrapper from './StyledWrapper';

/**
 * Workspace-page editor for a saved authentication mode.
 *
 * Mirrors the env-detail layout exactly: a header showing the mode's name with edit (inline
 * rename), copy and delete actions; a description line; then the full CollectionSettings
 * Auth UI bound to the mode's stub-collection.
 */
const WorkspaceAuthModeDetails = ({ authMode }) => {
  const dispatch = useDispatch();
  const authModes = useSelector((s) => s['auth-modes']?.authModes || []);
  const stub = useSelector((s) =>
    s.collections.collections.find((c) => c.__isAuthMode__ && c.uid === authMode.uid)
  );

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef(null);

  const validateAuthModeName = (name) => {
    if (!name || name.trim() === '') return 'Name is required';
    if (name.length < 1) return 'Must be at least 1 character';
    if (name.length > 255) return 'Must be 255 characters or less';
    if (!validateName(name)) return validateNameError(name);
    const trimmed = name.toLowerCase().trim();
    const isDuplicate = authModes.some(
      (m) => m?.uid !== authMode.uid && m?.name?.toLowerCase().trim() === trimmed
    );
    if (isDuplicate) return 'Authentication mode already exists';
    return null;
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
    setNewName(authMode.name);
    setNameError('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = () => {
    const error = validateAuthModeName(newName);
    if (error) {
      setNameError(error);
      return;
    }
    dispatch(renameAuthMode({ uid: authMode.uid, name: newName }))
      .then(() => {
        toast.success('Authentication mode renamed!');
        setIsRenaming(false);
        setNewName('');
        setNameError('');
      })
      .catch(() => toast.error('An error occurred while renaming the authentication mode'));
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName('');
    setNameError('');
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
    if (nameError) setNameError('');
  };

  const handleNameBlur = () => {
    if (newName.trim() === '') {
      handleCancelRename();
    } else {
      const error = validateAuthModeName(newName);
      if (error) setNameError(error);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  if (!stub) {
    return <div className="text-xs text-muted p-4">Loading authentication mode…</div>;
  }

  return (
    <StyledWrapper>
      {openDeleteModal && (
        <DeleteAuthMode onClose={() => setOpenDeleteModal(false)} authMode={authMode} />
      )}
      {openCopyModal && (
        <CopyAuthMode onClose={() => setOpenCopyModal(false)} authMode={authMode} />
      )}

      <div className="header">
        <div className={`title-container ${isRenaming ? 'renaming' : ''}`}>
          {isRenaming ? (
            <>
              <input
                ref={inputRef}
                type="text"
                className="title-input"
                value={newName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <div className="inline-actions">
                <button
                  className="inline-action-btn save"
                  onClick={handleSaveRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Save"
                >
                  <IconCheck size={14} strokeWidth={2} />
                </button>
                <button
                  className="inline-action-btn cancel"
                  onClick={handleCancelRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Cancel"
                >
                  <IconX size={14} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <h3 className="title">{authMode.name}</h3>
          )}
        </div>
        {nameError && isRenaming && <div className="title-error">{nameError}</div>}
        <div className="actions">
          <button onClick={handleRenameClick} title="Rename">
            <IconEdit size={15} strokeWidth={1.5} />
          </button>
          <button onClick={() => setOpenCopyModal(true)} title="Copy">
            <IconCopy size={15} strokeWidth={1.5} />
          </button>
          <button onClick={() => setOpenDeleteModal(true)} title="Delete">
            <IconTrash size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {!isRenaming && (
        <div className="header-description">
          Configure authentication here exactly as you would on a collection&apos;s Auth tab. Saved authentication modes can be referenced from collections, requests, or environments.
        </div>
      )}

      <div className="content">
        <CollectionAuth collection={stub} authModeContext />
      </div>
    </StyledWrapper>
  );
};

export default WorkspaceAuthModeDetails;
