import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './confirmMessage.css';

export default function ConfirmMessage({
  isOpen = false,
  title = 'Are you sure?',
  message = 'Please confirm that you want to continue with this action.',
  highlightItem = null, // optional { name, subtitle, image }
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const initials = (highlightItem?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const renderVariantIcon = () => {
    if (variant === 'warning') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    }

    if (variant === 'primary') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11.2 14.2 15.5 9.8" />
        </svg>
      );
    }

    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    );
  };

  return createPortal(
    <div
      className="mp-confirm-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="mp-confirm-title"
      aria-describedby="mp-confirm-message"
      onClick={() => {
        if (!isLoading) onCancel?.();
      }}
    >
      <div
        className={`mp-confirm-dialog variant-${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Accent Bar */}
        <div className="mp-confirm-accent-line" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          className="mp-confirm-close-x"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close confirmation dialog"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Animated Icon Medallion */}
        <div className="mp-confirm-icon-stage">
          <div className="mp-confirm-icon-ring" />
          <div className="mp-confirm-icon-core">
            {renderVariantIcon()}
          </div>
        </div>

        {/* Title & Message */}
        <h3 id="mp-confirm-title" className="mp-confirm-title">
          {title}
        </h3>
        <p id="mp-confirm-message" className="mp-confirm-message">
          {message}
        </p>

        {/* Optional Target Item Preview Card */}
        {highlightItem && (
          <div className="mp-confirm-item-chip">
            <div className="mp-confirm-item-avatar">
              {highlightItem.image ? (
                <img src={highlightItem.image} alt={highlightItem.name || ''} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="mp-confirm-item-info">
              <strong className="mp-confirm-item-name">{highlightItem.name}</strong>
              {highlightItem.subtitle && (
                <span className="mp-confirm-item-sub">{highlightItem.subtitle}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mp-confirm-actions">
          <button
            type="button"
            className="mp-confirm-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="mp-confirm-btn-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mp-confirm-spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
