import styled from 'styled-components';
import { rgba } from 'polished';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px 8px 8px;

    .title {
      font-size: ${(props) => props.theme.font.size.base};
      font-weight: 500;
      color: ${(props) => props.theme.text};
      margin: 0;
    }

    .btn-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: ${(props) => props.theme.colors.text.muted};
      cursor: pointer;

      &:hover {
        background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
        color: ${(props) => props.theme.text};
      }
    }
  }

  .search-container {
    position: relative;
    padding: 0 4px 8px 4px;

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-100%);
      color: ${(props) => props.theme.colors.text.muted};
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 8px 6px 28px;
      font-size: 12px;
      background: transparent;
      border: 1px solid ${(props) => props.theme.border.border1};
      border-radius: 5px;
      color: ${(props) => props.theme.text};

      &::placeholder {
        color: ${(props) => props.theme.colors.text.muted};
      }

      &:focus {
        outline: none;
      }
    }
  }

  .auth-modes-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .empty-list-hint {
    padding: 8px 12px;
    font-size: 11px;
    color: ${(props) => props.theme.colors.text.muted};
    font-style: italic;
  }

  .auth-mode-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    margin-bottom: 1px;
    font-size: 13px;
    color: ${(props) => props.theme.text};
    cursor: pointer;
    border-radius: 5px;

    .auth-mode-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .auth-mode-actions {
      display: flex;
      align-items: center;
      opacity: 0;

      .row-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: ${(props) => props.theme.colors.text.muted};
        border-radius: 3px;

        &:hover {
          background: ${(props) => props.theme.workspace.button.bg};
          color: ${(props) => props.theme.text};
        }
      }
    }

    &:hover {
      background: ${(props) => props.theme.workspace.button.bg};

      .auth-mode-actions {
        opacity: 1;
      }
    }

    &.active {
      background: ${(props) => props.theme.background.surface0};
    }

    &.renaming,
    &.creating {
      cursor: default;
      padding: 4px 4px 4px 8px;
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    .rename-container {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .auth-mode-name-input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      color: ${(props) => props.theme.text};
      font-size: 13px;
      padding: 2px 4px;

      &::placeholder {
        color: ${(props) => props.theme.colors.text.muted};
      }
    }

    .inline-actions {
      display: flex;
      gap: 2px;
      margin-left: 4px;
      flex-shrink: 0;
    }

    .inline-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &.save {
        color: ${(props) => props.theme.colors.text.green};

        &:hover {
          background: ${(props) => rgba(props.theme.colors.text.green, 0.1)};
        }
      }

      &.cancel {
        color: ${(props) => props.theme.colors.text.danger};

        &:hover {
          background: ${(props) => rgba(props.theme.colors.text.danger, 0.1)};
        }
      }
    }
  }

  .name-error {
    padding: 4px 12px;
    margin-top: 4px;
    font-size: 11px;
    color: ${(props) => props.theme.colors.text.danger};
    background: ${(props) => `${props.theme.colors.text.danger}15`};
    border-radius: 4px;
  }
`;

export default StyledWrapper;
