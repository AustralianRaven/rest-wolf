import React from 'react';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import SingleLineEditor from 'components/SingleLineEditor';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';

const NTLMAuth = ({ collection, authData, onAuthChange, onSave }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const generic = !!onAuthChange;
  const ntlmAuth = generic
    ? (authData?.ntlm || {})
    : (collection.draft?.root ? get(collection, 'draft.root.request.auth.ntlm', {}) : get(collection, 'root.request.auth.ntlm', {}));

  const sensitive = useDetectSensitiveField(generic ? null : collection);
  const { showWarning, warningMessage } = generic ? { showWarning: false, warningMessage: '' } : sensitive.isSensitive(ntlmAuth?.password);

  const handleSave = () => {
    if (generic) return onSave?.();
    return dispatch(saveCollectionSettings(collection.uid));
  };

  const update = (next) => {
    if (generic) return onAuthChange('ntlm', next);
    return dispatch(updateCollectionAuth({ mode: 'ntlm', collectionUid: collection.uid, content: next }));
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      <label className="block mb-1">Username</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={ntlmAuth.username || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: val || '', password: ntlmAuth.password || '', domain: ntlmAuth.domain || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Password</label>
      <div className="single-line-editor-wrapper mb-3 flex items-center">
        <SingleLineEditor
          value={ntlmAuth.password || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: ntlmAuth.username || '', password: val || '', domain: ntlmAuth.domain || '' })}
          collection={generic ? undefined : collection}
          isSecret={true}
          isCompact
        />
        {showWarning && <SensitiveFieldWarning fieldName="ntlm-password" warningMessage={warningMessage} />}
      </div>

      <label className="block mb-1">Domain</label>
      <div className="single-line-editor-wrapper">
        <SingleLineEditor
          value={ntlmAuth.domain || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: ntlmAuth.username || '', password: ntlmAuth.password || '', domain: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>
    </StyledWrapper>
  );
};

export default NTLMAuth;
