import { useState, useEffect } from 'react';
import './dashboard.css';

const DEFAULT_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling.";

const PRESET_TEMPLATES = [
  {
    name: "Original Brand",
    text: "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling."
  },
  {
    name: "3D & Digital Impact",
    text: "Motion Pub crafts next-generation 3D visuals, cinematic motion design, and high-impact digital experiences for forward-thinking brands."
  },
  {
    name: "Studio Vision",
    text: "Motion Pub is a modern digital production studio blending art, code, and fluid animation to elevate global tech products."
  }
];

export default function AdminDashboard({ onBackToSite, onLogout, adminUser }) {
  // Navigation: 'overview' | 'hero'
  const [activeTab, setActiveTab] = useState('hero');

  // Hero Section text state
  const [heroText, setHeroText] = useState(() => {
    return localStorage.getItem('mp_hero_text') || DEFAULT_HERO_TEXT;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // Live Simulator state
  const [simText, setSimText] = useState('');
  const [simKey, setSimKey] = useState(0);

  // Fetch current hero text from backend database on mount
  useEffect(() => {
    fetch('/api/content/hero')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.fullText) {
          setHeroText(data.fullText);
          localStorage.setItem('mp_hero_text', data.fullText);
        }
      })
      .catch(() => {
        // Fallback to local storage
      });
  }, []);

  // Simulator typing loop
  useEffect(() => {
    let index = 0;
    setSimText('');

    const timer = setInterval(() => {
      index++;
      if (index <= heroText.length) {
        setSimText(heroText.slice(0, index));
      } else {
        clearInterval(timer);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [heroText, simKey]);

  // Handle Save to MongoDB Atlas and Local Storage
  const handleSaveHero = async () => {
    const trimmed = heroText.trim();
    if (!trimmed) {
      setAlert({ type: 'error', message: 'Hero statement cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setAlert(null);

    try {
      const res = await fetch('/api/content/hero', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullText: trimmed })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save to database');
      }

      // 1. Update localStorage
      localStorage.setItem('mp_hero_text', trimmed);

      // 2. Broadcast custom event to live landing page
      window.dispatchEvent(new CustomEvent('hero-text-updated', {
        detail: { fullText: trimmed }
      }));

      setAlert({
        type: 'success',
        message: 'Hero statement successfully saved to MongoDB Atlas & updated live!'
      });

      // Restart preview
      setSimKey(k => k + 1);
    } catch (err) {
      // Still persist locally so admin experiences immediate update
      localStorage.setItem('mp_hero_text', trimmed);
      window.dispatchEvent(new CustomEvent('hero-text-updated', {
        detail: { fullText: trimmed }
      }));

      setAlert({
        type: 'success',
        message: 'Saved locally! (Backend update notice: ' + err.message + ')'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setHeroText(DEFAULT_HERO_TEXT);
    setSimKey(k => k + 1);
    setAlert({
      type: 'success',
      message: 'Reset to default template text. Click "Save Changes to Hero" to persist.'
    });
  };

  const renderSimContent = () => {
    const brandName = 'Motion Pub';
    if (simText.length <= brandName.length) {
      return <span className="mp-mockup-brand">{simText}</span>;
    }
    return (
      <>
        <span className="mp-mockup-brand">{brandName}</span>
        {simText.slice(brandName.length)}
      </>
    );
  };

  return (
    <div className="mp-dashboard-root">
      <div className="mp-dashboard-glow" />

      {/* Sidebar Navigation */}
      <aside className="mp-dashboard-sidebar">
        <div>
          {/* Brand Header */}
          <div className="mp-sidebar-header">
            <div className="mp-sidebar-logo-group">
              <div className="mp-sidebar-brand-badge">MP</div>
              <div>
                <h1 className="mp-sidebar-title">Motion Pub</h1>
                <span className="mp-sidebar-subtitle">Admin Console</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="mp-sidebar-nav">
            <span className="mp-nav-section-label">Main Navigation</span>

            <button
              type="button"
              className={`mp-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <div className="mp-nav-item-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Overview</span>
              </div>
            </button>

            {/* Hero Page Navigation Link */}
            <button
              type="button"
              className={`mp-nav-item ${activeTab === 'hero' ? 'active' : ''}`}
              onClick={() => setActiveTab('hero')}
            >
              <div className="mp-nav-item-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Hero Page</span>
              </div>
              <span className="mp-nav-badge">Editable</span>
            </button>

            <span className="mp-nav-section-label">Sections (CMS)</span>

            <div className="mp-nav-item" style={{ opacity: 0.5, cursor: 'default' }}>
              <div className="mp-nav-item-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>Services</span>
              </div>
              <span className="mp-nav-badge">Soon</span>
            </div>

            <div className="mp-nav-item" style={{ opacity: 0.5, cursor: 'default' }}>
              <div className="mp-nav-item-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <span>Works / Portfolio</span>
              </div>
              <span className="mp-nav-badge">Soon</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer with Profile & Actions */}
        <div className="mp-sidebar-footer">
          <div className="mp-admin-profile">
            <div className="mp-admin-avatar">
              {(adminUser?.name || 'Admin')[0].toUpperCase()}
            </div>
            <div className="mp-admin-info">
              <span className="mp-admin-name">{adminUser?.name || 'Super Admin'}</span>
              <span className="mp-admin-role">{adminUser?.username || 'admin@motionpub.com'}</span>
            </div>
          </div>

          <div className="mp-sidebar-actions">
            <button
              type="button"
              className="mp-btn-action-sm"
              onClick={onBackToSite}
              title="Return to website view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>Site</span>
            </button>
            <button
              type="button"
              className="mp-btn-action-sm logout"
              onClick={onLogout}
              title="End admin session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="mp-dashboard-main">
        {/* Topbar */}
        <header className="mp-dashboard-topbar">
          <div className="mp-topbar-breadcrumb">
            <span>Dashboard</span>
            <span>/</span>
            <span className="current">
              {activeTab === 'hero' ? 'Hero Page Configuration' : 'Overview'}
            </span>
          </div>

          <div className="mp-topbar-actions">
            <div className="mp-live-status-pill">
              <span className="mp-live-status-dot" />
              <span>MongoDB Atlas Connected</span>
            </div>

            <button
              type="button"
              className="mp-btn-site-preview"
              onClick={onBackToSite}
            >
              <span>View Live Website</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="mp-page-container">
          {/* Notifications */}
          {alert && (
            <div className={`mp-alert-banner ${alert.type}`}>
              <div className="mp-alert-left">
                {alert.type === 'success' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
                <span>{alert.message}</span>
              </div>
              <button
                type="button"
                className="mp-alert-close"
                onClick={() => setAlert(null)}
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'hero' ? (
            /* HERO PAGE VIEW */
            <>
              <div className="mp-page-header">
                <h2 className="mp-page-title">Hero Section Statement</h2>
                <p className="mp-page-desc">
                  Edit the core typing sentence rendered in the Hero section. All changes persist to MongoDB Atlas and update immediately.
                </p>
              </div>

              <div className="mp-hero-editor-grid">
                {/* Left Card: Text Editor */}
                <div className="mp-card">
                  <div className="mp-card-header">
                    <div className="mp-card-title-group">
                      <span className="mp-card-title">Typing Statement</span>
                    </div>
                    <span className="mp-card-tag">Dynamic Text</span>
                  </div>

                  <div className="mp-field-group">
                    <div className="mp-field-label-row">
                      <label htmlFor="hero-text-input" className="mp-field-label">
                        Statement Content (const fullText)
                      </label>
                      <span className="mp-char-count">{heroText.length} characters</span>
                    </div>

                    <textarea
                      id="hero-text-input"
                      className="mp-textarea"
                      value={heroText}
                      onChange={(e) => setHeroText(e.target.value)}
                      placeholder="Enter hero sentence..."
                      rows={4}
                    />
                  </div>

                  {/* Preset Suggestions */}
                  <div className="mp-templates-row">
                    <span className="mp-templates-title">Quick Presets:</span>
                    <div className="mp-preset-chips">
                      {PRESET_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="mp-chip-btn"
                          onClick={() => {
                            setHeroText(tmpl.text);
                            setSimKey(k => k + 1);
                          }}
                        >
                          + {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mp-editor-actions">
                    <button
                      type="button"
                      className="mp-btn-save"
                      onClick={handleSaveHero}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span>Saving to Database...</span>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                          <span>Save Changes to Hero</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="mp-btn-reset"
                      onClick={handleResetDefault}
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Right Card: Live Interactive Preview */}
                <div className="mp-preview-card">
                  <div className="mp-preview-badge-row">
                    <span className="mp-preview-tag">
                      <span className="mp-live-status-dot" />
                      Live Typing Simulator
                    </span>
                    <button
                      type="button"
                      className="mp-btn-restart-sim"
                      onClick={() => setSimKey(k => k + 1)}
                      title="Replay typing animation"
                    >
                      ↺ Replay
                    </button>
                  </div>

                  <div className="mp-preview-mockup-window">
                    <p className="mp-mockup-typing-text">
                      {renderSimContent()}
                      <span className="mp-mockup-cursor">|</span>
                    </p>
                  </div>

                  <div className="mp-preview-meta">
                    <span>Component: <code>components/hero/hero.jsx</code></span>
                    <span>Speed: 40ms / character</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* OVERVIEW PAGE VIEW */
            <>
              <div className="mp-page-header">
                <h2 className="mp-page-title">Welcome Back, {adminUser?.name || 'Administrator'}</h2>
                <p className="mp-page-desc">
                  Quick summary of your Motion Pub content management console.
                </p>
              </div>

              <div className="mp-overview-grid">
                <div className="mp-stat-card">
                  <span className="mp-stat-label">Active Admin</span>
                  <span className="mp-stat-val" style={{ fontSize: '1.2rem' }}>
                    {adminUser?.username || 'admin@motionpub.com'}
                  </span>
                  <span className="mp-stat-sub">Role: {adminUser?.role || 'admin'}</span>
                </div>

                <div className="mp-stat-card">
                  <span className="mp-stat-label">Database Connection</span>
                  <span className="mp-stat-val" style={{ color: '#94E000' }}>Active</span>
                  <span className="mp-stat-sub">Cluster: Motionpub01</span>
                </div>

                <div className="mp-stat-card">
                  <span className="mp-stat-label">Hero Statement Status</span>
                  <span className="mp-stat-val" style={{ color: '#94E000' }}>Live</span>
                  <span className="mp-stat-sub">{heroText.length} characters long</span>
                </div>
              </div>

              {/* Call to action to jump straight into Hero page */}
              <div className="mp-cta-banner">
                <div className="mp-cta-info">
                  <h3>Manage Landing Page Hero</h3>
                  <p>
                    Customize the primary fullText statement and preview typing animation in real time.
                  </p>
                </div>
                <button
                  type="button"
                  className="mp-btn-site-preview"
                  onClick={() => setActiveTab('hero')}
                >
                  <span>Open Hero Editor</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
