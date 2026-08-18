import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IconDownload, IconPlus, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import StyledWrapper from './StyledWrapper';

export const VAULT_SECRETS_VAR = 'VAULT_SECRETS';
// The single-secret variable this replaced; still read so existing environments keep working.
export const LEGACY_VAULT_SECRET_VAR = 'VAULT_SECRET';

// The ordered tier list is stored as one comma-separated environment variable so it travels
// with the collection in git, the way the previous single-secret setup did.
export const readSecretNames = (environment) => {
  const variables = environment?.variables || [];
  const ordered = variables.find((v) => v.name === VAULT_SECRETS_VAR)?.value;
  if (ordered) {
    return ordered.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const legacy = variables.find((v) => v.name === LEGACY_VAULT_SECRET_VAR)?.value;
  return legacy ? [legacy.trim()] : [];
};

const VaultSecrets = ({ environment, secretNames, onSecretNamesChange, onApply, busy }) => {
  const [resolved, setResolved] = useState(null);
  const [selectedSource, setSelectedSource] = useState('__merged__');
  const [fetching, setFetching] = useState(false);

  const setNames = (next) => onSecretNamesChange(next);

  const updateName = (index, value) => {
    const next = [...secretNames];
    next[index] = value;
    setNames(next);
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= secretNames.length) return;
    const next = [...secretNames];
    [next[index], next[target]] = [next[target], next[index]];
    setNames(next);
  };

  const fetchSecrets = async () => {
    const names = secretNames.map((n) => n.trim()).filter(Boolean);
    if (!names.length) {
      toast.error('Add at least one secret name first');
      return;
    }
    setFetching(true);
    try {
      const result = await window.ipcRenderer.invoke('renderer:secret-manager-resolve', { secretNames: names });
      setResolved(result);
      setSelectedSource('__merged__');
      const failed = result.sources.filter((s) => !s.ok);
      if (failed.length) {
        toast.error(`${failed.length} of ${result.sources.length} secrets could not be read`);
      } else {
        toast.success(`Resolved ${Object.keys(result.merged).length} variables`);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not reach the secret manager');
    } finally {
      setFetching(false);
    }
  };

  const activeSource = useMemo(() => {
    if (!resolved) return null;
    if (selectedSource === '__merged__') return null;
    return resolved.sources.find((s) => s.secretName === selectedSource) || null;
  }, [resolved, selectedSource]);

  const rows = useMemo(() => {
    if (!resolved) return [];
    if (activeSource) {
      // In a single-tier view, mark the keys that a higher tier already claimed.
      return Object.entries(activeSource.variables).map(([key, value]) => ({
        key,
        value,
        from: activeSource.secretName,
        shadowed: resolved.owner[key] !== activeSource.secretName
      }));
    }
    return Object.entries(resolved.merged).map(([key, value]) => ({
      key,
      value,
      from: resolved.owner[key],
      shadowed: false
    }));
  }, [resolved, activeSource]);

  return (
    <StyledWrapper>
      <div className="vault-header">
        <span className="vault-title">Vault secrets</span>
        <Button size="sm" color="secondary" onClick={fetchSecrets} disabled={fetching || busy} data-testid="fetch-from-vault">
          <IconDownload size={14} strokeWidth={1.5} className="mr-1" />
          {fetching ? 'Fetching…' : 'Fetch from Vault'}
        </Button>
        {resolved && (
          <Button size="sm" onClick={() => onApply(resolved.merged)} disabled={busy} data-testid="apply-vault-secrets">
            Apply {Object.keys(resolved.merged).length} to secrets
          </Button>
        )}
      </div>

      {secretNames.map((name, index) => (
        <div className="tier-row" key={index}>
          <span className="tier-rank">{index + 1}</span>
          <input
            className="tier-input mousetrap"
            type="text"
            placeholder="Secret name, e.g. devau--qa-a-sa"
            value={name}
            onChange={(e) => updateName(index, e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <ActionIcon label="Move up" size="xs" onClick={() => move(index, -1)}>
            <IconChevronUp size={14} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label="Move down" size="xs" onClick={() => move(index, 1)}>
            <IconChevronDown size={14} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label="Remove" size="xs" colorOnHover="danger" onClick={() => setNames(secretNames.filter((_, i) => i !== index))}>
            <IconTrash size={14} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      ))}

      <div className="tier-row">
        <span className="tier-rank" />
        <Button size="sm" color="secondary" variant="ghost" onClick={() => setNames([...secretNames, ''])}>
          <IconPlus size={14} strokeWidth={1.5} className="mr-1" />
          Add secret
        </Button>
      </div>

      <div className="hint">
        Highest precedence first. A key defined by an earlier secret is not overwritten by a later
        one, so the most specific tier belongs at the top.
      </div>

      {resolved && (
        <>
          <div className="source-bar">
            <select
              className="source-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              data-testid="vault-source-select"
            >
              <option value="__merged__">Merged ({Object.keys(resolved.merged).length})</option>
              {resolved.sources.map((source) => (
                <option key={source.secretName} value={source.secretName}>
                  {source.secretName} ({Object.keys(source.variables).length})
                  {source.managerName ? ` · ${source.managerName}` : ''}
                </option>
              ))}
            </select>
            {!activeSource && !!resolved.conflicts.length && (
              <span className="hint">{resolved.conflicts.length} key(s) overridden by a higher tier</span>
            )}
          </div>

          {activeSource && !activeSource.ok && <div className="source-error">{activeSource.error}</div>}

          <table className="resolved">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className={row.shadowed ? 'shadowed' : ''}>
                  <td>{row.key}</td>
                  <td>{String(row.value)}</td>
                  <td className="from">{row.shadowed ? `overridden by ${resolved.owner[row.key]}` : row.from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </StyledWrapper>
  );
};

export default VaultSecrets;
