import { useState } from 'react'
import mainLogo from '../../assets/icons/mainlogo.png'
import './navbar.css'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('About Us')

  const navLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Our Works', href: '#works' },
    { name: 'Testimonials', href: '#testimonials' },
  ]

  const handleLinkClick = (name) => {
    setActiveLink(name)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="mp-header">
      <div className="mp-nav-container">
        {/* Brand Logo */}
        <a href="#" className="mp-brand" aria-label="Motion Pub Home">
          <img src={mainLogo} alt="Motion Pub Logo" className="mp-logo" />
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary Navigation">
          <ul className="mp-nav-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className={`mp-nav-link ${activeLink === link.name ? 'active' : ''}`}
                  onClick={() => handleLinkClick(link.name)}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact Us Action Button */}
        <div className="mp-desktop-cta">
          <a
            href="#contact"
            className={`mp-cta-btn ${activeLink === 'Contact Us' ? 'active' : ''}`}
            onClick={() => handleLinkClick('Contact Us')}
          >
            Contact Us
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`mp-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="mp-hamburger-bar"></span>
          <span className="mp-hamburger-bar"></span>
          <span className="mp-hamburger-bar"></span>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      <div className={`mp-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="mp-mobile-links">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                className={`mp-mobile-link ${activeLink === link.name ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.name)}
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="mp-cta-btn mp-mobile-cta"
          onClick={() => handleLinkClick('Contact Us')}
        >
          Contact Us
        </a>
      </div>
    </header>
  )
}
