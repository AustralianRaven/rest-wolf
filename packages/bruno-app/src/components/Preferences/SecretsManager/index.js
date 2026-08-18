import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconTrash, IconPencil, IconChevronUp, IconChevronDown } from '@tabler/icons';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import StyledWrapper from './StyledWrapper';

const EMPTY_FORM = {
  name: '',
  type: 'azure-key-vault',
  vaultUrl: '',
  tenantId: '',
  clientId: '',
  clientSecret: ''
};

const SecretsManager = () => {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(null);
  const [editingUid, setEditingUid] = useState(null);
  const [testState, setTestState] = useState(null);

  const load = async () => setManagers(await window.ipcRenderer.invoke('renderer:secret-managers-list'));

  useEffect(() => {
    load();
  }, []);

  const field = (key) => ({
    value: form?.[key] || '',
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  });

  const startAdd = () => {
    setEditingUid(null);
    setTestState(null);
    setForm({ ...EMPTY_FORM });
  };

  const startEdit = (manager) => {
    setEditingUid(manager.uid);
    setTestState(null);
    // clientSecret is never sent to the renderer, so it stays blank and is only written
    // back when the user actually types a replacement.
    setForm({ ...EMPTY_FORM, ...manager, clientSecret: '' });
  };

  const runTest = async () => {
    setTestState({ busy: true });
    const result = await window.ipcRenderer.invoke('renderer:secret-manager-test', { ...form, uid: editingUid });
    setTestState({ busy: false, ...result });
  };

  const save = async () => {
    if (!form.name.trim() || !form.vaultUrl.trim()) {
      toast.error('Name and vault URL are required');
      return;
    }
    try {
      const next = editingUid
        ? await window.ipcRenderer.invoke('renderer:secret-manager-update', { uid: editingUid, changes: form })
        : await window.ipcRenderer.invoke('renderer:secret-manager-add', form);
      setManagers(next);
      setForm(null);
      setEditingUid(null);
      toast.success(editingUid ? 'Secret manager updated' : 'Secret manager added');
    } catch (err) {
      toast.error(err?.message || 'Could not save secret manager');
    }
  };

  const remove = async (uid) => {
    setManagers(await window.ipcRenderer.invoke('renderer:secret-manager-remove', { uid }));
    toast.success('Secret manager removed');
  };

  const move = async (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= managers.length) return;
    const order = managers.map((m) => m.uid);
    [order[index], order[target]] = [order[target], order[index]];
    setManagers(await window.ipcRenderer.invoke('renderer:secret-manager-reorder', { orderedUids: order }));
  };

  return (
    <StyledWrapper>
      <div className="intro">
        Providers are queried in this order when an environment resolves its secrets. The first
        provider to define a key wins, so put the most specific one at the top.
      </div>

      {managers.map((manager, index) => (
        <div className="manager-row" key={manager.uid} data-testid="secret-manager-row">
          <span className="rank">{index + 1}</span>
          <div className="min-w-0">
            <div className="manager-name">{manager.name}</div>
            <div className="manager-url">{manager.vaultUrl}</div>
          </div>
          <div className="row-actions">
            <ActionIcon label="Move up" size="xs" onClick={() => move(index, -1)}>
              <IconChevronUp size={14} strokeWidth={1.5} />
            </ActionIcon>
            <ActionIcon label="Move down" size="xs" onClick={() => move(index, 1)}>
              <IconChevronDown size={14} strokeWidth={1.5} />
            </ActionIcon>
            <ActionIcon label="Edit" size="xs" onClick={() => startEdit(manager)}>
              <IconPencil size={14} strokeWidth={1.5} />
            </ActionIcon>
            <ActionIcon label="Remove" size="xs" colorOnHover="danger" onClick={() => remove(manager.uid)}>
              <IconTrash size={14} strokeWidth={1.5} />
            </ActionIcon>
          </div>
        </div>
      ))}

      {form ? (
        <div className="form">
          <label>Name</label>
          <input type="text" placeholder="QA Vault" autoComplete="off" {...field('name')} />

          <label>Provider</label>
          <select {...field('type')}>
            <option value="azure-key-vault">Azure Key Vault</option>
          </select>

          <label>Vault URL</label>
          <input type="text" placeholder="https://my-vault.vault.azure.net" autoComplete="off" {...field('vaultUrl')} />

          <label>Tenant ID</label>
          <input type="text" autoComplete="off" {...field('tenantId')} />

          <label>Client ID</label>
          <input type="text" autoComplete="off" {...field('clientId')} />

          <label>Client Secret</label>
          <input
            type="password"
            autoComplete="off"
            placeholder={editingUid ? 'Leave blank to keep the stored secret' : ''}
            {...field('clientSecret')}
          />
          <div className="hint">Stored encrypted on this machine and never shown again.</div>

          <div className="form-actions">
            <Button size="sm" onClick={save} data-testid="secret-manager-save">
              {editingUid ? 'Save' : 'Add'}
            </Button>
            <Button size="sm" color="secondary" onClick={runTest} disabled={testState?.busy}>
              {testState?.busy ? 'Testing…' : 'Test Connection'}
            </Button>
            <Button size="sm" color="secondary" variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            {testState && !testState.busy && (
              <span className={`test-result ${testState.success ? 'ok' : 'bad'}`}>
                {testState.success ? 'Connection succeeded' : testState.error}
              </span>
            )}
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={startAdd} data-testid="add-secret-manager">
          + Add Secret Manager
        </Button>
      )}
    </StyledWrapper>
  );
};

export default SecretsManager;
