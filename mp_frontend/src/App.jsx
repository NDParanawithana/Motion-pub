import Navbar from './components/navbar/navbar'
import Hero from './components/hero/hero'
import './App.css'

function App() {
  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <Navbar />

      <main className="main-content">
        {/* Hero Section */}
        <Hero />

        {/* About Us Section */}
        <section className="section" id="about">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">About Us</span>
              <h2 className="section-title">Driven by Innovation & Creativity</h2>
              <p className="section-description">
                Motion Pub is a forward-thinking digital production studio blending art, engineering, and motion design to elevate modern digital products.
              </p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <div className="card-icon">🎯</div>
                <h3 className="card-title">Strategic Vision</h3>
                <p className="card-text">
                  Every frame, interaction, and line of code is tailored to meet real business outcomes.
                </p>
              </div>
              <div className="feature-card">
                <div className="card-icon">🚀</div>
                <h3 className="card-title">High Performance</h3>
                <p className="card-text">
                  Lightning-fast web experiences engineered for maximum user engagement and conversion.
                </p>
              </div>
              <div className="feature-card">
                <div className="card-icon">🎨</div>
                <h3 className="card-title">Precision Design</h3>
                <p className="card-text">
                  Pixel-perfect interfaces infused with fluid motion and memorable brand aesthetics.
                </p>
              </div>
            </div>
          </div>
        </section>

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

        {/* Contact Us Section */}
        <section className="section" id="contact">
          <div className="container">
            <div className="contact-banner">
              <span className="section-tag">Ready to Collaborate?</span>
              <h2 className="section-title">Let&apos;s Build Something Incredible</h2>
              <p className="section-description" style={{ marginBottom: '2rem' }}>
                Have an idea or upcoming project? Reach out to us and let&apos;s bring it to life.
              </p>
              <a href="mailto:contact@motionpub.com" className="btn-primary">
                Get In Touch
              </a>
            </div>
          </div>
        </section>
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
