import { useState, useEffect, useRef } from 'react'
import defaultVideo from '../../assets/videos/default.mp4'
import './hero.css'

const LEGACY_HERO_TITLE = "We Create Videos That Make Brands Stand Out."
const LEGACY_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling."
const DEFAULT_HERO_TITLE = "We make videos that\nMake Brands Standout"
const DEFAULT_HERO_PARAGRAPH = "Powerful video content for businesses and personal brands ready to capture attention, build influence, and grow."

const resolveHeroTitle = (text) => {
  const trimmed = (text || '').trim()
  if (!trimmed || trimmed === LEGACY_HERO_TITLE) {
    return DEFAULT_HERO_TITLE
  }
  return trimmed
}

const resolveHeroParagraph = (text) => {
  const trimmed = (text || '').trim()
  if (!trimmed || trimmed === LEGACY_HERO_TEXT) {
    return DEFAULT_HERO_PARAGRAPH
  }
  return trimmed
}

export default function Hero() {
  const [title, setTitle] = useState(() => {
    return resolveHeroTitle(localStorage.getItem('mp_hero_title'))
  })
  const [paragraph, setParagraph] = useState(() => {
    return resolveHeroParagraph(
      localStorage.getItem('mp_hero_paragraph') || localStorage.getItem('mp_hero_text')
    )
  })
  const [videoUrl, setVideoUrl] = useState(() => {
    return localStorage.getItem('mp_hero_video') || null
  })
  const [mediaType, setMediaType] = useState(() => {
    return localStorage.getItem('mp_hero_media_type') || 'video'
  })

  const videoRef = useRef(null)

  const activeVideo = videoUrl || defaultVideo
  const isImageBackground = Boolean(
    videoUrl && (mediaType === 'image' || /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(videoUrl))
  )

  // Sync with MongoDB backend and window custom event
  useEffect(() => {
    let isMounted = true

    // Fetch latest hero title, paragraph and background media from database
    fetch('/api/content/hero')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.success) {
          if (data.title) {
            const nextTitle = resolveHeroTitle(data.title)
            setTitle(nextTitle)
            localStorage.setItem('mp_hero_title', nextTitle)
          }
          const incomingParagraph = data.paragraph || data.fullText
          if (incomingParagraph) {
            const nextParagraph = resolveHeroParagraph(incomingParagraph)
            setParagraph(nextParagraph)
            if (incomingParagraph.trim() !== LEGACY_HERO_TEXT) {
              localStorage.setItem('mp_hero_paragraph', nextParagraph)
              localStorage.setItem('mp_hero_text', nextParagraph)
            }
          }
          const incomingType = data.mediaType === 'image' ? 'image' : 'video'
          if (data.videoUrl) {
            setVideoUrl(data.videoUrl)
            setMediaType(incomingType)
            localStorage.setItem('mp_hero_video', data.videoUrl)
            localStorage.setItem('mp_hero_media_type', incomingType)
          } else {
            setVideoUrl(null)
            setMediaType('video')
            localStorage.removeItem('mp_hero_video')
            localStorage.removeItem('mp_hero_media_type')
          }
        }
      })
      .catch(() => {
        // Fallback silently to current text/video
      })

    // Listen to real-time updates from Admin Dashboard (same window and cross-tab)
    const handleUpdate = (e) => {
      if (e?.detail?.title !== undefined) {
        const nextTitle = resolveHeroTitle(e.detail.title)
        setTitle(nextTitle)
        localStorage.setItem('mp_hero_title', nextTitle)
      }
      const nextRawParagraph = e?.detail?.paragraph ?? e?.detail?.fullText
      if (nextRawParagraph !== undefined) {
        const nextParagraph = resolveHeroParagraph(nextRawParagraph)
        setParagraph(nextParagraph)
        localStorage.setItem('mp_hero_paragraph', nextParagraph)
        localStorage.setItem('mp_hero_text', nextParagraph)
      }
    }

    const handleVideoUpdate = (e) => {
      const newVideo = e?.detail?.videoUrl || null
      const newType = e?.detail?.mediaType === 'image' ? 'image' : 'video'
      setVideoUrl(newVideo)
      setMediaType(newVideo ? newType : 'video')
      if (newVideo) {
        localStorage.setItem('mp_hero_video', newVideo)
        localStorage.setItem('mp_hero_media_type', newType)
      } else {
        localStorage.removeItem('mp_hero_video')
        localStorage.removeItem('mp_hero_media_type')
      }
    }

    const handleStorage = (e) => {
      if (e.key === 'mp_hero_title') {
        setTitle(resolveHeroTitle(e.newValue))
      }
      if (e.key === 'mp_hero_paragraph' || e.key === 'mp_hero_text') {
        setParagraph(resolveHeroParagraph(e.newValue))
      }
      if (e.key === 'mp_hero_video') {
        setVideoUrl(e.newValue || null)
      }
      if (e.key === 'mp_hero_media_type') {
        setMediaType(e.newValue === 'image' ? 'image' : 'video')
      }
    }

    window.addEventListener('hero-text-updated', handleUpdate)
    window.addEventListener('hero-video-updated', handleVideoUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      isMounted = false
      window.removeEventListener('hero-text-updated', handleUpdate)
      window.removeEventListener('hero-video-updated', handleVideoUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Ensure new background video autoplays cleanly when video source changes
  useEffect(() => {
    if (!isImageBackground && videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }
  }, [activeVideo, isImageBackground])

  const handleScrollToWorks = (e) => {
    e.preventDefault()
    const el = document.getElementById('works')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const titleLines = title.split(/\r?\n/).filter((line) => line.trim().length > 0)

  return (
    <section className="mp-hero-wrapper" id="home">
      {/* Full-Bleed Background Video / Image Layer */}
      <div className="mp-hero-video-bg" aria-hidden="true">
        {isImageBackground ? (
          <img
            key={videoUrl}
            src={videoUrl}
            alt=""
            className="mp-hero-bg-video"
          />
        ) : (
          <video
            ref={videoRef}
            key={activeVideo}
            src={activeVideo}
            className="mp-hero-bg-video"
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="mp-hero-video-scrim" />
        <div className="mp-hero-video-vignette" />
        <div className="mp-hero-orb mp-hero-orb-1" />
      </div>

      {/* Left-Aligned Editorial Content Container */}
      <div className="mp-hero-inner">
        <div className="mp-hero-editorial">
          {/* Main Left-Aligned Headline */}
          <h1 className="mp-hero-headline">
            {titleLines.map((line, idx) => (
              <span
                key={`${idx}-${line}`}
                className="mp-hero-headline-line"
                style={{ animationDelay: `${0.1 + idx * 0.14}s` }}
              >
                {line}
              </span>
            ))}
          </h1>

          {/* Supporting Paragraph */}
          <p className="mp-hero-subtext">
            {paragraph}
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="mp-hero-cta-row">
            <a
              href="#contact"
              className="mp-hero-cta-btn"
            >
              <span>Let&apos;s Work Together</span>
              <svg
                className="mp-hero-cta-arrow"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>

            <a
              href="#works"
              onClick={handleScrollToWorks}
              className="mp-hero-text-btn"
            >
              <span>Explore Our Work</span>
              <svg
                className="mp-hero-cta-arrow"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
      </div>
    </section>
  )
}
