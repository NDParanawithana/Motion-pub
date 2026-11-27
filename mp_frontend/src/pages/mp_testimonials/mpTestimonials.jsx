import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import PageHeader from '../../components/pageHeader/pageHeader'
import './mpTestimonials.css'

const AUTO_SLIDE_MS = 2000

const DEFAULT_TESTIMONIALS = [
    {
        id: 'testi-1',
        variant: 'tone-lime',
        quote:
            'Motion Pub turned our product concept into a vibrant 2D animated commercial that outperformed every ad we had run before. Crisp storytelling and effortless collaboration.',
        name: 'Kavinda Perera',
        tagline: 'Founder, CeylonPay Digital',
        avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    },
    {
        id: 'testi-2',
        variant: 'tone-emerald',
        quote:
            'Their post-production pacing, color treatments, and sound design gave our launch campaign a cinema-grade finish. Our social reels saw 3× higher retention within the first week.',
        name: 'Sarah Jenkins',
        tagline: 'Head of Brand, Nova Systems',
        avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    },
    {
        id: 'testi-3',
        variant: 'tone-olive',
        quote:
            'Working across time zones was completely seamless. Motion Pub delivered our animated company profile ahead of schedule with sharp motion graphics that elevated our pitch.',
        name: 'Daniel Brooks',
        tagline: 'Co-Founder, Pulse Technologies',
        avatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    },
    {
        id: 'testi-4',
        variant: 'tone-lime',
        quote:
            'From script rhythm to final motion polish, the team understood our Sri Lankan and international audiences equally well. Easily our go-to partner for every promotional campaign.',
        name: 'Nadia Fernando',
        tagline: 'Marketing Director, Kandy Roasters',
        avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    },
    {
        id: 'testi-5',
        variant: 'tone-emerald',
        quote:
            'Their app promo video made complex workflows feel effortless in under 45 seconds. Clean art direction, punchy sound design, and zero friction from brief to final export.',
        name: 'Rohan De Silva',
        tagline: 'Product Lead, FinTrack App',
        avatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    },
    {
        id: 'testi-6',
        variant: 'tone-olive',
        quote:
            'Every frame felt intentional and on-brand. Motion Pub helped us refresh our entire social video identity with sleek animated visuals that instantly set us apart.',
        name: 'Amaya Wijesinghe',
        tagline: 'Creative Lead, LankaTech Studio',
        avatar:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
    },
]

function QuoteGlyph({ flipped = false, size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={flipped ? { transform: 'rotate(180deg)' } : undefined}
        >
            <path d="M10 7.5C7.6 8.6 6.2 10.6 6.1 13h3.4v6H3v-5.6C3 9.2 5.4 6.2 9.4 5l.6 2.5zm11 0c-2.4 1.1-3.8 3.1-3.9 5.5h3.4v6H14v-5.6c0-4.2 2.4-7.2 6.4-8.4l.6 2.5z" />
        </svg>
    )
}

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')
}

/**
 * Builds a single continuous SVG path for the rounded speech-bubble + downward pointer tail
 * so the frosted glass fill and 1px border wrap seamlessly with no separating seam.
 */
function buildBubblePath(w, h, { r = 14, tailX = 48, tailW = 24, tailH = 13 } = {}) {
    const pad = 0.75
    const left = pad
    const top = pad
    const right = Math.max(left + r * 2 + 2, w - pad)
    const bodyBottom = Math.max(top + r * 2 + 2, h - tailH - pad)
    const tipY = h - pad
    const half = tailW / 2
    const clampedTailX = Math.max(left + r + half + 4, Math.min(right - r - half - 4, tailX))
    const tLeft = clampedTailX - half
    const tRight = clampedTailX + half
    const tipCurve = 2.4
    const f = (n) => n.toFixed(2)

    return [
        `M ${f(left + r)} ${f(top)}`,
        `L ${f(right - r)} ${f(top)}`,
        `A ${r} ${r} 0 0 1 ${f(right)} ${f(top + r)}`,
        `L ${f(right)} ${f(bodyBottom - r)}`,
        `A ${r} ${r} 0 0 1 ${f(right - r)} ${f(bodyBottom)}`,
        `L ${f(tRight)} ${f(bodyBottom)}`,
        `L ${f(clampedTailX + tipCurve)} ${f(tipY - tipCurve)}`,
        `Q ${f(clampedTailX)} ${f(tipY)} ${f(clampedTailX - tipCurve)} ${f(tipY - tipCurve)}`,
        `L ${f(tLeft)} ${f(bodyBottom)}`,
        `L ${f(left + r)} ${f(bodyBottom)}`,
        `A ${r} ${r} 0 0 1 ${f(left)} ${f(bodyBottom - r)}`,
        `L ${f(left)} ${f(top + r)}`,
        `A ${r} ${r} 0 0 1 ${f(left + r)} ${f(top)}`,
        'Z',
    ].join(' ')
}

