import { useState, useEffect } from 'react';
import './BackendTest.css';

export default function BackendTest() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'connected' | 'error'
  const [services, setServices] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [postResponse, setPostResponse] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchServices = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/services');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setServices(data);
      setStatus('connected');
    } catch (err) {
      console.error('Backend connection failed:', err);
      setErrorMsg(err.message || 'Failed to connect to backend');
      setStatus('error');
    }
  };

  const testPost = async () => {
    setIsPosting(true);
    setPostResponse(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Frontend Test User',
          email: 'test@motionpub.com',
          message: `Ping at ${new Date().toLocaleTimeString()}`
        })
      });
      const data = await res.json();
      setPostResponse(data);
    } catch (err) {
      console.error('POST test failed:', err);
      setPostResponse({ error: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className={`backend-test-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="test-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-status">
          <span className={`status-indicator ${status}`} />
          <strong>Backend Status:</strong>
          <span className={`status-text ${status}`}>
            {status === 'loading' && 'Checking connection...'}
            {status === 'connected' && 'Connected (port 5000)'}
            {status === 'error' && 'Disconnected / Error'}
          </span>
        </div>
        <button
          type="button"
          className="toggle-btn"
          aria-label="Toggle Widget"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="test-body">
          <div className="test-section">
            <div className="section-title-row">
              <h4>GET /api/services</h4>
              <button
                type="button"
                className="action-btn small"
                onClick={fetchServices}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Testing...' : '↻ Retest'}
              </button>
            </div>

            {status === 'error' && (
              <div className="error-box">
                <p>⚠️ <strong>Cannot reach backend:</strong></p>
                <code>{errorMsg}</code>
                <p className="hint">Make sure <code>npm run dev</code> is running in <code>mp_backend</code>.</p>
              </div>
            )}

            {status === 'connected' && (
              <ul className="data-list">
                {services.map((item) => (
                  <li key={item.id}>
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-title">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="test-section">
            <div className="section-title-row">
              <h4>POST /api/contact</h4>
              <button
                type="button"
                className="action-btn small"
                onClick={testPost}
                disabled={isPosting || status !== 'connected'}
              >
                {isPosting ? 'Sending...' : 'Test POST'}
              </button>
            </div>

            {postResponse && (
              <pre className="response-preview">
                {JSON.stringify(postResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
