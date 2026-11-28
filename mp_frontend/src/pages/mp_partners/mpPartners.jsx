import { useState, useEffect } from 'react'
import PageHeader from '../../components/pageHeader/pageHeader'
import './mpPartners.css'

/**
 * 20 crisp monochrome vector partner logos arranged in a balanced 5x4 grid,
 * matching the minimalist typographic + emblem variety of the reference wall.
 */
function PartnerLogoMark({ id, name }) {
  switch (id) {
    case 'ceylonpay':
      return (
        <svg viewBox="0 0 180 44" className="mp-partner-svg" aria-hidden="true">
          <text x="90" y="30" textAnchor="middle" fontFamily="'Antonio', sans-serif" fontWeight="700" fontSize="29" letterSpacing="2.4" fill="currentColor">
            CEYLONPAY
          </text>
        </svg>
      )

    case 'novasystems':
      return (
        <svg viewBox="0 0 150 64" className="mp-partner-svg is-tall" aria-hidden="true">
          <path d="M75 4 L79 20 L95 24 L79 28 L75 44 L71 28 L55 24 L71 20 Z" fill="currentColor" />
          <text x="75" y="59" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="14" letterSpacing="1.2" fill="currentColor">
            Nova Systems
          </text>
        </svg>
      )

    case 'bama-craft':
      return (
        <svg viewBox="0 0 160 46" className="mp-partner-svg" aria-hidden="true">
          <path d="M58 10 Q66 5 74 10" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <text x="80" y="34" textAnchor="middle" fontFamily="system-ui, sans-serif" fontStyle="italic" fontWeight="800" fontSize="28" letterSpacing="-0.5" fill="currentColor">
            kandy
          </text>
        </svg>
      )

    case 'nam-studio':
      return (
        <svg viewBox="0 0 120 66" className="mp-partner-svg is-tall" aria-hidden="true">
          <text x="60" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="400" fontSize="32" letterSpacing="1" fill="currentColor">
            Mo
          </text>
          <text x="60" y="50" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="22" letterSpacing="1" fill="currentColor">
            lab
          </text>
          <text x="60" y="61" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="7.5" letterSpacing="1.1" fill="currentColor" opacity="0.85">
            MOTION COLLECTIVE
          </text>
        </svg>
      )

    case 'entur-media':
      return (
        <svg viewBox="0 0 175 48" className="mp-partner-svg" aria-hidden="true">
          <text x="24" y="29" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="24" letterSpacing="1" fill="currentColor">
            EN
          </text>
          <rect x="24" y="34" width="35" height="3" rx="1" fill="currentColor" />
          <text x="65" y="33" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="24" letterSpacing="1.8" fill="currentColor">
            CORE
          </text>
        </svg>
      )

    case 'fintrack':
      return (
        <svg viewBox="0 0 160 48" className="mp-partner-svg" aria-hidden="true">
          <circle cx="42" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="2.8" />
          <path d="M37 16 V27 H45" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="38" cy="20" r="1.8" fill="currentColor" />
          <text x="68" y="32" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="24" letterSpacing="0.8" fill="currentColor">
            FT
          </text>
        </svg>
      )

    case 'serendib':
      return (
        <svg viewBox="0 0 180 44" className="mp-partner-svg" aria-hidden="true">
          <path d="M22 30 L30 12 L38 30 Z M26 24 L34 24" fill="currentColor" />
          <text x="46" y="28" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="14.5" letterSpacing="1.8" fill="currentColor">
            SERENDIB
          </text>
        </svg>
      )

    case 'pulselabs':
      return (
        <svg viewBox="0 0 140 62" className="mp-partner-svg is-tall" aria-hidden="true">
          <circle cx="58" cy="22" r="12" fill="currentColor" />
          <circle cx="76" cy="22" r="12" fill="none" stroke="currentColor" strokeWidth="2.6" />
          <circle cx="76" cy="22" r="3" fill="currentColor" />
          <text x="70" y="52" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="14" letterSpacing="0.6" fill="currentColor">
            PulseLabs
          </text>
        </svg>
      )

    case 'kid-creative':
      return (
        <svg viewBox="0 0 120 60" className="mp-partner-svg is-tall" aria-hidden="true">
          <circle cx="60" cy="30" r="24" fill="currentColor" />
          <text x="60" y="36" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="18" letterSpacing="0.4" fill="#141414">
            Kiv
          </text>
        </svg>
      )

    case 'colombo-civic':
      return (
        <svg viewBox="0 0 165 52" className="mp-partner-svg" aria-hidden="true">
          <circle cx="44" cy="26" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="44" cy="26" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="44" cy="26" r="3.5" fill="currentColor" />
          <text x="70" y="32" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="19" letterSpacing="0.5" fill="currentColor">
            Colombo
          </text>
        </svg>
      )

    case 'hyperdrive':
      return (
        <svg viewBox="0 0 185 44" className="mp-partner-svg" aria-hidden="true">
          <text x="92" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" letterSpacing="-0.4" fill="currentColor">
            HyperDrive
          </text>
        </svg>
      )

    case 'lankatech':
      return (
        <svg viewBox="0 0 185 48" className="mp-partner-svg" aria-hidden="true">
          <rect x="16" y="11" width="24" height="24" rx="2" fill="currentColor" />
          <rect x="26" y="21" width="9" height="9" rx="1" fill="#141414" />
          <text x="50" y="22" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.2" fill="currentColor">
            LankaTech
          </text>
          <text x="50" y="35" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="11.5" letterSpacing="0.2" fill="currentColor" opacity="0.85">
            Digital Hub
          </text>
        </svg>
      )

    case 'verdant':
      return (
        <svg viewBox="0 0 180 50" className="mp-partner-svg" aria-hidden="true">
          <path d="M26 10 H52 V28 C52 36 39 42 39 42 C39 42 26 36 26 28 Z" fill="currentColor" />
          <path d="M34 26 L39 17 L44 26" fill="none" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="62" y="24" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13.5" fill="currentColor">
            Verdant
          </text>
          <text x="62" y="38" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="12" fill="currentColor" opacity="0.82">
            Studios
          </text>
        </svg>
      )

    case 'velox':
      return (
        <svg viewBox="0 0 165 46" className="mp-partner-svg" aria-hidden="true">
          <text x="82" y="33" textAnchor="middle" fontFamily="system-ui, sans-serif" fontStyle="italic" fontWeight="900" fontSize="29" letterSpacing="-0.8" fill="currentColor">
            Velox
          </text>
        </svg>
      )

    case 'aura-audio':
      return (
        <svg viewBox="0 0 175 48" className="mp-partner-svg" aria-hidden="true">
          <path d="M18 36 L30 12 L42 36 H34 L30 26 L26 36 Z" fill="currentColor" />
          <text x="52" y="32" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="22" letterSpacing="0.2" fill="currentColor">
            Aura
          </text>
        </svg>
      )

    case 'solaris':
      return (
        <svg viewBox="0 0 175 44" className="mp-partner-svg" aria-hidden="true">
          <text x="88" y="29" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" fontWeight="600" fontSize="20" letterSpacing="4.5" fill="currentColor">
            SOLARIS
          </text>
        </svg>
      )

    case 'orbit-media':
      return (
        <svg viewBox="0 0 175 50" className="mp-partner-svg" aria-hidden="true">
          <path d="M36 14 C44 10 48 18 42 24 C48 28 44 38 34 34 C30 40 20 36 24 27 C18 22 24 12 36 14 Z" fill="none" stroke="currentColor" strokeWidth="2.6" />
          <circle cx="33" cy="25" r="3" fill="currentColor" />
          <text x="56" y="31" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="20" letterSpacing="0.3" fill="currentColor">
            orbitnet
          </text>
        </svg>
      )

    case 'frame-geo':
      return (
        <svg viewBox="0 0 185 48" className="mp-partner-svg" aria-hidden="true">
          <rect x="20" y="10" width="18" height="28" fill="none" stroke="currentColor" strokeWidth="3.2" />
          <text x="48" y="22" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11.5" letterSpacing="1.1" fill="currentColor">
            NATIONAL
          </text>
          <text x="48" y="36" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11.5" letterSpacing="1.1" fill="currentColor">
            CINEMA LAB
          </text>
        </svg>
      )

    case 'kinetic-co':
      return (
        <svg viewBox="0 0 170 48" className="mp-partner-svg" aria-hidden="true">
          <ellipse cx="85" cy="24" rx="58" ry="15" transform="rotate(-7 85 24)" fill="currentColor" />
          <text x="85" y="29" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="14.5" letterSpacing="2" fill="#141414">
            KINETIC
          </text>
        </svg>
      )

    case 'atea-labs':
    default:
      return (
        <svg viewBox="0 0 175 46" className="mp-partner-svg" aria-hidden="true">
          <text x="88" y="33" textAnchor="middle" fontFamily="'Chakra Petch', sans-serif" fontWeight="400" fontSize="30" letterSpacing="5" fill="currentColor">
            {name ? name.slice(0, 6).toUpperCase() : 'VORTEX'}
          </text>
        </svg>
      )
  }
}

