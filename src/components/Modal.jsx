import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, type = 'info', showCloseButton = true, autoClose = true, autoCloseDelay = 3000 }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal ${type}`}>
        <div className="modal-header">
          <div className="modal-icon">{getIcon()}</div>
          {title && <h3 className="modal-title">{title}</h3>}
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        {showCloseButton && (
          <div className="modal-footer">
            <button className="modal-button" onClick={onClose}>
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
