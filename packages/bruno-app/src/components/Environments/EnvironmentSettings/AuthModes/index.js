import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconPlus, IconTrash, IconCheck, IconX, IconCopy, IconEdit } from '@tabler/icons';
import toast from 'react-hot-toast';
import {
  loadAuthModes,
  createAuthMode,
  deleteAuthMode,
  renameAuthMode,
  copyAuthMode
} from 'providers/ReduxStore/slices/auth-modes';
import AuthModeDetails from './AuthModeDetails';

const AuthModes = () => {
  const dispatch = useDispatch();
  const authModes = useSelector((s) => s['auth-modes']?.authModes || []);

  const [selectedUid, setSelectedUid] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingUid, setRenamingUid] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    dispatch(loadAuthModes()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!selectedUid && authModes.length) setSelectedUid(authModes[0].uid);
    if (selectedUid && !authModes.find((m) => m.uid === selectedUid) && authModes.length) {
      setSelectedUid(authModes[0].uid);
    }
  }, [authModes, selectedUid]);

  const handleCreate = () => {
    const name = (newName || '').trim();
    if (!name) return;
    dispatch(createAuthMode({ name, auth: { mode: 'none' } }))
      .then(({ uid }) => {
        setSelectedUid(uid);
        setNewName('');
        setIsCreating(false);
        toast.success('Auth mode created');
      })
      .catch(() => toast.error('Failed to create auth mode'));
  };

  const handleDelete = (uid) => {
    dispatch(deleteAuthMode({ uid }))
      .then(() => toast.success('Deleted'))
      .catch(() => toast.error('Failed to delete'));
  };

  const handleCopy = (m) => {
    dispatch(copyAuthMode({ uid: m.uid, name: `${m.name} (copy)` }))
      .then(({ uid }) => setSelectedUid(uid))
      .catch(() => toast.error('Failed to copy'));
  };

  const startRename = (m) => {
    setRenamingUid(m.uid);
    setRenameValue(m.name);
  };

  const commitRename = () => {
    const value = (renameValue || '').trim();
    if (!value || !renamingUid) {
      setRenamingUid(null);
      return;
    }
    dispatch(renameAuthMode({ uid: renamingUid, name: value }))
      .then(() => {
        setRenamingUid(null);
        setRenameValue('');
        toast.success('Renamed');
      })
      .catch(() => toast.error('Failed to rename'));
  };

  const selected = authModes.find((m) => m.uid === selectedUid);

  return (
    <div className="flex w-full h-full" style={{ minHeight: '60vh' }}>
      <div className="w-64 border-r flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-medium">Auth Modes</h2>
          <button
            className="btn-action"
            title="Create auth mode"
            onClick={() => {
              setIsCreating(true);
              setNewName('');
            }}
          >
            <IconPlus size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {authModes.length === 0 && !isCreating && (
            <div className="p-3 text-xs text-muted">No auth modes yet. Click + to create one.</div>
          )}
          {authModes.map((m) => (
            <div
              key={m.uid}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${selectedUid === m.uid ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
              onClick={() => setSelectedUid(m.uid)}
            >
              {renamingUid === m.uid ? (
                <input
                  autoFocus
                  className="text-sm flex-grow bg-transparent border rounded px-1 py-0.5 mr-2"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingUid(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm flex-grow truncate" title={m.name}>{m.name}</span>
              )}
              <div className="flex items-center gap-1">
                <button
                  className="btn-action"
                  title="Rename"
                  onClick={(e) => { e.stopPropagation(); startRename(m); }}
                >
                  <IconEdit size={14} strokeWidth={1.5} />
                </button>
                <button
                  className="btn-action"
                  title="Duplicate"
                  onClick={(e) => { e.stopPropagation(); handleCopy(m); }}
                >
                  <IconCopy size={14} strokeWidth={1.5} />
                </button>
                <button
                  className="btn-action"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.uid); }}
                >
                  <IconTrash size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
          {isCreating && (
            <div className="flex items-center px-3 py-2 gap-1">
              <input
                autoFocus
                className="text-sm flex-grow bg-transparent border rounded px-1 py-0.5"
                placeholder="Auth mode name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
                }}
              />
              <button className="btn-action" onClick={handleCreate} title="Save">
                <IconCheck size={14} strokeWidth={2} />
              </button>
              <button className="btn-action" onClick={() => { setIsCreating(false); setNewName(''); }} title="Cancel">
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow p-4 overflow-auto">
        {selected ? (
          <AuthModeDetails authMode={selected} />
        ) : (
          <div className="text-xs text-muted">Select or create an auth mode to begin.</div>
        )}
      </div>
    </div>
  );
};

export default AuthModes;