export const DEFAULT_PARTNERS = [
  { id: 'ceylonpay', name: 'CeylonPay', category: 'Fintech', website: '' },
  { id: 'novasystems', name: 'Nova Systems', category: 'Enterprise Tech', website: '' },
  { id: 'bama-craft', name: 'Kandy Roasters', category: 'Food & Beverage', website: '' },
  { id: 'nam-studio', name: 'Motion Lab', category: 'Design Collective', website: '' },
  { id: 'entur-media', name: 'EnCore', category: 'Media & Mobility', website: '' },
  { id: 'fintrack', name: 'FinTrack', category: 'Digital Finance', website: '' },
  { id: 'serendib', name: 'Serendib', category: 'Hospitality', website: '' },
  { id: 'pulselabs', name: 'PulseLabs', category: 'Product Studio', website: '' },
  { id: 'kid-creative', name: 'Kiv', category: 'Lifestyle Brand', website: '' },
  { id: 'colombo-civic', name: 'Colombo Creative', category: 'Culture & Events', website: '' },
  { id: 'hyperdrive', name: 'HyperDrive', category: 'Consumer Tech', website: '' },
  { id: 'lankatech', name: 'LankaTech Digital Hub', category: 'Innovation', website: '' },
  { id: 'verdant', name: 'Verdant Studios', category: 'Sustainability', website: '' },
  { id: 'velox', name: 'Velox', category: 'Imaging & Optics', website: '' },
  { id: 'aura-audio', name: 'Aura Audio', category: 'Sound & Media', website: '' },
  { id: 'solaris', name: 'Solaris', category: 'Cloud Software', website: '' },
  { id: 'orbit-media', name: 'OrbitNet', category: 'Telecom', website: '' },
  { id: 'frame-geo', name: 'National Cinema Lab', category: 'Documentary', website: '' },
  { id: 'kinetic-co', name: 'Kinetic', category: 'Electronics', website: '' },
  { id: 'atea-labs', name: 'Vortex', category: 'Digital Infrastructure', website: '' },
]

