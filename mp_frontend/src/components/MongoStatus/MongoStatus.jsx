import { useState, useEffect } from 'react';
import './MongoStatus.css';

export default function MongoStatus() {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    configured: false,
    message: '',
    error: '',
    cluster: '',
    database: ''
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/db-status');
      if (!res.ok) {
        throw new Error(`Server responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatus({
        loading: false,
        connected: data.connected,
        configured: data.configured !== false,
        message: data.message || '',
        error: data.error || '',
        cluster: data.cluster || '',
        database: data.database || ''
      });
    } catch (err) {
      setStatus({
        loading: false,
        connected: false,
        configured: false,
        message: '',
        error: `Could not reach backend server: ${err.message}. Is "npm run dev" running in mp_backend?`,
        cluster: '',
        database: ''
      });
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className={`mongo-status-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header bar */}
      <div className="status-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="status-title-group">
          <span
            className={`status-dot ${
              status.loading
                ? 'pulsing-yellow'
                : status.connected
                ? 'active-green'
                : 'error-red'
            }`}
          />
          <span className="status-title">
            MongoDB Atlas Status
          </span>
          <span className="status-pill">
            {status.loading
              ? 'Checking...'
              : status.connected
              ? 'Connected'
              : 'Attention Needed'}
          </span>
        </div>
        <button
          type="button"
          className="toggle-button"
          aria-label="Toggle card"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="status-body">
          {status.loading ? (
            <div className="status-message loading-text">
              <span className="spinner" /> Testing connection to Atlas cluster...
            </div>
          ) : status.connected ? (
            <div className="status-success">
              <div className="success-icon">🍃</div>
              <div className="details-group">
                <p className="success-title">Successfully Connected!</p>
                <div className="meta-row">
                  <span className="meta-label">Cluster:</span>
                  <code className="meta-val">{status.cluster}</code>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Database:</span>
                  <code className="meta-val">{status.database}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="status-alert">
              <p className="alert-heading">⚠️ Connection Incomplete</p>
              <p className="alert-reason">{status.error}</p>

              {status.error.includes('<db_password>') && (
                <div className="instruction-box">
                  <strong>Next Step:</strong>
                  <ol>
                    <li>Open <code>mp_backend/.env</code> in your editor.</li>
                    <li>Replace <code>&lt;db_password&gt;</code> with your MongoDB database user password.</li>
                    <li>Save the file and click <strong>Retest Connection</strong> below.</li>
                  </ol>
                </div>
              )}

              {status.error.toLowerCase().includes('auth') && (
                <div className="instruction-box">
                  <strong>How to Fix Authentication:</strong>
                  <ol>
                    <li>Log in to <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>MongoDB Atlas</a>.</li>
                    <li>Go to <strong>Security &gt; Database Access</strong> in the left sidebar.</li>
                    <li>Verify the user <code>darshanaparanawithana2025_db_user</code> exists.</li>
                    <li>Click <strong>Edit &gt; Edit Password</strong> and set/copy a clean password.</li>
                    <li>Paste it into <code>mp_backend/.env</code> and click Retest.</li>
                  </ol>
                </div>
              )}

              {(status.error.includes('whitelist') || status.error.includes('ETIMEDOUT')) && (
                <div className="instruction-box">
                  <strong>Network Hint:</strong>
                  <p>In MongoDB Atlas &gt; <em>Network Access</em>, make sure you clicked <strong>Add IP Address &gt; Allow Access From Anywhere (0.0.0.0/0)</strong>.</p>
                </div>
              )}
            </div>
          )}

          <div className="action-footer">
            <button
              type="button"
              className="retest-btn"
              onClick={checkConnection}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retesting...' : '↻ Retest Connection'}
            </button>
            <span className="info-tag">Motion Pub Database Bridge</span>
          </div>
        </div>
      )}
    </div>
  );
}
