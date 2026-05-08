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

const DigestAuth = ({ collection, authData, onAuthChange, onSave }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const generic = !!onAuthChange;
  const digestAuth = generic
    ? (authData?.digest || {})
    : (collection.draft?.root ? get(collection, 'draft.root.request.auth.digest', {}) : get(collection, 'root.request.auth.digest', {}));

  const sensitive = useDetectSensitiveField(generic ? null : collection);
  const { showWarning, warningMessage } = generic ? { showWarning: false, warningMessage: '' } : sensitive.isSensitive(digestAuth?.password);

  const handleSave = () => {
    if (generic) return onSave?.();
    return dispatch(saveCollectionSettings(collection.uid));
  };

  const update = (next) => {
    if (generic) return onAuthChange('digest', next);
    return dispatch(updateCollectionAuth({ mode: 'digest', collectionUid: collection.uid, content: next }));
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      <label className="block mb-1">Username</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={digestAuth.username || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: val || '', password: digestAuth.password || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Password</label>
      <div className="single-line-editor-wrapper flex items-center">
        <SingleLineEditor
          value={digestAuth.password || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: digestAuth.username || '', password: val || '' })}
          collection={generic ? undefined : collection}
          isSecret={true}
          isCompact
        />
        {showWarning && <SensitiveFieldWarning fieldName="digest-password" warningMessage={warningMessage} />}
      </div>
    </StyledWrapper>
  );
};

export default DigestAuth;
