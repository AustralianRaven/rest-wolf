import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setEnvVarSearchQuery, setEnvVarSearchExpanded } from 'providers/ReduxStore/slices/app';
import useDebounce from 'hooks/useDebounce';
import StyledWrapper from './StyledWrapper';
import EnvironmentsSidebar from './EnvironmentsSidebar';
import AuthModesSidebar from './AuthModesSidebar';
import EnvironmentDetails from './EnvironmentList/EnvironmentDetails';
import WorkspaceAuthModeDetails from './AuthModeDetails';
import ImportEnvironmentModal from 'components/Environments/Common/ImportEnvironmentModal';
import ExportEnvironmentModal from 'components/Environments/Common/ExportEnvironmentModal';

// Persist resize prefs across sessions in localStorage
const SIDEBAR_WIDTH_KEY = 'rw.workspaceEnv.sidebarWidth';
const SPLIT_RATIO_KEY = 'rw.workspaceEnv.splitRatio';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const readNum = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch (e) { return fallback; }
};

const WorkspaceEnvironments = ({ workspace }) => {
  const dispatch = useDispatch();
  const [isModified, setIsModified] = useState(false);
  const [selection, setSelection] = useState(null); // { kind: 'env'|'auth-mode', uid }
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const envSearchQuery = useSelector((state) => state.app.envVarSearch?.global?.query ?? '');
  const isEnvSearchExpanded = useSelector((state) => state.app.envVarSearch?.global?.expanded ?? false);
  const setEnvSearchQuery = (q) => dispatch(setEnvVarSearchQuery({ context: 'global', query: q }));
  const setIsEnvSearchExpanded = (v) => dispatch(setEnvVarSearchExpanded({ context: 'global', expanded: v }));
  const debouncedEnvSearchQuery = useDebounce(envSearchQuery, 300);
  const envSearchInputRef = useRef(null);

  // Resizable sidebar width (px) and inner top/bottom split (ratio of sidebar height)
  const [sidebarWidth, setSidebarWidth] = useState(() => clamp(readNum(SIDEBAR_WIDTH_KEY, 240), 180, 600));
  const [splitRatio, setSplitRatio] = useState(() => clamp(readNum(SPLIT_RATIO_KEY, 0.5), 0.15, 0.85));

  const containerRef = useRef(null);
  const sidebarRef = useRef(null);

  // --- Drag handlers ---
  const startWidthDrag = useCallback((e) => {
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const onMove = (ev) => {
      if (!containerRect) return;
      const next = clamp(ev.clientX - containerRect.left, 180, Math.max(220, containerRect.width - 320));
      setSidebarWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarRef.current?.getBoundingClientRect().width ?? '')); } catch (e) {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const startSplitDrag = useCallback((e) => {
    e.preventDefault();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    const onMove = (ev) => {
      if (!sidebarRect) return;
      const ratio = (ev.clientY - sidebarRect.top) / sidebarRect.height;
      const next = clamp(ratio, 0.15, 0.85);
      setSplitRatio(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem(SPLIT_RATIO_KEY, String(splitRatio)); } catch (e) {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [splitRatio]);

  // Persist after the drag (via the latest ratio) — separate effect catches non-drag updates too.
  useEffect(() => {
    try { localStorage.setItem(SPLIT_RATIO_KEY, String(splitRatio)); } catch (e) {}
  }, [splitRatio]);
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); } catch (e) {}
  }, [sidebarWidth]);

  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments) || [];
  const activeGlobalEnvironmentUid = useSelector((state) => state.globalEnvironments.activeGlobalEnvironmentUid);
  const authModes = useSelector((state) => state['auth-modes']?.authModes) || [];

  // Default selection: first env if any, else first auth mode if any.
  useEffect(() => {
    if (selection) return;
    if (globalEnvironments.length) {
      const active = globalEnvironments.find((e) => e.uid === activeGlobalEnvironmentUid) || globalEnvironments[0];
      setSelection({ kind: 'env', uid: active.uid });
    } else if (authModes.length) {
      setSelection({ kind: 'auth-mode', uid: authModes[0].uid });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalEnvironments.length, authModes.length]);

  const selectedEnvironment = useMemo(() => {
    if (selection?.kind !== 'env') return null;
    return globalEnvironments.find((e) => e.uid === selection.uid) || null;
  }, [selection, globalEnvironments]);

  const selectedAuthMode = useMemo(() => {
    if (selection?.kind !== 'auth-mode') return null;
    return authModes.find((m) => m.uid === selection.uid) || null;
  }, [selection, authModes]);

  return (
    <StyledWrapper>
      <div className="environments-container" ref={containerRef}>
        <div className="sidebar" ref={sidebarRef} style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
          <div className="sidebar-half top" style={{ flex: `${splitRatio} 1 0` }}>
            <EnvironmentsSidebar
              selection={selection}
              setSelection={setSelection}
              onImportClick={() => setShowImportModal(true)}
              onExportClick={globalEnvironments.length ? () => setShowExportModal(true) : null}
            />
          </div>
          <div
            className="sidebar-divider sidebar-divider--draggable"
            role="separator"
            aria-orientation="horizontal"
            onMouseDown={startSplitDrag}
            title="Drag to resize"
          />
          <div className="sidebar-half bottom" style={{ flex: `${1 - splitRatio} 1 0` }}>
            <AuthModesSidebar selection={selection} setSelection={setSelection} />
          </div>
        </div>

        <div
          className="sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          onMouseDown={startWidthDrag}
          title="Drag to resize"
        />

        <div className="right-pane">
          {selectedEnvironment ? (
            <EnvironmentDetails
              environment={selectedEnvironment}
              setIsModified={setIsModified}
              originalEnvironmentVariables={selectedEnvironment.variables || []}
              collection={null}
              searchQuery={envSearchQuery}
              setSearchQuery={setEnvSearchQuery}
              isSearchExpanded={isEnvSearchExpanded}
              setIsSearchExpanded={setIsEnvSearchExpanded}
              debouncedSearchQuery={debouncedEnvSearchQuery}
              searchInputRef={envSearchInputRef}
            />
          ) : selectedAuthMode ? (
            <WorkspaceAuthModeDetails authMode={selectedAuthMode} />
          ) : (
            <div className="empty-pane">
              <div>Select or create an environment or authentication mode to begin.</div>
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <ImportEnvironmentModal type="global" onClose={() => setShowImportModal(false)} />
      )}
      {showExportModal && (
        <ExportEnvironmentModal
          onClose={() => setShowExportModal(false)}
          environments={globalEnvironments}
          environmentType="global"
        />
      )}
    </StyledWrapper>
  );
};

export default WorkspaceEnvironments;
