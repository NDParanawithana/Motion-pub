import { useState, useEffect } from 'react';
import HeroEdit from './hero/heroedit';
import AboutEdit from './about/aboutedit';
import './dashboard.css';

export default function AdminDashboard({ onBackToSite, onLogout, adminUser }) {
  const [activePage, setActivePage] = useState('hero'); // 'hero' | 'about'
  const [isHeroOpen, setIsHeroOpen] = useState(true);
  const [activeHeroSection, setActiveHeroSection] = useState('all');

  const handleOpenLiveWebsite = () => {
    if (onBackToSite) {
      onBackToSite();
    } else {
      window.open(`${window.location.origin}${window.location.pathname}`, '_blank');
    }
  };

  // Set document title for Admin Dashboard
  useEffect(() => {
    document.title = 'MP Admin';
    return () => {
      document.title = 'Motion Pub';
    };
  }, []);

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
            <span className="mp-nav-section-label">Pages</span>

            {/* Hero Page Group with Sub-menus */}
            <div className="mp-nav-group">
              <button
                type="button"
                className={`mp-nav-item ${activePage === 'hero' ? 'active' : ''}`}
                onClick={() => {
                  setActivePage('hero');
                  setIsHeroOpen(prev => !prev);
                  setActiveHeroSection('all');
                }}
                title="Manage entire Hero Page"
              >
                <div className="mp-nav-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <span>Hero Page</span>
                </div>
                <svg
                  className={`mp-nav-chevron ${isHeroOpen ? 'rotated' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Sub-menus for Text and Video Sections */}
              {isHeroOpen && (
                <div className="mp-sub-nav">
                  <button
                    type="button"
                    className={`mp-sub-nav-item ${activePage === 'hero' && activeHeroSection === 'text' ? 'active' : ''}`}
                    onClick={() => {
                      setActivePage('hero');
                      setActiveHeroSection('text');
                    }}
                    title="Edit Text Statement"
                  >
                    <div className="mp-sub-nav-left">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="4 7 4 4 20 4 20 7"></polyline>
                        <line x1="9" y1="20" x2="15" y2="20"></line>
                        <line x1="12" y1="4" x2="12" y2="20"></line>
                      </svg>
                      <span>Text Section</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mp-sub-nav-item ${activePage === 'hero' && activeHeroSection === 'video' ? 'active' : ''}`}
                    onClick={() => {
                      setActivePage('hero');
                      setActiveHeroSection('video');
                    }}
                    title="Manage 3D Showcase Video"
                  >
                    <div className="mp-sub-nav-left">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                      <span>Video Section</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* About Page Navigation Link */}
            <div className="mp-nav-group">
              <button
                type="button"
                className={`mp-nav-item ${activePage === 'about' ? 'active' : ''}`}
                onClick={() => setActivePage('about')}
                title="Manage About Page"
              >
                <div className="mp-nav-item-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>About Page</span>
                </div>
              </button>
            </div>

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
              onClick={handleOpenLiveWebsite}
              title="Open live website in a new tab"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>Website</span>
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
            {activePage === 'about' ? (
              <span className="current">About Page</span>
            ) : (
              <>
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActivePage('hero');
                    setActiveHeroSection('all');
                  }}
                  title="View all Hero sections"
                >
                  Hero Page
                </span>
                <span>/</span>
                <span className="current">
                  {activeHeroSection === 'text'
                    ? 'Text Section'
                    : activeHeroSection === 'video'
                    ? 'Video Section'
                    : 'All Sections'}
                </span>
              </>
            )}
          </div>

          <div className="mp-topbar-actions">
            <div className="mp-live-status-pill">
              <span className="mp-live-status-dot" />
              <span>MongoDB Atlas Connected</span>
            </div>

            <button
              type="button"
              className="mp-btn-site-preview"
              onClick={handleOpenLiveWebsite}
              title="Open live website in a new tab"
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
          {activePage === 'about' ? (
            <AboutEdit />
          ) : (
            <HeroEdit
              activeSection={activeHeroSection}
              onSelectSection={setActiveHeroSection}
            />
          )}
        </div>
      </main>
    </div>
  );
}
