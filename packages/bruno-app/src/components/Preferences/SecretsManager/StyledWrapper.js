import styled from 'styled-components';

const StyledWrapper = styled.div`
  .intro {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 12px;
  }

  .manager-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    margin-bottom: 8px;
  }

  .manager-name {
    font-weight: 600;
  }

  .manager-url {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank {
    width: 1.4rem;
    flex-shrink: 0;
    text-align: center;
    font-family: monospace;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .row-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .form {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    padding: 12px;
    margin-bottom: 10px;
  }

  label {
    display: block;
    font-size: ${(props) => props.theme.font.size.sm};
    margin-bottom: 3px;
  }

  input,
  select {
    width: 100%;
    padding: 6px 9px;
    margin-bottom: 10px;
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

  .hint {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    margin: -6px 0 10px;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .test-result {
    font-size: ${(props) => props.theme.font.size.sm};

    &.ok {
      color: ${(props) => props.theme.colors.text.green};
    }

    &.bad {
      color: ${(props) => props.theme.colors.text.danger};
    }
  }
`;

export default StyledWrapper;
