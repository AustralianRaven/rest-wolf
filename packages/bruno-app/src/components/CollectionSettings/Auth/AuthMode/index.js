import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useDispatch, useSelector } from 'react-redux';
import { updateCollectionAuth, updateCollectionAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const BUILT_IN_ITEMS = (onModeChange) => ([
  { id: 'awsv4', label: 'AWS Sig v4', onClick: () => onModeChange('awsv4') },
  { id: 'basic', label: 'Basic Auth', onClick: () => onModeChange('basic') },
  { id: 'wsse', label: 'WSSE Auth', onClick: () => onModeChange('wsse') },
  { id: 'bearer', label: 'Bearer Token', onClick: () => onModeChange('bearer') },
  { id: 'digest', label: 'Digest Auth', onClick: () => onModeChange('digest') },
  { id: 'ntlm', label: 'NTLM Auth', onClick: () => onModeChange('ntlm') },
  { id: 'oauth2', label: 'OAuth 2.0', onClick: () => onModeChange('oauth2') },
  { id: 'apikey', label: 'API Key', onClick: () => onModeChange('apikey') },
  { id: 'inherit-environment', label: 'Inherit from Environment', onClick: () => onModeChange('inherit-environment') },
  { id: 'none', label: 'No Auth', onClick: () => onModeChange('none') }
]);

const AuthMode = ({ collection, excludeOptions = [], hideSavedAuths = false }) => {
  const dispatch = useDispatch();
  const authMode = collection.draft?.root ? get(collection, 'draft.root.request.auth.mode') : get(collection, 'root.request.auth.mode');
  const namedUid = collection.draft?.root ? get(collection, 'draft.root.request.auth.namedAuthModeUid') : get(collection, 'root.request.auth.namedAuthModeUid');
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);

  const onModeChange = useCallback((value) => {
    dispatch(
      updateCollectionAuthMode({
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, collection.uid]);

  const onPickNamed = useCallback((uid) => {
    // Switch mode to 'named' and stamp the namedAuthModeUid via updateCollectionAuth
    dispatch(updateCollectionAuthMode({ collectionUid: collection.uid, mode: 'named' }));
    dispatch(updateCollectionAuth({ mode: 'named', collectionUid: collection.uid, content: { namedAuthModeUid: uid } }));
  }, [dispatch, collection.uid]);

  const groups = useMemo(() => {
    const groups = [];
    if (!hideSavedAuths && savedModes.length) {
      // When inside the auth-mode editor, hide the current mode from the picker
      // (a saved mode shouldn't reference itself).
      const filteredSaved = savedModes.filter((m) => m.uid !== collection.uid);
      if (filteredSaved.length) {
        groups.push({
          name: 'Saved Auths',
          options: filteredSaved.map((m) => ({
            id: `named:${m.uid}`,
            label: m.name,
            onClick: () => onPickNamed(m.uid)
          }))
        });
      }
    }
    const builtIns = BUILT_IN_ITEMS(onModeChange).filter((it) => !excludeOptions.includes(it.id));
    groups.push({ name: '', options: builtIns });
    return groups;
  }, [savedModes, onModeChange, onPickNamed, excludeOptions, hideSavedAuths, collection.uid]);

  const selectedItemId = authMode === 'named' && namedUid ? `named:${namedUid}` : authMode;

  const triggerLabel = (() => {
    if (authMode === 'named') {
      const m = savedModes.find((x) => x.uid === namedUid);
      return m ? m.name : 'Saved Auth';
    }
    return humanizeRequestAuthMode(authMode);
  })();

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer auth-mode-selector">
        <MenuDropdown
          items={groups}
          placement="bottom-end"
          selectedItemId={selectedItemId}
          showGroupDividers={true}
          groupStyle="select"
        >
          <div className="flex items-center justify-center auth-mode-label select-none">
            {triggerLabel} <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};
export default AuthMode;
