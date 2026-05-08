import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useDispatch, useSelector } from 'react-redux';
import { updateAuth, updateRequestAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const BUILT_IN_ITEMS = (onModeChange) => ([
  { id: 'awsv4', label: 'AWS Sig v4', onClick: () => onModeChange('awsv4') },
  { id: 'basic', label: 'Basic Auth', onClick: () => onModeChange('basic') },
  { id: 'bearer', label: 'Bearer Token', onClick: () => onModeChange('bearer') },
  { id: 'digest', label: 'Digest Auth', onClick: () => onModeChange('digest') },
  { id: 'ntlm', label: 'NTLM Auth', onClick: () => onModeChange('ntlm') },
  { id: 'oauth2', label: 'OAuth 2.0', onClick: () => onModeChange('oauth2') },
  { id: 'wsse', label: 'WSSE Auth', onClick: () => onModeChange('wsse') },
  { id: 'apikey', label: 'API Key', onClick: () => onModeChange('apikey') },
  { id: 'inherit', label: 'Inherit', onClick: () => onModeChange('inherit') },
  { id: 'inherit-environment', label: 'Inherit from Environment', onClick: () => onModeChange('inherit-environment') },
  { id: 'none', label: 'No Auth', onClick: () => onModeChange('none') }
]);

const AuthMode = ({ item, collection }) => {
  const dispatch = useDispatch();
  const authMode = item.draft ? get(item, 'draft.request.auth.mode') : get(item, 'request.auth.mode');
  const namedUid = item.draft ? get(item, 'draft.request.auth.namedAuthModeUid') : get(item, 'request.auth.namedAuthModeUid');
  const savedModes = useSelector((s) => s['auth-modes']?.authModes || []);

  const onModeChange = useCallback((value) => {
    dispatch(
      updateRequestAuthMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const onPickNamed = useCallback((uid) => {
    dispatch(updateRequestAuthMode({ itemUid: item.uid, collectionUid: collection.uid, mode: 'named' }));
    dispatch(updateAuth({ mode: 'named', collectionUid: collection.uid, itemUid: item.uid, content: { namedAuthModeUid: uid } }));
  }, [dispatch, collection.uid, item.uid]);

  const groups = useMemo(() => {
    const groups = [];
    if (savedModes.length) {
      groups.push({
        name: 'Saved Auths',
        options: savedModes.map((m) => ({
          id: `named:${m.uid}`,
          label: m.name,
          onClick: () => onPickNamed(m.uid)
        }))
      });
    }
    groups.push({ name: '', options: BUILT_IN_ITEMS(onModeChange) });
    return groups;
  }, [savedModes, onModeChange, onPickNamed]);

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
          showTickMark={true}
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
