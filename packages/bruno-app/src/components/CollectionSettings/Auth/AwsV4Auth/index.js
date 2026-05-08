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

const AwsV4Auth = ({ collection, authData, onAuthChange, onSave }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const generic = !!onAuthChange;
  const awsv4Auth = generic
    ? (authData?.awsv4 || {})
    : (collection.draft?.root ? get(collection, 'draft.root.request.auth.awsv4', {}) : get(collection, 'root.request.auth.awsv4', {}));

  const sensitive = useDetectSensitiveField(generic ? null : collection);
  const { showWarning, warningMessage } = generic ? { showWarning: false, warningMessage: '' } : sensitive.isSensitive(awsv4Auth?.secretAccessKey);

  const handleSave = () => {
    if (generic) return onSave?.();
    return dispatch(saveCollectionSettings(collection.uid));
  };

  const buildContent = (override) => ({
    accessKeyId: awsv4Auth.accessKeyId || '',
    secretAccessKey: awsv4Auth.secretAccessKey || '',
    sessionToken: awsv4Auth.sessionToken || '',
    service: awsv4Auth.service || '',
    region: awsv4Auth.region || '',
    profileName: awsv4Auth.profileName || '',
    ...override
  });

  const update = (override) => {
    const next = buildContent(override);
    if (generic) return onAuthChange('awsv4', next);
    return dispatch(updateCollectionAuth({ mode: 'awsv4', collectionUid: collection.uid, content: next }));
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      <label className="block mb-1">Access Key ID</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={awsv4Auth.accessKeyId || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ accessKeyId: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Secret Access Key</label>
      <div className="single-line-editor-wrapper mb-3 flex items-center">
        <SingleLineEditor
          value={awsv4Auth.secretAccessKey || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ secretAccessKey: val || '' })}
          collection={generic ? undefined : collection}
          isSecret={true}
          isCompact
        />
        {showWarning && <SensitiveFieldWarning fieldName="awsv4-secret-access-key" warningMessage={warningMessage} />}
      </div>

      <label className="block mb-1">Session Token</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={awsv4Auth.sessionToken || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ sessionToken: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Service</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={awsv4Auth.service || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ service: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Region</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={awsv4Auth.region || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ region: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>

      <label className="block mb-1">Profile Name</label>
      <div className="single-line-editor-wrapper">
        <SingleLineEditor
          value={awsv4Auth.profileName || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => update({ profileName: val || '' })}
          collection={generic ? undefined : collection}
          isCompact
        />
      </div>
    </StyledWrapper>
  );
};

export default AwsV4Auth;
