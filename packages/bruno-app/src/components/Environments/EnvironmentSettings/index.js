import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTabState } from 'providers/ReduxStore/slices/tabs';
import CreateEnvironment from 'components/Environments/EnvironmentSettings/CreateEnvironment';
import EnvironmentList from './EnvironmentList';
import StyledWrapper from './StyledWrapper';
import { IconFileAlert } from '@tabler/icons';
import ImportEnvironmentModal from 'components/Environments/Common/ImportEnvironmentModal';
import ExportEnvironmentModal from 'components/Environments/Common/ExportEnvironmentModal';
import Button from 'ui/Button';

const DefaultTab = ({ setTab }) => (
  <div className="empty-state">
    <IconFileAlert size={48} strokeWidth={1.5} />
    <div className="title">No Environments</div>
    <div className="actions">
      <Button size="sm" color="secondary" onClick={() => setTab('create')}>
        Create Environment
      </Button>
      <Button size="sm" color="secondary" onClick={() => setTab('import')}>
        Import Environment
      </Button>
    </div>
  </div>
);

const EnvironmentSettings = ({ collection }) => {
  const dispatch = useDispatch();
  const [isModified, setIsModified] = useState(false);
  const environments = collection?.environments || [];

  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const persistedEnvUid = useSelector((state) => state.tabs.tabs.find((t) => t.uid === activeTabUid)?.tabState?.envUid);

  // Remember which environment the user last viewed in this tab (via tabState) so navigating away and back preserves it.
  const selectedEnvironment = useMemo(() => {
    if (!environments.length) return null;
    return (
      environments.find((env) => env.uid === persistedEnvUid)
      || environments.find((env) => env.uid === collection?.activeEnvironmentUid)
      || environments[0]
    );
  }, [environments, persistedEnvUid, collection?.activeEnvironmentUid]);

  const setSelectedEnvironment = (env) => {
    if (!activeTabUid || !env?.uid) return;
    dispatch(updateTabState({ uid: activeTabUid, tabState: { envUid: env.uid } }));
  };

  const [tab, setTab] = useState('default');
  const [showExportModal, setShowExportModal] = useState(false);

  if (!environments || !environments.length) {
    return (
      <StyledWrapper>
        {tab === 'create' ? (
          <CreateEnvironment collection={collection} onClose={() => setTab('default')} />
        ) : tab === 'import' ? (
          <ImportEnvironmentModal type="collection" collection={collection} onClose={() => setTab('default')} />
        ) : (
          <DefaultTab setTab={setTab} />
        )}
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <EnvironmentList
        environments={environments}
        activeEnvironmentUid={collection?.activeEnvironmentUid}
        selectedEnvironment={selectedEnvironment}
        setSelectedEnvironment={setSelectedEnvironment}
        isModified={isModified}
        setIsModified={setIsModified}
        collection={collection}
        setShowExportModal={setShowExportModal}
      />
      {showExportModal && (
        <ExportEnvironmentModal
          onClose={() => setShowExportModal(false)}
          environments={environments}
          environmentType="collection"
        />
      )}
    </StyledWrapper>
  );
};

export default EnvironmentSettings;
