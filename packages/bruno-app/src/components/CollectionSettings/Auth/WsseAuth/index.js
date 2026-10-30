import React from 'react';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import get from 'lodash/get';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import SingleLineEditor from 'components/SingleLineEditor';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';

const WsseAuth = ({ collection, authData, onAuthChange, onSave }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const generic = !!onAuthChange;
  const wsseAuth = generic
    ? (authData?.wsse || {})
    : (collection.draft?.root ? get(collection, 'draft.root.request.auth.wsse', {}) : get(collection, 'root.request.auth.wsse', {}));

  const handleSave = () => {
    if (generic) return onSave?.();
    return dispatch(saveCollectionSettings(collection.uid));
  };

  const update = (next) => {
    if (generic) return onAuthChange('wsse', next);
    return dispatch(updateCollectionAuth({ mode: 'wsse', collectionUid: collection.uid, content: next }));
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      <label className="block mb-1">Username</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={wsseAuth.username || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: val || '', password: wsseAuth.password || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Password</label>
      <div className="single-line-editor-wrapper flex items-center">
        <SingleLineEditor
          value={wsseAuth.password || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ username: wsseAuth.username || '', password: val || '' })}
          collection={generic ? undefined : collection}
          isSecret={true}
          isCompact
        />
        {!generic && (
          <SensitiveFieldWarning fieldName="wsse-password" secretName="password" value={wsseAuth?.password} collection={collection} onReplaceValue={(val) => update({ username: wsseAuth.username || '', password: val || '' })} />
        )}
      </div>
    </StyledWrapper>
  );
};

export default WsseAuth;
