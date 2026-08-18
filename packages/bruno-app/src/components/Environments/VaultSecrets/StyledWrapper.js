import styled from 'styled-components';

const StyledWrapper = styled.div`
  border: 1px solid ${(props) => props.theme.border.border1};
  border-radius: ${(props) => props.theme.border.radius.base};
  padding: 10px 12px;
  margin-bottom: 10px;
  flex-shrink: 0;

  .vault-header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${(props) => props.theme.bg};
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .vault-title {
    font-weight: 600;
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .tier-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }

  .tier-rank {
    width: 1.2rem;
    text-align: center;
    font-family: monospace;
    color: ${(props) => props.theme.colors.text.muted};
  }

  input.tier-input {
    flex: 1;
    padding: 5px 8px;
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
    margin-top: 6px;
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .source-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }

  select.source-select {
    padding: 5px 8px;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    background-color: transparent;
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  /* A resolved tier can carry hundreds of keys; capping the table keeps the variables
     table below it reachable without a long scroll. */
  .resolved-scroll {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 8px;
  }

  table.resolved {
    width: 100%;
    border-collapse: collapse;
    font-size: ${(props) => props.theme.font.size.sm};

    th,
    td {
      text-align: left;
      padding: 4px 8px;
      border-bottom: 1px solid ${(props) => props.theme.border.border1};
      vertical-align: top;
      word-break: break-all;
    }

    th {
      color: ${(props) => props.theme.colors.text.muted};
      font-weight: 500;
    }

    td.from {
      color: ${(props) => props.theme.colors.text.muted};
      white-space: nowrap;
    }

    tr.shadowed td {
      opacity: 0.45;
      text-decoration: line-through;
    }
  }

  .source-error {
    margin-top: 8px;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.danger};
    word-break: break-word;
  }
`;

export default StyledWrapper;
