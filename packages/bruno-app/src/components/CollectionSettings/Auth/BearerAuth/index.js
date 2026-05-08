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

const BearerAuth = ({ collection, authData, onAuthChange, onSave }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const generic = !!onAuthChange;
  const bearerToken = generic
    ? (authData?.bearer?.token || '')
    : (collection.draft?.root ? get(collection, 'draft.root.request.auth.bearer.token', '') : get(collection, 'root.request.auth.bearer.token', ''));

  const sensitive = useDetectSensitiveField(generic ? null : collection);
  const { showWarning, warningMessage } = generic ? { showWarning: false, warningMessage: '' } : sensitive.isSensitive(bearerToken);

  const handleSave = () => {
    if (generic) return onSave?.();
    return dispatch(saveCollectionSettings(collection.uid));
  };

  const update = (token) => {
    if (generic) return onAuthChange('bearer', { token });
    return dispatch(updateCollectionAuth({ mode: 'bearer', collectionUid: collection.uid, content: { token } }));
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      <label className="block mb-1">Token</label>
      <div className="single-line-editor-wrapper flex items-center">
        <SingleLineEditor
          value={bearerToken}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update(val)}
          collection={generic ? undefined : collection}
          isSecret={true}
          isCompact
        />
        {showWarning && <SensitiveFieldWarning fieldName="bearer-token" warningMessage={warningMessage} />}
      </div>
    </StyledWrapper>
  );
};

export default BearerAuth;
