import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button
            className={`confirm-button confirm-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


