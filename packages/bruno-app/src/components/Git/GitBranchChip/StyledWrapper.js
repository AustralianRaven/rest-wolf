import styled from 'styled-components';

const StyledWrapper = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  margin-right: 4px;
  border: 1px solid ${(props) => props.theme.border.border1};
  border-radius: ${(props) => props.theme.border.radius.base};
  background-color: transparent;
  color: ${(props) => props.theme.text};
  font-size: ${(props) => props.theme.font.size.sm};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.button2.color.primary.bg};
  }

  .branch-name {
    max-width: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drift {
    color: ${(props) => props.theme.colors.text.muted};
  }
`;

export default StyledWrapper;
