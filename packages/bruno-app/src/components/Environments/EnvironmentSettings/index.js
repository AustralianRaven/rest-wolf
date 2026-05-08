import React, { useState } from 'react';
import CreateEnvironment from 'components/Environments/EnvironmentSettings/CreateEnvironment';
import EnvironmentList from './EnvironmentList';
import StyledWrapper from './StyledWrapper';
import { IconFileAlert } from '@tabler/icons';
import ImportEnvironmentModal from 'components/Environments/Common/ImportEnvironmentModal';
import ExportEnvironmentModal from 'components/Environments/Common/ExportEnvironmentModal';
import Button from 'ui/Button';
import AuthModes from './AuthModes';

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
  const [isModified, setIsModified] = useState(false);
  const environments = collection?.environments || [];

  const [selectedEnvironment, setSelectedEnvironment] = useState(() => {
    if (!environments.length) return null;
    return environments.find((env) => env.uid === collection?.activeEnvironmentUid) || environments[0];
  });
  const [tab, setTab] = useState('default');
  const [topTab, setTopTab] = useState('environments');
  const [showExportModal, setShowExportModal] = useState(false);

  const renderTabBar = () => (
    <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
      <button
        className={`px-3 py-2 text-sm ${topTab === 'environments' ? 'font-medium border-b-2' : 'text-muted'}`}
        style={topTab === 'environments' ? { borderColor: 'var(--color-primary, currentColor)' } : {}}
        onClick={() => setTopTab('environments')}
      >
        Environments
      </button>
      <button
        className={`px-3 py-2 text-sm ${topTab === 'auth-modes' ? 'font-medium border-b-2' : 'text-muted'}`}
        style={topTab === 'auth-modes' ? { borderColor: 'var(--color-primary, currentColor)' } : {}}
        onClick={() => setTopTab('auth-modes')}
      >
        Auth Modes
      </button>
    </div>
  );

  if (topTab === 'auth-modes') {
    return (
      <StyledWrapper>
        {renderTabBar()}
        <AuthModes />
      </StyledWrapper>
    );
  }

  if (!environments || !environments.length) {
    return (
      <StyledWrapper>
        {renderTabBar()}
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
      {renderTabBar()}
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
