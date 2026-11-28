import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import PageHeader from '../../components/pageHeader/pageHeader'
import defaultVideo from '../../assets/videos/default.mp4'
import pubPulseVideo from '../../assets/videos/pub pulse video.mp4'
import animatedVideoPoster from '../../assets/services/animated-video-production.jpg'
import postProductionPoster from '../../assets/services/post-production-editing.jpg'
import brandStorytellingPoster from '../../assets/services/brand-storytelling.jpg'
import timelinePoster from '../../assets/images/timeline_preview.jpg'
import heroArtPoster from '../../assets/images/hero_art.jpeg'
import './mpWorks.css'

const FILTER_CATEGORIES = [
  'All',
  'Animated Video Production',
  'Post-Production & Editing',
  'Brand Storytelling',
  'PubPulse',
]

export const DEFAULT_WORKS = [
  {
    id: 'work-ceylonpay',
    title: 'CEYLONPAY LAUNCH FILM',
    client: 'CeylonPay Digital',
    year: '2026',
    duration: '01:15',
    format: '4K · 16:9 Commercial',
    service: 'Animated Video Production',
    tags: ['2D Animation', 'Commercial', 'Sound Design'],
    description:
      'Elevating CeylonPay’s digital wallet launch with a kinetic 2D animated commercial built for high-retention social and broadcast campaigns.',
    poster: animatedVideoPoster,
    videoUrl: defaultVideo,
    deliverables: ['60s Hero Commercial', '15s Social Cutdowns', 'Custom Audio Mix'],
  },
  {
    id: 'work-pubpulse-reels',
    title: 'PUBPULSE STREET REELS',
    client: 'PubPulse Originals',
    year: '2026',
    duration: '00:48',
    format: '4K · Mobile Cinema',
    service: 'PubPulse',
    tags: ['Mobile Filmmaking', 'PubPulse', 'Short-Form'],
    description:
      'Capturing raw moments and fast-paced visual storytelling through creative mobile filmmaking crafted for modern social audiences.',
    poster: heroArtPoster,
    videoUrl: pubPulseVideo,
    deliverables: ['Mobile Cinematography', 'Dynamic Reel Cuts', 'Beat-Synced Grading'],
  },
  {
    id: 'work-nova-showreel',
    title: 'NOVA SYSTEMS REBRAND',
    client: 'Nova Systems Global',
    year: '2025',
    duration: '01:42',
    format: '4K · 60fps Master',
    service: 'Post-Production & Editing',
    tags: ['Video Editing', 'Motion Graphics', 'Color Grading'],
    description:
      'Transforming Nova Systems’ product showcase with razor-sharp narrative pacing, custom kinetic typography, and cinema-grade color treatments.',
    poster: postProductionPoster,
    videoUrl: defaultVideo,
    deliverables: ['Full Post-Production', 'Kinetic Title Suite', 'Studio Color Grade'],
  },
  {
    id: 'work-kandy-roasters',
    title: 'KANDY ROASTERS STORY',
    client: 'Kandy Roasters Co.',
    year: '2025',
    duration: '02:10',
    format: '4K · Anamorphic',
    service: 'Brand Storytelling',
    tags: ['Brand Film', 'Campaign', 'Storytelling'],
    description:
      'Crafting an atmospheric Sri Lankan origin story that blends sensory cinematography with emotive pacing to drive international brand recall.',
    poster: brandStorytellingPoster,
    videoUrl: defaultVideo,
    deliverables: ['Hero Brand Film', 'Director’s Cut', 'International Campaign Edits'],
  },
  {
    id: 'work-fintrack-promo',
    title: 'FINTRACK APP PROMO',
    client: 'FinTrack Labs',
    year: '2025',
    duration: '00:55',
    format: '4K · UI Motion',
    service: 'Animated Video Production',
    tags: ['App Promo', 'UI Motion', '2D Animation'],
    description:
      'Turning complex financial workflows into an effortless, scroll-stopping animated product promo engineered to boost app store conversions.',
    poster: timelinePoster,
    videoUrl: defaultVideo,
    deliverables: ['45s App Launch Spot', 'App Store Preview Loop', 'Motion UI Toolkit'],
  },
  {
    id: 'work-lankatech-pulse',
    title: 'LANKATECH EVENT PULSE',
    client: 'LankaTech Summit',
    year: '2026',
    duration: '01:05',
    format: '4K · Same-Day Edit',
    service: 'PubPulse',
    tags: ['PubPulse', 'Event Coverage', 'Social Reels'],
    description:
      'Real-time mobile filmmaking and rapid turnaround edits capturing keynote energy, behind-the-scenes conversations, and live crowd moments.',
    poster: pubPulseVideo ? brandStorytellingPoster : heroArtPoster,
    videoUrl: pubPulseVideo,
    deliverables: ['Live Event Reels', 'Speaker Highlights', 'Same-Day Social Pack'],
  },
]

