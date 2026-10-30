import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { deleteAuthMode } from 'providers/ReduxStore/slices/auth-modes';

const DeleteAuthMode = ({ onClose, authMode }) => {
  const dispatch = useDispatch();
  const onConfirm = () => {
    dispatch(deleteAuthMode({ uid: authMode.uid }))
      .then(() => {
        toast.success('Authentication mode deleted successfully');
        onClose();
      })
      .catch(() => toast.error('An error occurred while deleting the authentication mode'));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="sm"
          title="Delete Authentication Mode"
          confirmText="Delete"
          handleConfirm={onConfirm}
          handleCancel={onClose}
        >
          Are you sure you want to delete <span className="font-semibold">{authMode.name}</span>? Anything that references it will fall back to <span className="font-semibold">No Auth</span>.
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteAuthMode;
