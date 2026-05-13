import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IconChevronDown, IconChevronRight, IconCopy, IconCheck } from '@tabler/icons';
import get from 'lodash/get';

const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const formatExpiry = (exp) => {
  if (!exp) return null;
  const date = new Date(exp * 1000);
  const now = Date.now();
  const diff = exp * 1000 - now;
  const expired = diff < 0;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const label = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
  return { date: date.toLocaleString(), expired, label: expired ? `expired ${label} ago` : `expires in ${label}` };
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center', color: 'inherit', opacity: 0.6 }}>
      {copied ? <IconCheck size={13} strokeWidth={2} /> : <IconCopy size={13} strokeWidth={1.5} />}
    </button>
  );
};

const ClaimRow = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 8, padding: '2px 0', fontSize: 12, alignItems: 'flex-start' }}>
    <span style={{ minWidth: 90, fontWeight: 500, opacity: 0.7, flexShrink: 0 }}>{label}</span>
    <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>
      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
    </span>
  </div>
);

const TokenViewer = ({ credentialsId, collection }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const allCollections = useSelector((s) => s.collections.collections);

  // Find matching credentials — check the real collection first, then search all
  const searchCollections = collection?.parentCollectionUid
    ? [allCollections.find((c) => c.uid === collection.parentCollectionUid), ...allCollections].filter(Boolean)
    : allCollections;

  let found = null;
  for (const col of searchCollections) {
    if (!col?.oauth2Credentials) continue;
    const match = col.oauth2Credentials.find((c) => c.credentialsId === credentialsId);
    if (match) { found = match; break; }
  }

  if (!credentialsId || !found?.credentials?.access_token) {
    return (
      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 12, opacity: 0.6, border: '1px dashed currentColor' }}>
        No cached token yet — run a request first.
      </div>
    );
  }

  const { access_token, token_type, expires_in, scope } = found.credentials;
  const claims = decodeJwt(access_token);
  const expiry = formatExpiry(claims?.exp);
  const isExpired = expiry?.expired;

  return (
    <div style={{ marginTop: 12, border: '1px solid', borderColor: isExpired ? 'var(--color-danger, #e55)' : 'var(--color-border, currentColor)', borderRadius: 6, overflow: 'hidden', fontSize: 12 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', cursor: 'pointer', background: 'var(--color-surface, transparent)', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <IconChevronDown size={13} strokeWidth={2} /> : <IconChevronRight size={13} strokeWidth={2} />}
        <span style={{ fontWeight: 500 }}>Cached Token</span>
        {expiry && (
          <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7, color: isExpired ? 'var(--color-danger, #e55)' : undefined }}>
            {expiry.label}
          </span>
        )}
        {!expiry && expires_in && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>expires_in: {expires_in}s</span>}
      </div>

      {expanded && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border, currentColor)' }}>
          {claims ? (
            <>
              {claims.aud && <ClaimRow label="audience" value={claims.aud} />}
              {claims.iss && <ClaimRow label="issuer" value={claims.iss} />}
              {claims.sub && <ClaimRow label="subject" value={claims.sub} />}
              {claims.exp && <ClaimRow label="expires" value={expiry?.date || new Date(claims.exp * 1000).toLocaleString()} />}
              {claims.iat && <ClaimRow label="issued at" value={new Date(claims.iat * 1000).toLocaleString()} />}
              {claims.scp && <ClaimRow label="scopes" value={claims.scp} />}
              {!claims.scp && scope && <ClaimRow label="scopes" value={scope} />}
              {claims.roles && <ClaimRow label="roles" value={claims.roles} />}
              {claims.appid && <ClaimRow label="app id" value={claims.appid} />}
              {Object.entries(claims)
                .filter(([k]) => !['aud','iss','sub','exp','iat','nbf','scp','roles','appid'].includes(k))
                .map(([k, v]) => <ClaimRow key={k} label={k} value={v} />)}
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>Token type: {token_type || 'Bearer'} (not a JWT — cannot decode claims)</div>
          )}

          <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border, currentColor)', paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>Raw token</span>
              <CopyButton text={access_token} />
              <button
                onClick={() => setShowRaw(!showRaw)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.6 }}
              >
                {showRaw ? 'hide' : 'show'}
              </button>
            </div>
            {showRaw && (
              <div style={{ fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all', opacity: 0.8, maxHeight: 80, overflowY: 'auto', background: 'var(--color-surface, transparent)', padding: 6, borderRadius: 4 }}>
                {access_token}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenViewer;
