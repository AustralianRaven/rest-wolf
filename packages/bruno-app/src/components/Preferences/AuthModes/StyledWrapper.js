import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  min-height: 0;

  .auth-modes-list-pane {
    width: 220px;
    min-width: 180px;
    padding-right: 8px;
    border-right: 1px solid ${(props) => props.theme.border.border1};
  }

  .auth-mode-details-pane {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }

  .empty-pane {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: 13px;
  }
`;

export default StyledWrapper;
