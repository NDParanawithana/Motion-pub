import { useState, useEffect } from 'react'
import Navbar from './components/navbar/navbar'
import Hero from './components/hero/hero'
import About from './pages/about/about'
import Contact from './pages/contact/contact'
import MongoStatus from './components/MongoStatus/MongoStatus'
import AdminLogin from './admin/adminlogin/adminLogin'
import AdminDashboard from './admin/dashboard/dashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#dashboard') return 'dashboard';
    if (hash === '#about') return 'about';
    if (hash === '#contact') return 'contact';
    return 'site';
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mp_admin_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#dashboard') {
        setCurrentView('dashboard');
      } else if (hash === '#about') {
        setCurrentView('about');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else if (hash === '#contact') {
        setCurrentView('contact');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        setCurrentView('site');
      }
    };

    // Ensure initial load with hash lands at the exact top position
    if (window.location.hash === '#about' || window.location.hash === '#contact') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Smooth scroll to target anchor when returning to site view
  useEffect(() => {
    if (currentView === 'site') {
      const hash = window.location.hash;
      if (hash && hash !== '#' && hash !== '#home' && hash !== '#site') {
        const id = hash.replace('#', '');
        requestAnimationFrame(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    }
  }, [currentView]);

  // Set page title dynamically based on active view
  useEffect(() => {
    if (currentView === 'dashboard') {
      document.title = 'MP Admin';
    } else if (currentView === 'about') {
      document.title = 'About Us | Motion Pub';
    } else if (currentView === 'contact') {
      document.title = 'Contact Us | Motion Pub';
    } else {
      document.title = 'Motion Pub';
    }
  }, [currentView]);

  // Sync admin user across browser tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'mp_admin_user') {
        try {
          const user = e.newValue ? JSON.parse(e.newValue) : null;
          setAdminUser(user);
        } catch {
          setAdminUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleEnterDashboard = (user) => {
    setAdminUser(user);
    if (user) {
      localStorage.setItem('mp_admin_user', JSON.stringify(user));
    }
    const dashboardUrl = `${window.location.origin}${window.location.pathname}#dashboard`;
    const newWindow = window.open(dashboardUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      // Fallback to same tab if browser blocks popups
      setCurrentView('dashboard');
      window.location.hash = '#dashboard';
    }
  };

  const handleBackToSite = () => {
    const siteUrl = `${window.location.origin}${window.location.pathname}`;
    const newWindow = window.open(siteUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      // Fallback to same tab if browser blocks popups
      setCurrentView('site');
      window.location.hash = '';
    }
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('mp_admin_user');
    setCurrentView('site');
    window.location.hash = '';
  };

  if (currentView === 'dashboard') {
    return (
      <AdminDashboard
        adminUser={adminUser}
        onBackToSite={handleBackToSite}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="landing-page">
      {/* Admin Login Modal (Triggered by Ctrl+Q or bottom-right badge) */}
      <AdminLogin onEnterDashboard={handleEnterDashboard} adminUser={adminUser} />

      {/* MongoDB Connection Status Checker */}
      <MongoStatus />

      {/* Navigation Bar */}
      <Navbar />

      <main className="main-content">
        {currentView === 'about' ? (
          /* Standalone About Page (Fits screen) */
          <About />
        ) : currentView === 'contact' ? (
          /* Standalone Contact Page (Fits screen) */
          <Contact />
        ) : (
          /* Main Landing Experience (Scrollable without About/Contact interruption) */
          <>
            {/* Hero Section */}
            <Hero />

            {/* Services Section */}
            <section className="section" id="services">
              <div className="container">
                <div className="section-header">
                  <span className="section-tag">Services</span>
                  <h2 className="section-title">What We Do Best</h2>
                  <p className="section-description">
                    Tailored creative solutions designed to captivate your audience and scale your brand.
                  </p>
                </div>
                <div className="cards-grid">
                  <div className="feature-card">
                    <div className="card-icon">✨</div>
                    <h3 className="card-title">Motion Design & 3D</h3>
                    <p className="card-text">
                      Captivating animation, 3D modeling, and visual storytelling for digital campaigns.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">💻</div>
                    <h3 className="card-title">Web Development</h3>
                    <p className="card-text">
                      Responsive, blazing-fast web applications built on modern frameworks.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">🔮</div>
                    <h3 className="card-title">Brand Identity</h3>
                    <p className="card-text">
                      Comprehensive design systems, logos, and digital guidelines that build trust.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Our Works Section */}
            <section className="section" id="works">
              <div className="container">
                <div className="section-header">
                  <span className="section-tag">Our Works</span>
                  <h2 className="section-title">Featured Creations</h2>
                  <p className="section-description">
                    Explore a selection of our most recent digital and motion projects.
                  </p>
                </div>
                <div className="cards-grid">
                  <div className="feature-card">
                    <div className="card-icon">🎬</div>
                    <h3 className="card-title">HyperDrive Brand Launch</h3>
                    <p className="card-text">
                      Full 3D motion identity and landing experience for a next-gen tech product.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">⚡</div>
                    <h3 className="card-title">Pulse Interactive App</h3>
                    <p className="card-text">
                      Real-time analytics dashboard with fluid micro-interactions and dark UI.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">🌐</div>
                    <h3 className="card-title">Nova Global Rebrand</h3>
                    <p className="card-text">
                      Global digital platform revamp delivering a 40% increase in brand recall.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="section" id="testimonials">
              <div className="container">
                <div className="section-header">
                  <span className="section-tag">Testimonials</span>
                  <h2 className="section-title">Client Perspectives</h2>
                  <p className="section-description">
                    Hear directly from the teams and founders we’ve partnered with.
                  </p>
                </div>
                <div className="testimonials-grid">
                  <div className="testimonial-card">
                    <p className="quote">
                      &ldquo;The Motion Pub team took our brand vision and turned it into an unforgettable digital reality. Their attention to motion detail is unmatched.&rdquo;
                    </p>
                    <div className="author-info">
                      <div className="author-avatar">A</div>
                      <div>
                        <div className="author-name">Alex Rivera</div>
                        <div className="author-role">Founder, Pulse Technologies</div>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <p className="quote">
                      &ldquo;Super smooth communication, impeccable turnaround time, and world-class design delivery. Our conversion rates shot up immediately.&rdquo;
                    </p>
                    <div className="author-info">
                      <div className="author-avatar">S</div>
                      <div>
                        <div className="author-name">Sarah Jenkins</div>
                        <div className="author-role">Head of Product, Nova Systems</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <p>&copy; {new Date().getFullYear()} Motion Pub. All rights reserved.</p>
          <p>Built with React & Vite</p>
        </div>
      </footer>
    </div>
  )
}

export default App
