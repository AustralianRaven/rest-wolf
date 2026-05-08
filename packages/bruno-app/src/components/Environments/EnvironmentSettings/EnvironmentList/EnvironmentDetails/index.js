import { IconCopy, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons';
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { renameEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import {
  addEnvironmentAuthStub,
  removeEnvironmentAuthStub
} from 'providers/ReduxStore/slices/collections';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import CopyEnvironment from 'components/Environments/EnvironmentSettings/CopyEnvironment';
import DeleteEnvironment from 'components/Environments/EnvironmentSettings/DeleteEnvironment';
import EnvironmentVariables from './EnvironmentVariables';
import CollectionAuth from 'components/CollectionSettings/Auth';
import StyledWrapper from './StyledWrapper';

const envAuthStubUid = (environmentUid) => `env-auth:${environmentUid}`;

const EnvironmentAuthPanel = ({ environment, collection, isGlobal }) => {
  const dispatch = useDispatch();
  const stubUid = envAuthStubUid(environment.uid);
  const stub = useSelector((s) => s.collections.collections.find((c) => c.uid === stubUid));

  // Register / refresh the stub whenever the environment's auth changes (eg. the file
  // watcher updated it). Clean up on unmount.
  useEffect(() => {
    dispatch(addEnvironmentAuthStub({
      uid: stubUid,
      parentCollectionUid: isGlobal ? null : collection?.uid,
      environmentUid: environment.uid,
      isGlobal: !!isGlobal,
      auth: environment.auth || { mode: 'none' },
      name: `${environment.name} (env auth)`
    }));
    return () => {
      dispatch(removeEnvironmentAuthStub({ uid: stubUid }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment.uid]);

  // If the underlying env.auth changed externally and there's no draft, refresh the stub.
  useEffect(() => {
    if (!stub) return;
    if (stub.draft) return;
    const current = stub.root?.request?.auth;
    const next = environment.auth || { mode: 'none' };
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      dispatch(addEnvironmentAuthStub({
        uid: stubUid,
        parentCollectionUid: isGlobal ? null : collection?.uid,
        environmentUid: environment.uid,
        isGlobal: !!isGlobal,
        auth: next,
        name: `${environment.name} (env auth)`
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment.auth]);

  if (!stub) {
    return <div className="text-xs text-muted">Loading auth…</div>;
  }

  return (
    <div className="mt-2">
      <div className="text-xs text-muted mb-2">
        Auth used by collections/requests that select <span className="font-medium">Inherit from Environment</span>.
      </div>
      <CollectionAuth collection={stub} environmentAuthContext hideHeader saveLabel="Save Environment Auth" />
    </div>
  );
};

const EnvironmentTabs = ({ environment, setIsModified, collection }) => {
  const [tab, setTab] = useState('variables');
  return (
    <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
      <div className="flex border-b mb-2 flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <button
          className={`px-3 py-2 text-sm ${tab === 'variables' ? 'font-medium border-b-2' : 'text-muted'}`}
          style={tab === 'variables' ? { borderColor: 'var(--color-primary, currentColor)' } : {}}
          onClick={() => setTab('variables')}
        >
          Variables
        </button>
        <button
          className={`px-3 py-2 text-sm ${tab === 'auth' ? 'font-medium border-b-2' : 'text-muted'}`}
          style={tab === 'auth' ? { borderColor: 'var(--color-primary, currentColor)' } : {}}
          onClick={() => setTab('auth')}
        >
          Auth
        </button>
      </div>
      <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
        {tab === 'variables' ? (
          <EnvironmentVariables environment={environment} setIsModified={setIsModified} collection={collection} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <EnvironmentAuthPanel environment={environment} collection={collection} isGlobal={false} />
          </div>
        )}
      </div>
    </div>
  );
};

const EnvironmentDetails = ({ environment, setIsModified, collection }) => {
  const dispatch = useDispatch();
  const environments = collection?.environments || [];

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef(null);

  const validateEnvironmentName = (name) => {
    if (!name || name.trim() === '') {
      return 'Name is required';
    }

    if (name.length < 1) {
      return 'Must be at least 1 character';
    }

    if (name.length > 255) {
      return 'Must be 255 characters or less';
    }

    if (!validateName(name)) {
      return validateNameError(name);
    }

    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = (environments || []).some(
      (env) => env?.uid !== environment.uid && env?.name?.toLowerCase().trim() === trimmedName
    );
    if (isDuplicate) {
      return 'Environment already exists';
    }

    return null;
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
    setNewName(environment.name);
    setNameError('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = () => {
    const error = validateEnvironmentName(newName);
    if (error) {
      setNameError(error);
      return;
    }

    dispatch(renameEnvironment(newName, environment.uid, collection.uid))
      .then(() => {
        toast.success('Environment renamed!');
        setIsRenaming(false);
        setNewName('');
        setNameError('');
      })
      .catch(() => {
        toast.error('An error occurred while renaming the environment');
      });
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName('');
    setNameError('');
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleNameBlur = () => {
    if (newName.trim() === '') {
      handleCancelRename();
    } else {
      const error = validateEnvironmentName(newName);
      if (error) {
        setNameError(error);
      }
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

  return (
    <StyledWrapper>
      {openDeleteModal && (
        <DeleteEnvironment onClose={() => setOpenDeleteModal(false)} environment={environment} collection={collection} />
      )}
      {openCopyModal && (
        <CopyEnvironment onClose={() => setOpenCopyModal(false)} environment={environment} collection={collection} />
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
            <h2 className="title">{environment.name}</h2>
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

      <div className="content">
        <EnvironmentTabs environment={environment} setIsModified={setIsModified} collection={collection} />
      </div>
    </StyledWrapper>
  );
};

export default EnvironmentDetails;