const loadCachedWorks = () => {
  try {
    const raw = localStorage.getItem('mp_works')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore invalid cache
  }
  return DEFAULT_WORKS
}

function getEmbedUrl(url = '') {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  }
  return null
}

function WorkVideoCard({ work, index, onOpen }) {
  const previewVideoRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const isEmbed = Boolean(getEmbedUrl(work.videoUrl))
  const canPreviewVideo = Boolean(work.videoUrl && !isEmbed)

  const handleMouseEnter = () => {
    setIsHovered(true)
    const vid = previewVideoRef.current
    if (vid && canPreviewVideo) {
      vid.currentTime = 0
      vid.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    const vid = previewVideoRef.current
    if (vid && canPreviewVideo) {
      vid.pause()
    }
  }

  return (
    <article
      className={`mp-work-card ${isHovered ? 'is-hovered' : ''}`}
      style={{ animationDelay: `${0.06 + (index % 4) * 0.08}s` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Rounded Video Preview Frame */}
      <div
        className="mp-work-media"
        role="button"
        tabIndex={0}
        aria-label={`Play ${work.title} video and view project details`}
        onClick={() => onOpen(work)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(work)
          }
        }}
      >
        {work.poster && (
          <img
            src={work.poster}
            alt={`${work.title} preview frame`}
            className="mp-work-poster"
            loading="lazy"
          />
        )}

        {canPreviewVideo && (
          <video
            ref={previewVideoRef}
            src={work.videoUrl}
            poster={work.poster || undefined}
            className={`mp-work-preview-video ${isHovered ? 'is-playing' : ''}`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        )}

        <div className="mp-work-media-scrim" aria-hidden="true" />

        {/* Top Meta Pills (Duration & Year) */}
        <div className="mp-work-media-top">
          {work.year && <span className="mp-work-year-pill">{work.year}</span>}
          {work.duration && (
            <span className="mp-work-duration-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
              <span>{work.duration}</span>
            </span>
          )}
        </div>

        {/* Signature Centered Frosted Glass "View" Medallion */}
        <div className="mp-work-view-badge" aria-hidden="true">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mp-work-view-play"
          >
            <polygon points="7 4 20 12 7 20 7 4" />
          </svg>
          <span>View</span>
        </div>
      </div>

      {/* Editorial Details Directly Below Frame */}
      <div className="mp-work-info">
        <div className="mp-work-title-row">
          <h2
            className="mp-work-title"
            onClick={() => onOpen(work)}
          >
            {work.title}
          </h2>
          {work.client && <span className="mp-work-client">{work.client}</span>}
        </div>

        {/* Outlined Capsule Category & Deliverable Pills */}
        <div className="mp-work-tags" aria-label="Project categories">
          {(work.tags || []).map((tag, idx) => (
            <span
              key={`${work.id}-tag-${idx}`}
              className={`mp-work-tag ${idx === 0 ? 'is-primary' : ''}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Project Description */}
        <p className="mp-work-desc">{work.description}</p>

        {/* Compact Production Details Strip */}
        <div className="mp-work-meta-strip">
          <span className="mp-work-meta-item">
            <span className="mp-work-meta-label">Service</span>
            <span className="mp-work-meta-value">{work.service}</span>
          </span>
          {work.format && (
            <span className="mp-work-meta-item">
              <span className="mp-work-meta-label">Format</span>
              <span className="mp-work-meta-value">{work.format}</span>
            </span>
          )}
          <button
            type="button"
            className="mp-work-watch-link"
            onClick={() => onOpen(work)}
          >
            <span>Watch</span>
            <svg
              width="12"
              height="12"
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
          </button>
        </div>
      </div>
    </article>
  )
}

export default function MpWorks() {
  const [works, setWorks] = useState(loadCachedWorks)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isFilterStuck, setIsFilterStuck] = useState(false)
  const filterSentinelRef = useRef(null)

  // Detect when the sticky filter bar pins below the navbar + breadcrumb bar
  useEffect(() => {
    const sentinel = filterSentinelRef.current
    if (!sentinel) return undefined

    const updateStuck = () => {
      const headerOffset = window.innerWidth <= 768 ? 110 : 122
      const rect = sentinel.getBoundingClientRect()
      setIsFilterStuck(rect.top <= headerOffset)
    }

    updateStuck()
    window.addEventListener('scroll', updateStuck, { passive: true })
    window.addEventListener('resize', updateStuck, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateStuck)
      window.removeEventListener('resize', updateStuck)
    }
  }, [])

  // Live CMS sync (if /api/content/works or localStorage updates are available)
  useEffect(() => {
    let isMounted = true

    fetch('/api/content/works')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setWorks(data.data)
          try {
            localStorage.setItem('mp_works', JSON.stringify(data.data))
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {
        // Fallback silently to default portfolio works
      })

    const handleWorksUpdated = (e) => {
      if (Array.isArray(e?.detail?.works) && e.detail.works.length > 0) {
        setWorks(e.detail.works)
      }
    }
    const handleStorage = (e) => {
      if (e.key === 'mp_works' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed) && parsed.length > 0) setWorks(parsed)
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('mp-works-updated', handleWorksUpdated)
    window.addEventListener('storage', handleStorage)
    return () => {
      isMounted = false
      window.removeEventListener('mp-works-updated', handleWorksUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const filteredWorks = useMemo(() => {
    if (activeCategory === 'All') return works
    return works.filter((w) => {
      const svc = (w.service || '').toLowerCase()
      const target = activeCategory.toLowerCase()
      const tagsMatch = (w.tags || []).some((t) => t.toLowerCase().includes(target))
      return svc === target || svc.includes(target) || tagsMatch
    })
  }, [works, activeCategory])

  const isModalOpen = selectedIndex !== null && filteredWorks[selectedIndex]
  const activeWork = isModalOpen ? filteredWorks[selectedIndex] : null

  const closeModal = useCallback(() => setSelectedIndex(null), [])

  const handleOpenWork = useCallback(
    (work) => {
      const idx = filteredWorks.findIndex((item) => item.id === work.id)
      if (idx !== -1) setSelectedIndex(idx)
    },
    [filteredWorks]
  )

  const handlePrevWork = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev - 1 + filteredWorks.length) % filteredWorks.length
    )
  }, [filteredWorks.length])

  const handleNextWork = useCallback(() => {
    setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % filteredWorks.length))
  }, [filteredWorks.length])

  // Lock body scroll & keyboard navigation while video lightbox is open
  useEffect(() => {
    if (!isModalOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft' && filteredWorks.length > 1) handlePrevWork()
      if (e.key === 'ArrowRight' && filteredWorks.length > 1) handleNextWork()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isModalOpen, closeModal, handlePrevWork, handleNextWork, filteredWorks.length])

  const handleInquireSimilar = (serviceName) => {
    try {
      if (serviceName) {
        sessionStorage.setItem('mp_preselected_service', serviceName)
      }
      sessionStorage.setItem('mp_open_booking_modal', 'true')
    } catch {
      // ignore storage errors
    }
    closeModal()
    window.location.hash = '#contact'
  }

  const handleSelectCategory = (category) => {
    setActiveCategory(category)
    setSelectedIndex(null)
    if (isFilterStuck && filterSentinelRef.current) {
      const offset = window.innerWidth <= 768 ? 112 : 124
      const targetTop = filterSentinelRef.current.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }

  const embedUrl = activeWork ? getEmbedUrl(activeWork.videoUrl) : null

  return (
    <section className="mp-works-section" id="works" aria-label="Motion Pub Works Portfolio">
      <div className="mp-works-bg-glow" aria-hidden="true" />

      {/* Reusable PageHeader matching About / Services / Testimonials */}
      <PageHeader
        text="OUR WORKS"
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
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
          </svg>
        }
      />

      <div className="mp-works-shell">
        {/* Top Left-Aligned Editorial Display Heading */}
        <header className="mp-works-header">
          <div className="mp-works-heading-block">
            <h1 className="mp-works-headline">
              <span className="mp-works-headline-line">CRAFTING WORKS</span>
              <span className="mp-works-headline-line accent">THAT STAND OUT</span>
            </h1>
          </div>
        </header>

        {/* Sentinel for Sticky Filter Bar Detection */}
        <div ref={filterSentinelRef} className="mp-works-filter-sentinel" aria-hidden="true" />

        {/* Sticky Service Category Filter Bar */}
        <div className={`mp-works-filters-sticky ${isFilterStuck ? 'is-stuck' : ''}`}>
          <div className="mp-works-filters" role="tablist" aria-label="Filter portfolio by service">
            {FILTER_CATEGORIES.map((category) => {
              const shortLabel =
                category === 'Animated Video Production'
                  ? 'Animated Video'
                  : category === 'Post-Production & Editing'
                    ? 'Post-Production'
                    : category
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`mp-works-filter-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(category)}
                >
                  {shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Strict 2-Column Editorial Video Portfolio Grid */}
        {filteredWorks.length > 0 ? (
          <div className="mp-works-grid">
            {filteredWorks.map((work, idx) => (
              <WorkVideoCard
                key={work.id || work._id || idx}
                work={work}
                index={idx}
                onOpen={handleOpenWork}
              />
            ))}
          </div>
        ) : (
          <div className="mp-works-empty">
            <p>No portfolio videos found in this category yet.</p>
            <button
              type="button"
              className="mp-works-reset-btn"
              onClick={() => setActiveCategory('All')}
            >
              Show All Works
            </button>
          </div>
        )}
      </div>

      {/* Full-View Video Player & Project Details Lightbox Modal */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="mp-work-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeWork.title} video player and details`}
            onClick={closeModal}
          >
            <div className="mp-work-modal-card" onClick={(e) => e.stopPropagation()}>
              {/* Top Modal Bar */}
              <div className="mp-work-modal-topbar">
                <div className="mp-work-modal-counter">
                  <span className="mp-work-modal-dot" aria-hidden="true" />
                  <span>
                    {String(selectedIndex + 1).padStart(2, '0')} /{' '}
                    {String(filteredWorks.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="mp-work-modal-controls">
                  {filteredWorks.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="mp-work-modal-nav-btn"
                        onClick={handlePrevWork}
                        aria-label="Previous project"
                        title="Previous project"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="mp-work-modal-nav-btn"
                        onClick={handleNextWork}
                        aria-label="Next project"
                        title="Next project"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="mp-work-modal-close-btn"
                    onClick={closeModal}
                    aria-label="Close video modal"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cinema 16:9 Video Stage */}
              <div className="mp-work-modal-player">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeWork.title}
                    className="mp-work-modal-iframe"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={activeWork.id}
                    src={activeWork.videoUrl}
                    poster={activeWork.poster || undefined}
                    className="mp-work-modal-video"
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>

              {/* Project Details Below Video */}
              <div className="mp-work-modal-body">
                <div className="mp-work-modal-head">
                  <div>
                    <h2 className="mp-work-modal-title">{activeWork.title}</h2>
                    <div className="mp-work-tags">
                      {(activeWork.tags || []).map((tag, idx) => (
                        <span
                          key={`modal-tag-${idx}`}
                          className={`mp-work-tag ${idx === 0 ? 'is-primary' : ''}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mp-work-modal-cta"
                    onClick={() => handleInquireSimilar(activeWork.service)}
                  >
                    <span>Start a Similar Project</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </button>
                </div>

                <p className="mp-work-modal-desc">{activeWork.description}</p>

                {/* Structured Project Details Grid */}
                <div className="mp-work-modal-specs">
                  <div className="mp-work-spec-box">
                    <span className="mp-work-spec-label">Client</span>
                    <span className="mp-work-spec-val">{activeWork.client || 'Motion Pub Client'}</span>
                  </div>
                  <div className="mp-work-spec-box">
                    <span className="mp-work-spec-label">Service</span>
                    <span className="mp-work-spec-val">{activeWork.service || 'Video Production'}</span>
                  </div>
                  <div className="mp-work-spec-box">
                    <span className="mp-work-spec-label">Duration</span>
                    <span className="mp-work-spec-val">{activeWork.duration || '—'}</span>
                  </div>
                  <div className="mp-work-spec-box">
                    <span className="mp-work-spec-label">Format</span>
                    <span className="mp-work-spec-val">{activeWork.format || '4K Master'}</span>
                  </div>
                </div>

                {Array.isArray(activeWork.deliverables) && activeWork.deliverables.length > 0 && (
                  <div className="mp-work-modal-deliverables">
                    <span className="mp-work-spec-label">Deliverables</span>
                    <div className="mp-work-deliverable-chips">
                      {activeWork.deliverables.map((item, idx) => (
                        <span key={`deliv-${idx}`} className="mp-work-deliverable-chip">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