function GlassSpeechBubble({
    children,
    className = '',
    radius = 14,
    tailX = 48,
    tailW = 24,
    tailH = 13,
}) {
    const bubbleRef = useRef(null)
    const [size, setSize] = useState({ w: 0, h: 0 })

    useLayoutEffect(() => {
        const el = bubbleRef.current
        if (!el) return

        const measure = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w > 0 && h > 0) {
                setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
            }
        }

        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        window.addEventListener('resize', measure, { passive: true })
        return () => {
            ro.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [])

    const pathD = useMemo(() => {
        if (!size.w || !size.h) return ''
        return buildBubblePath(size.w, size.h, { r: radius, tailX, tailW, tailH })
    }, [size.w, size.h, radius, tailX, tailW, tailH])

    return (
        <div
            ref={bubbleRef}
            className={`mp-testi-bubble ${className}`.trim()}
            style={{ '--bubble-tail-h': `${tailH}px` }}
        >
            {/* Single unified frosted glass surface clipped to bubble + pointer */}
            <div
                className="mp-testi-bubble-glass"
                style={pathD ? { clipPath: `path('${pathD}')` } : undefined}
                aria-hidden="true"
            />

            {/* Single continuous 1px outline wrapping bubble + pointer seamlessly */}
            {pathD && (
                <svg
                    className="mp-testi-bubble-outline"
                    width={size.w}
                    height={size.h}
                    viewBox={`0 0 ${size.w} ${size.h}`}
                    fill="none"
                    aria-hidden="true"
                >
                    <path d={pathD} stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
                </svg>
            )}

            {children}
        </div>
    )
}

const loadCachedTestimonials = () => {
    try {
        const raw = localStorage.getItem('mp_testimonials')
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                return parsed
            }
        }
    } catch {
        // ignore invalid cache
    }
    return DEFAULT_TESTIMONIALS
}

export default function MpTestimonials() {
    const [testimonials, setTestimonials] = useState(loadCachedTestimonials)
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    )
    const [page, setPage] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(null)
    const [brokenAvatars, setBrokenAvatars] = useState({})
    const remainingMsRef = useRef(AUTO_SLIDE_MS)
    const lastPageRef = useRef(0)

    // Fetch live testimonials from backend and listen for real-time Admin updates
    useEffect(() => {
        let isMounted = true

        fetch('/api/content/testimonials')
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data?.success && Array.isArray(data.data)) {
                    setTestimonials(data.data)
                    try {
                        localStorage.setItem('mp_testimonials', JSON.stringify(data.data))
                    } catch {
                        // ignore storage errors
                    }
                }
            })
            .catch(() => {
                // Fallback silently to cached/default testimonials
            })

        const handleTestimonialsUpdated = (e) => {
            if (Array.isArray(e?.detail?.testimonials)) {
                setTestimonials(e.detail.testimonials)
            }
        }

        const handleStorage = (e) => {
            if (e.key === 'mp_testimonials' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue)
                    if (Array.isArray(parsed)) setTestimonials(parsed)
                } catch {
                    // ignore
                }
            }
        }

        window.addEventListener('mp-testimonials-updated', handleTestimonialsUpdated)
        window.addEventListener('storage', handleStorage)
        return () => {
            isMounted = false
            window.removeEventListener('mp-testimonials-updated', handleTestimonialsUpdated)
            window.removeEventListener('storage', handleStorage)
        }
    }, [])

    const isModalOpen = selectedIndex !== null && testimonials[selectedIndex] != null
    const activeTestimonial = isModalOpen ? testimonials[selectedIndex] : null

    useEffect(() => {
        if (selectedIndex !== null && selectedIndex >= testimonials.length) {
            setSelectedIndex(testimonials.length > 0 ? testimonials.length - 1 : null)
        }
    }, [selectedIndex, testimonials.length])

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const perPage = isMobile ? 1 : 2
    const totalPages = Math.max(1, Math.ceil(testimonials.length / perPage))
    const safePage = Math.min(page, totalPages - 1)

    useEffect(() => {
        if (page !== safePage) setPage(safePage)
    }, [page, safePage])

    const pages = useMemo(() => {
        const chunks = []
            for (let i = 0; i < testimonials.length; i += perPage) {
                chunks.push(testimonials.slice(i, i + perPage))
            }
            return chunks
}, [testimonials, perPage])

