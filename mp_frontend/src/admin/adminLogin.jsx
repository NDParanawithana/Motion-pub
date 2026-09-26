import { useState, useEffect, useRef } from 'react';
import './adminLogin.css';

/**
 * AdminLogin Modal Component
 * Triggers when pressing Ctrl + Q (or Cmd + Q on macOS) or via the shortcut badge.
 * Provides a UI for website administrator authentication.
 */
export default function AdminLogin({ isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    remember: false
  });

  const usernameInputRef = useRef(null);

  // Allow controlled or uncontrolled visibility
  const isControlled = controlledIsOpen !== undefined;
  const isModalOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (isControlled && controlledOnClose) {
      // If controlled, parent handles opening
    } else {
      setInternalIsOpen(true);
    }
  };

  // Global keyboard shortcut listener for Ctrl + Q and Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle modal on Ctrl + Q or Cmd + Q
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        if (isModalOpen) {
          handleClose();
        } else {
          handleOpen();
        }
      }

      // Close on Esc if open
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isControlled]);

  // Focus the username input automatically when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        if (usernameInputRef.current) {
          usernameInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Admin login UI submitted:', credentials);
    // UI only for now as requested
  };

  return (
    <>
      {/* Subtle indicator pill when modal is closed */}
      {!isModalOpen && (
        <button
          type="button"
          className="admin-hint-pill"
          onClick={handleOpen}
          title="Press Ctrl + Q to open admin login"
          aria-label="Admin Access shortcut"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Admin</span>
          <kbd className="admin-kbd">Ctrl+Q</kbd>
        </button>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div
            className="admin-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="admin-modal-accent-bar" />

            {/* Close button */}
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={handleClose}
              aria-label="Close admin login modal"
              title="Close (Esc)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="admin-modal-content">
              {/* Header */}
              <div className="admin-modal-header">
                <div className="admin-badge-container">
                  <span className="admin-badge-dot" />
                  <span className="admin-badge-text">Restricted Portal</span>
                </div>
                <h2 id="admin-modal-title" className="admin-modal-title">
                  Website Admin
                </h2>
                <p className="admin-modal-subtitle">
                  Authenticate credentials to manage Motion Pub content and settings.
                </p>
              </div>

              {/* Form */}
              <form className="admin-form" onSubmit={handleSubmit}>
                {/* Username / Email Field */}
                <div className="admin-form-group">
                  <label htmlFor="admin-username" className="admin-label">
                    Username or Email
                  </label>
                  <div className="admin-input-wrapper">
                    <span className="admin-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <input
                      ref={usernameInputRef}
                      id="admin-username"
                      name="username"
                      type="text"
                      className="admin-input"
                      placeholder="admin@motionpub.com"
                      value={credentials.username}
                      onChange={handleChange}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="admin-form-group">
                  <label htmlFor="admin-password" className="admin-label">
                    Password
                  </label>
                  <div className="admin-input-wrapper">
                    <span className="admin-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="admin-input"
                      placeholder="••••••••••••"
                      value={credentials.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Recover Options */}
                <div className="admin-form-options">
                  <label className="admin-remember-label">
                    <input
                      type="checkbox"
                      name="remember"
                      className="admin-checkbox"
                      checked={credentials.remember}
                      onChange={handleChange}
                    />
                    <span>Remember session</span>
                  </label>
                  <a
                    href="#forgot"
                    className="admin-link-hint"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact systems administration to reset administrator credentials.');
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button type="submit" className="admin-submit-btn">
                  <span>Sign In as Admin</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </form>

              {/* Modal Footer / Shortcuts */}
              <div className="admin-modal-footer">
                <div className="admin-shortcut-hint">
                  <span>Press</span>
                  <kbd className="admin-kbd">Ctrl+Q</kbd>
                  <span>or</span>
                  <kbd className="admin-kbd">Esc</kbd>
                  <span>to close</span>
                </div>
                <div className="admin-security-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>256-bit TLS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
