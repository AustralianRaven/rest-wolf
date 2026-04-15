import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  
  .table-container {
    overflow-y: auto;
    border-radius: 8px;
    border: solid 1px ${(props) => props.theme.border.border0};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    td {
      vertical-align: middle;
      padding: 2px 10px;

      &:nth-child(1) {
        width: 25px;
        border-right: none;
      }
      &:nth-child(4) {
        width: 80px;
      }
      &:nth-child(5) {
        width: 60px;
      }

      &:nth-child(2) {
        width: 30%;
      }
    }

    thead {
      color: ${(props) => props.theme.table.thead.color} !important;
      background: ${(props) => props.theme.sidebar.bg};
      font-size: ${(props) => props.theme.font.size.base};
      user-select: none;
      
      td {
        padding: 5px 10px !important;
        border-bottom: solid 1px ${(props) => props.theme.border.border0};
        border-right: solid 1px ${(props) => props.theme.border.border0};
        
        &:last-child {
          border-right: none;
        }
      }
    }
    
    tbody {
      tr {
        transition: background 0.1s ease;
        
        &:last-child td {
          border-bottom: none;
        }
        
        td {
          border-bottom: solid 1px ${(props) => props.theme.border.border0};
          border-right: solid 1px ${(props) => props.theme.border.border0};
          
          &:last-child {
            border-right: none;
          }
        }
      }
    }
  }

  .tooltip-mod {
    max-width: 200px !important;
  }

  input[type='text'] {
    width: 100%;
    border: 1px solid transparent;
    outline: none !important;
    background-color: transparent;
    color: ${(props) => props.theme.text};
    padding: 0;
    border-radius: 4px;
    transition: all 0.15s ease;

    &:focus {
      outline: none !important;
    }
  }

  input[type='checkbox'] {
    cursor: pointer;
    width: 14px;
    height: 14px;
    accent-color: ${(props) => props.theme.colors.accent};
    vertical-align: middle;
    margin: 0;
  }
  
  .button-container {
    flex-shrink: 0;
    display: flex;
    gap: 8px;
  }

  .vault-secret-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .vault-secret-label {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.text};
    white-space: nowrap;
    user-select: none;
  }

  input[type='text'].vault-secret-input {
    width: 180px;
    padding: 0.375rem 0.75rem;
    height: auto;
    border: 1px solid ${(props) => props.theme.button2.color.primary.bg};
    border-radius: ${(props) => props.theme.border.radius.base};
    background-color: transparent;
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
    outline: none;
    transition: all 0.15s ease;

    &:focus {
      border-color: ${(props) => props.theme.button2.color.primary.bg};
      outline: none;
    }
  }
`;

export default Wrapper;