const handlePrev = useCallback(() => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages)
}, [totalPages])

const handleNext = useCallback(() => {
    setPage((prev) => (prev + 1) % totalPages)
}, [totalPages])

const handleModalPrev = useCallback(() => {
    if (testimonials.length === 0) return
    setSelectedIndex((prev) =>
            prev === null ? null : (prev - 1 + testimonials.length) % testimonials.length
    )
    }, [testimonials.length])

const handleModalNext = useCallback(() => {
    if (testimonials.length === 0) return
    setSelectedIndex((prev) =>
            prev === null ? null : (prev + 1) % testimonials.length
    )
    }, [testimonials.length])

const closeModal = useCallback(() => {
    setSelectedIndex(null)
}, [])

// Lock body scroll while expanded modal is open
useEffect(() => {
    if (!isModalOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
        document.body.style.overflow = prevOverflow
    }
}, [isModalOpen])

// Keyboard navigation (Escape closes modal; Left/Right navigate modal or slider)
useEffect(() => {
    const onKeyDown = (e) => {
        if (isModalOpen) {
            if (e.key === 'Escape') closeModal()
            else if (e.key === 'ArrowLeft') handleModalPrev()
            else if (e.key === 'ArrowRight') handleModalNext()
            return
        }
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
}, [isModalOpen, closeModal, handleModalPrev, handleModalNext, handlePrev, handleNext])

// Auto-advance slideshow (pauses on hover/focus or while modal is open)
useEffect(() => {
    if (lastPageRef.current !== safePage) {
        remainingMsRef.current = AUTO_SLIDE_MS
        lastPageRef.current = safePage
    }
    if (isPaused || isModalOpen || totalPages <= 1) return

    const startedAt = Date.now()
    const timer = setTimeout(() => {
        remainingMsRef.current = AUTO_SLIDE_MS
        setPage((prev) => (prev + 1) % totalPages)
    }, remainingMsRef.current)

    return () => {
        clearTimeout(timer)
        const elapsed = Date.now() - startedAt
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed)
    }
}, [safePage, isPaused, isModalOpen, totalPages])

