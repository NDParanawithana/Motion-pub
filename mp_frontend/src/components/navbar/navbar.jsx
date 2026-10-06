import { useState, useEffect } from 'react'
import mainLogo from '../../assets/icons/mainlogo.png'
import './navbar.css'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // No link highlighted when in Hero section (at top of page)
  const [activeLink, setActiveLink] = useState('')

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Team', href: '#team' },
    { name: 'Services', href: '#services' },
    { name: 'Our Works', href: '#works' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Partners', href: '#partners' },
  ]

  const handleLinkClick = (name) => {
    setActiveLink(name)
    setIsMobileMenuOpen(false)
  }

  // Track active section on scroll and hashchange
  useEffect(() => {
    const scrollSections = [
      { id: 'team', name: 'Team' },
      { id: 'services', name: 'Services' },
      { id: 'works', name: 'Our Works' },
      { id: 'testimonials', name: 'Testimonials' },
      { id: 'partners', name: 'Partners' }
    ]

    const updateActiveSection = () => {
      const hash = window.location.hash

      // Lock active state when on dedicated page views
      if (hash === '#about') {
        setActiveLink('About')
        return
      }
      if (hash === '#contact') {
        setActiveLink('Contact Us')
        return
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0

      // When near top of page (Hero section), clear active link
      if (scrollY < 100) {
        setActiveLink('')
        return
      }

      // Check if user has scrolled to the bottom of the page
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      if (windowHeight + scrollY >= docHeight - 50) {
        for (let i = scrollSections.length - 1; i >= 0; i--) {
          const el = document.getElementById(scrollSections[i].id)
          if (el) {
            setActiveLink(scrollSections[i].name)
            return
          }
        }
      }

      // Activation line offset below the sticky navbar (~160px from viewport top)
      const activationOffset = 160

      let matchedSection = ''
      for (const section of scrollSections) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= activationOffset && rect.bottom > activationOffset) {
            matchedSection = section.name
            break
          }
        }
      }

      if (!matchedSection) {
        let closestDist = Infinity
        for (const section of scrollSections) {
          const el = document.getElementById(section.id)
          if (el) {
            const rect = el.getBoundingClientRect()
            if (rect.top <= activationOffset) {
              const dist = activationOffset - rect.top
              if (dist < closestDist) {
                closestDist = dist
                matchedSection = section.name
              }
            }
          }
        }
      }

      setActiveLink(matchedSection)
    }

    const handleHash = () => {
      const hash = window.location.hash
      if (!hash || hash === '#' || hash === '#home' || hash === '#site') {
        setActiveLink('')
      } else if (hash === '#about') {
        setActiveLink('About')
      } else if (hash === '#contact') {
        setActiveLink('Contact Us')
      } else {
        const match = navLinks.find(l => l.href === hash)
        if (match) {
          setActiveLink(match.name)
        }
      }
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection, { passive: true })
    window.addEventListener('hashchange', handleHash)

    // Initial check
    updateActiveSection()
    if (window.location.hash) {
      handleHash()
    }

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
      window.removeEventListener('hashchange', handleHash)
    }
  }, [])

  return (
    <header className="mp-header">
      <div className="mp-nav-container">
        {/* Brand Logo - Navigates to Hero (#home) and clears active nav indication */}
        <a
          href="#home"
          className="mp-brand"
          aria-label="Motion Pub Home"
          onClick={() => handleLinkClick('')}
        >
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

        {/* Contact Action Button */}
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
          onClick={() => handleLinkClick('Contact')}
        >
          Contact
        </a>
      </div>
    </header>
  )
}
