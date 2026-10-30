import styled from 'styled-components';

const StyledWrapper = styled.div`
  .linked-saved-auth-note {
    color: ${(props) => props.theme.colors.text.muted};
    max-width: 640px;
  }

  .linked-saved-auth-fields {
    .single-line-editor.read-only,
    .multi-line-editor.read-only,
    input:disabled,
    select:disabled {
      opacity: 0.5;
    }

    .single-line-editor.read-only .CodeMirror-lines {
      cursor: not-allowed;
    }
  }
`;

export default StyledWrapper;