return (
    <section className="mp-testi-section" id="testimonials" aria-label="User Testimonials">
        <div className="mp-testi-bg-glow" aria-hidden="true" />

        {/* Reusable PageHeader matching About & Services */}
        <PageHeader
            text="TESTIMONIALS"
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            }
        />

        <div className="mp-testi-container">
            {/* Centered Two-Tone Title + Subtitle */}
            <header className="mp-testi-header">
                <h1 className="mp-testi-title">
                    User <span className="mp-testi-title-accent">Testimonials</span>
                </h1>
                <p className="mp-testi-subtitle">
                    Hear what founders, marketing leaders, and creative partners across Sri Lanka and international markets say about working with Motion Pub.
                </p>
            </header>

            {/* Smooth Sliding 2-Up Unclipped Speech-Bubble Viewport */}
            <div
                className="mp-testi-stage"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
            >
                <div className="mp-testi-viewport">
                    <div
                        className="mp-testi-slider-track"
                        style={{ transform: `translate3d(-${safePage * 100}%, 0, 0)` }}
                    >
                        {pages.map((slideItems, slideIdx) => (
                            <div
                                key={`slide-${slideIdx}`}
                                className={`mp-testi-slide ${slideIdx === safePage ? 'is-active' : ''}`}
                                aria-hidden={slideIdx !== safePage}
                            >
                                <div className="mp-testi-grid" role="list">
                                    {slideItems.map((item, idxInSlide) => {
                                        const globalIndex = slideIdx * perPage + idxInSlide
                                        const showFallback = !item.avatar || brokenAvatars[item.id]
                                        return (
                                            <article
                                                key={item.id}
                                                className={`mp-testi-card ${item.variant}`}
                                                role="button"
                                                tabIndex={slideIdx === safePage ? 0 : -1}
                                                aria-label={`Read full testimonial from ${item.name}`}
                                                onClick={() => setSelectedIndex(globalIndex)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        setSelectedIndex(globalIndex)
                                                    }
                                                }}
                                            >
                                                {/* Unified Glass Speech-Bubble with Floating Quote Badges */}
                                                <GlassSpeechBubble radius={14} tailX={48} tailW={24} tailH={13}>
                                                    <span className="mp-testi-quote-badge open" aria-hidden="true">
                                                        <QuoteGlyph />
                                                    </span>

                                                    <p className="mp-testi-quote-text">{item.quote}</p>

                                                    <span className="mp-testi-quote-badge close" aria-hidden="true">
                                                        <QuoteGlyph flipped />
                                                    </span>
                                                </GlassSpeechBubble>

                                                {/* Author Profile Below Pointer Tail */}
                                                <div className="mp-testi-author">
                                                    <div className="mp-testi-avatar-ring">
                                                        {showFallback ? (
                                                            <span className="mp-testi-avatar-initials">
                                                                {getInitials(item.name)}
                                                            </span>
                                                        ) : (
                                                            <img
                                                                src={item.avatar}
                                                                alt={item.name}
                                                                className="mp-testi-avatar-img"
                                                                loading="lazy"
                                                                onError={() =>
                                                                    setBrokenAvatars((prev) => ({ ...prev, [item.id]: true }))
                                                                }
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="mp-testi-author-meta">
                                                        <h2 className="mp-testi-author-name">{item.name}</h2>
                                                        <p className="mp-testi-author-tagline">{item.tagline}</p>
                                                    </div>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sleek Controls Row (Pagination Dots + Prev/Next Arrows) */}
            <div
                className="mp-testi-controls"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="mp-testi-dots" role="tablist" aria-label="Testimonial pages">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                        const isActive = safePage === idx
                        return (
                            <button
                                key={`page-${idx}`}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`View testimonials page ${idx + 1}`}
                                className={`mp-testi-dot ${isActive ? 'active' : ''}`}
                                onClick={() => setPage(idx)}
                            >
                                {isActive && (
                                    <span
                                        key={`progress-${safePage}`}
                                        className={`mp-testi-dot-progress ${isPaused || isModalOpen ? 'is-paused' : ''}`}
                                        style={{ animationDuration: `${AUTO_SLIDE_MS}ms` }}
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="mp-testi-nav-arrows">
                    <button
                        type="button"
                        className="mp-testi-arrow-btn"
                        onClick={handlePrev}
                        aria-label="Previous testimonials"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="mp-testi-arrow-btn"
                        onClick={handleNext}
                        aria-label="Next testimonials"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        {/* Expanded Big-Screen Testimonial Spotlight Popup */}
        {isModalOpen && activeTestimonial &&
            createPortal(
                <div
                    className="mp-testi-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mp-testi-modal-author"
                    onClick={closeModal}
                >
                    <div
                        className={`mp-testi-modal-panel ${activeTestimonial.variant}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="mp-testi-modal-close"
                            onClick={closeModal}
                            aria-label="Close testimonial view"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Clean Borderless Editorial Spotlight Quote Stage */}
                        <div key={activeTestimonial.id} className="mp-testi-modal-content">
                            <div className="mp-testi-modal-quote-stage">
                                <span className="mp-testi-quote-badge open mp-testi-modal-quote-badge" aria-hidden="true">
                                    <QuoteGlyph size={24} />
                                </span>

                                <p className="mp-testi-modal-quote-text">{activeTestimonial.quote}</p>

                                <span className="mp-testi-quote-badge close mp-testi-modal-quote-badge" aria-hidden="true">
                                    <QuoteGlyph flipped size={24} />
                                </span>
                            </div>

                            {/* Enlarged Author Profile + Modal Navigation */}
                            <div className="mp-testi-modal-footer">
                                <div className="mp-testi-author mp-testi-modal-author">
                                    <div className="mp-testi-avatar-ring mp-testi-modal-avatar">
                                        {!activeTestimonial.avatar || brokenAvatars[activeTestimonial.id] ? (
                                            <span className="mp-testi-avatar-initials">
                                                {getInitials(activeTestimonial.name)}
                                            </span>
                                        ) : (
                                            <img
                                                src={activeTestimonial.avatar}
                                                alt={activeTestimonial.name}
                                                className="mp-testi-avatar-img"
                                                onError={() =>
                                                    setBrokenAvatars((prev) => ({ ...prev, [activeTestimonial.id]: true }))
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="mp-testi-author-meta">
                                        <h2 id="mp-testi-modal-author" className="mp-testi-modal-author-name">
                                            {activeTestimonial.name}
                                        </h2>
                                        <p className="mp-testi-modal-author-tagline">
                                            {activeTestimonial.tagline}
                                        </p>
                                    </div>
                                </div>

                                <div className="mp-testi-modal-nav">
                                    <span className="mp-testi-modal-counter">
                                        {String(selectedIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                                    </span>
                                    <button
                                        type="button"
                                        className="mp-testi-arrow-btn"
                                        onClick={handleModalPrev}
                                        aria-label="Previous testimonial"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="mp-testi-arrow-btn"
                                        onClick={handleModalNext}
                                        aria-label="Next testimonial"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
    </section>
)
}
