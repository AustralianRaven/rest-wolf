import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;

  .git-sidebar {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${(props) => props.theme.border.border1};
    overflow: hidden;
  }

  .repo-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    font-weight: 600;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 14px 6px;
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 600;
    color: ${(props) => props.theme.colors.text.yellow};
    cursor: pointer;
    user-select: none;
  }

  .commit-area {
    padding: 0 14px 12px;
  }

  textarea.commit-message {
    width: 100%;
    resize: vertical;
    min-height: 34px;
    padding: 7px 10px;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    background-color: transparent;
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
    outline: none;

    &:focus {
      border-color: ${(props) => props.theme.button2.color.primary.bg};
    }
  }

  .changes-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 6px;
  }

  .changes-group-label {
    padding: 8px 8px 4px;
    font-size: ${(props) => props.theme.font.size.xs};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: ${(props) => props.theme.border.radius.base};
    cursor: pointer;
    font-size: ${(props) => props.theme.font.size.sm};

    &:hover {
      background-color: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.selected {
      background-color: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    .file-path {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      direction: rtl;
      text-align: left;
    }

    .file-status {
      flex-shrink: 0;
      width: 1rem;
      text-align: center;
      font-family: monospace;
    }

    .row-actions {
      display: none;
      gap: 2px;
    }

    &:hover .row-actions {
      display: flex;
    }
  }

  .empty-note {
    padding: 18px 14px;
    text-align: center;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .branch-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-top: 1px solid ${(props) => props.theme.border.border1};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 24px;
    overflow-y: auto;
  }

  .main-hint {
    max-width: 22rem;
    text-align: center;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .action-row {
    display: flex;
    gap: 10px;
  }

  .meta-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .status-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
  }

  .error-banner {
    margin: 0 14px 10px;
    padding: 8px 10px;
    border-radius: ${(props) => props.theme.border.radius.base};
    font-size: ${(props) => props.theme.font.size.sm};
    background-color: ${(props) => props.theme.status.danger.background};
    border: 1px solid ${(props) => props.theme.status.danger.border};
    word-break: break-word;
  }

  .diff-pane {
    flex: 1;
    width: 100%;
    overflow: auto;
    padding: 12px 18px;
    font-family: monospace;
    font-size: ${(props) => props.theme.font.size.sm};
    white-space: pre;

    .diff-add {
      color: ${(props) => props.theme.colors.text.green};
    }

    .diff-del {
      color: ${(props) => props.theme.colors.text.red};
    }

    .diff-meta {
      color: ${(props) => props.theme.colors.text.muted};
    }
  }
`;

export default StyledWrapper;
