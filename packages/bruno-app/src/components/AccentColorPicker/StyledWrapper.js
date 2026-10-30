import styled from 'styled-components';
import { rgba } from 'polished';

const StyledWrapper = styled.div`
  .color-picker-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  .color-picker-label {
    font-size: ${(props) => props.theme?.font?.size?.sm || '0.75rem'};
    color: ${(props) => props.theme?.colors?.text?.muted || props.theme?.text || '#666'};
    font-weight: 500;
  }

  .color-picker-wrapper {
    position: relative;
  }

  .color-picker-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid ${(props) => props.theme?.input?.border || '#ccc'};
    border-radius: ${(props) => props.theme?.border?.radius?.md || '6px'};
    background: ${(props) => props.theme?.input?.bg || '#fff'};
    color: ${(props) => props.theme?.text || '#333'};
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 120px;

    &:hover:not(.disabled) {
      border-color: ${(props) => props.theme?.input?.focusBorder || props.theme?.brand || '#007bff'};
    }

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme?.input?.focusBorder || props.theme?.brand || '#007bff'};
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .color-preview {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid ${(props) => rgba(props.theme?.text || '#333', 0.1)};
    flex-shrink: 0;
  }

  .color-picker-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: ${(props) => props.theme?.dropdown?.bg || props.theme?.bg || '#fff'};
    border: 1px solid ${(props) => props.theme?.dropdown?.border || '#ccc'};
    border-radius: ${(props) => props.theme?.border?.radius?.md || '6px'};
    box-shadow: 0 4px 16px ${(props) => rgba(props.theme?.text || '#333', 0.1)};
    padding: 12px;
    min-width: 240px;
    margin-top: 4px;
  }

  .color-section {
    &:not(:last-child) {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${(props) => props.theme?.dropdown?.separator || '#eee'};
    }
  }

  .section-title {
    font-size: ${(props) => props.theme?.font?.size?.xs || '0.6875rem'};
    color: ${(props) => props.theme?.colors?.text?.muted || props.theme?.text || '#666'};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .predefined-colors {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .color-option {
    width: 28px;
    height: 28px;
    border: 2px solid ${(props) => rgba(props.theme?.text || '#333', 0.1)};
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &:hover {
      border-color: ${(props) => rgba(props.theme?.text || '#333', 0.3)};
      transform: scale(1.05);
    }

    &.selected {
      border-color: ${(props) => props.theme?.text || '#333'};
      transform: scale(1.1);
    }
  }

  .custom-color-input {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .color-input {
    width: 40px;
    height: 32px;
    border: 1px solid ${(props) => props.theme?.input?.border || '#ccc'};
    border-radius: ${(props) => props.theme?.border?.radius?.sm || '4px'};
    padding: 0;
    cursor: pointer;
    background: none;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 3px;
    }
  }

  .color-text-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid ${(props) => props.theme?.input?.border || '#ccc'};
    border-radius: ${(props) => props.theme?.border?.radius?.sm || '4px'};
    background: ${(props) => props.theme?.input?.bg || '#fff'};
    color: ${(props) => props.theme?.text || '#333'};
    font-size: ${(props) => props.theme?.font?.size?.sm || '0.75rem'};
    font-family: ${(props) => props.theme?.font?.family?.code || 'monospace'};

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme?.input?.focusBorder || props.theme?.brand || '#007bff'};
    }

    &::placeholder {
      color: ${(props) => props.theme?.input?.placeholder?.color || '#999'};
      opacity: ${(props) => props.theme?.input?.placeholder?.opacity || 0.6};
    }
  }

  .reset-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid ${(props) => props.theme?.input?.border || '#ccc'};
    border-radius: ${(props) => props.theme?.border?.radius?.sm || '4px'};
    background: ${(props) => props.theme?.input?.bg || '#fff'};
    color: ${(props) => props.theme?.colors?.text?.muted || props.theme?.text || '#666'};
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: ${(props) => props.theme?.font?.size?.sm || '0.75rem'};
    width: 100%;
    justify-content: center;

    &:hover {
      border-color: ${(props) => props.theme?.input?.focusBorder || props.theme?.brand || '#007bff'};
      color: ${(props) => props.theme?.text || '#333'};
    }
  }
`;

export default StyledWrapper;