const loadCachedPartners = () => {
  try {
    const raw = localStorage.getItem('mp_partners')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore invalid cache
  }
  return DEFAULT_PARTNERS
}

export default function MpPartners() {
  const [partners, setPartners] = useState(loadCachedPartners)
  const [brokenLogos, setBrokenLogos] = useState({})

  // Live CMS sync if backend /api/content/partners or localStorage updates are present
  useEffect(() => {
    let isMounted = true

    fetch('/api/content/partners')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setPartners(data.data)
          try {
            localStorage.setItem('mp_partners', JSON.stringify(data.data))
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {
        // Fallback silently to curated default partner wall
      })

    const handlePartnersUpdated = (e) => {
      if (Array.isArray(e?.detail?.partners) && e.detail.partners.length > 0) {
        setPartners(e.detail.partners)
      }
    }

    const handleStorage = (e) => {
      if (e.key === 'mp_partners' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed) && parsed.length > 0) setPartners(parsed)
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('mp-partners-updated', handlePartnersUpdated)
    window.addEventListener('storage', handleStorage)
    return () => {
      isMounted = false
      window.removeEventListener('mp-partners-updated', handlePartnersUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const handleBecomePartner = () => {
    try {
      sessionStorage.setItem('mp_open_booking_modal', 'true')
    } catch {
      // ignore storage errors
    }
  }

  return (
    <section className="mp-partners-section" id="partners" aria-label="Motion Pub Partners">
      <div className="mp-partners-bg-glow" aria-hidden="true" />

      {/* Reusable PageHeader matching About / Services / Works / Testimonials */}
      <PageHeader
        text="PARTNERS"
        textColor="#78b700"
        containerColor="#8888881f"
        icon={
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-pageheader-icon"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />

      <div className="mp-partners-shell">
        {/* Elevated Editorial Heading Section */}
        <header className="mp-partners-header">
          <div className="mp-partners-eyebrow">
            <span className="mp-partners-eyebrow-dot" aria-hidden="true" />
            <span>Trusted by Ambitious Brands</span>
          </div>

          <h1 className="mp-partners-title">
            <span className="mp-partners-title-line mp-partners-title-base">We are proud to work with</span>
            <span className="mp-partners-title-line">
              <span className="mp-partners-title-accent-wrap">
                <span className="mp-partners-title-accent">GREAT COMPANIES</span>
                <svg
                  className="mp-partners-accent-underline"
                  viewBox="0 0 280 14"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="mpPartnersUnderlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d8ff3e" stopOpacity="0.2" />
                      <stop offset="45%" stopColor="#a5f700" stopOpacity="1" />
                      <stop offset="100%" stopColor="#78b700" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M4 10.5C72 3.2 198 2.2 276 9.5"
                    stroke="url(#mpPartnersUnderlineGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mp-partners-subtitle">
            Collaborating with forward-thinking Sri Lankan &amp; international brands to craft motion and storytelling that lasts.
          </p>

          <div className="mp-partners-header-rule" aria-hidden="true" />
        </header>

        {/* Clean 5-Column Monochrome Partner Logo Wall */}
        <div className="mp-partners-grid" role="list" aria-label="Partner companies">
          {partners.map((partner, idx) => {
            const key = partner.id || partner._id || `partner-${idx}`
            const hasImageLogo = Boolean(partner.logoUrl && !brokenLogos[key])

            const content = (
              <>
                <div className="mp-partner-logo-wrap">
                  {hasImageLogo ? (
                    <img
                      src={partner.logoUrl}
                      alt={`${partner.name} logo`}
                      className={`mp-partner-img ${partner.preserveColor ? 'is-color' : ''}`}
                      loading="lazy"
                      onError={() => setBrokenLogos((prev) => ({ ...prev, [key]: true }))}
                    />
                  ) : (
                    <PartnerLogoMark id={partner.id} name={partner.name} />
                  )}
                </div>

                {partner.category && (
                  <span className="mp-partner-caption" aria-hidden="true">
                    {partner.category}
                  </span>
                )}
              </>
            )

            return (
              <div
                key={key}
                role="listitem"
                className="mp-partner-cell"
                style={{ animationDelay: `${0.04 + (idx % 10) * 0.045}s` }}
              >
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mp-partner-item is-link"
                    aria-label={partner.name}
                    title={`${partner.name}${partner.category ? ` · ${partner.category}` : ''}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    className="mp-partner-item"
                    aria-label={partner.name}
                    title={`${partner.name}${partner.category ? ` · ${partner.category}` : ''}`}
                  >
                    {content}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Subtle Bottom Partner CTA */}
        <div className="mp-partners-footer">
          <span className="mp-partners-footer-text">
            Want to build something remarkable together?
          </span>
          <a
            href="#contact"
            className="mp-partners-cta-link"
            onClick={handleBecomePartner}
          >
            <span>Become a Partner</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
