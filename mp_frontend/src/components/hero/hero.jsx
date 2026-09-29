import { useState, useEffect, useRef } from 'react'
import ThreeDArt from '../3dart/3dart'
import './hero.css'

const DEFAULT_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling."

export default function Hero() {
  const [fullText, setFullText] = useState(() => {
    return localStorage.getItem('mp_hero_text') || DEFAULT_HERO_TEXT
  })
  const [videoUrl, setVideoUrl] = useState(() => {
    return localStorage.getItem('mp_hero_video') || null
  })
  const [typingSpeed, setTypingSpeed] = useState(() => {
    const saved = localStorage.getItem('mp_typing_speed')
    return saved ? parseInt(saved, 10) : 40
  })
  const [displayedText, setDisplayedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef(null)

  // Sync with MongoDB backend and window custom event
  useEffect(() => {
    let isMounted = true

    // Fetch latest hero text and video from database
    fetch('/api/content/hero')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.success) {
          if (data.fullText) {
            setFullText(data.fullText)
            localStorage.setItem('mp_hero_text', data.fullText)
          }
          if (data.videoUrl) {
            setVideoUrl(data.videoUrl)
            localStorage.setItem('mp_hero_video', data.videoUrl)
          } else {
            setVideoUrl(null)
            localStorage.removeItem('mp_hero_video')
          }
        }
      })
      .catch(() => {
        // Fallback silently to current text/video
      })

    // Listen to real-time updates from Admin Dashboard (same window and cross-tab)
    const handleUpdate = (e) => {
      if (e?.detail?.fullText) {
        setFullText(e.detail.fullText)
        localStorage.setItem('mp_hero_text', e.detail.fullText)
      }
    }

    const handleVideoUpdate = (e) => {
      const newVideo = e?.detail?.videoUrl || null
      setVideoUrl(newVideo)
      if (newVideo) {
        localStorage.setItem('mp_hero_video', newVideo)
      } else {
        localStorage.removeItem('mp_hero_video')
      }
    }

    const handleStorage = (e) => {
      if (e.key === 'mp_hero_text' && e.newValue) {
        setFullText(e.newValue)
      }
      if (e.key === 'mp_hero_video') {
        setVideoUrl(e.newValue || null)
      }
      if (e.key === 'mp_typing_speed' && e.newValue) {
        setTypingSpeed(parseInt(e.newValue, 10))
      }
    }

    const handleSpeedUpdate = (e) => {
      if (e?.detail?.speed) {
        setTypingSpeed(e.detail.speed)
      }
    }

    window.addEventListener('hero-text-updated', handleUpdate)
    window.addEventListener('hero-video-updated', handleVideoUpdate)
    window.addEventListener('hero-speed-updated', handleSpeedUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      isMounted = false
      window.removeEventListener('hero-text-updated', handleUpdate)
      window.removeEventListener('hero-video-updated', handleVideoUpdate)
      window.removeEventListener('hero-speed-updated', handleSpeedUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Typing animation effect
  useEffect(() => {
    let index = 0
    setDisplayedText('')
    setIsTypingComplete(false)

    const timer = setInterval(() => {
      index++
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index))
      } else {
        setIsTypingComplete(true)
        clearInterval(timer)
      }
    }, typingSpeed)

    return () => clearInterval(timer)
  }, [fullText, typingSpeed])

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x: x * 12, y: y * 12 })
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePos({ x: 0, y: 0 })
  }

  // Render text with styled 'Motion Pub' highlight
  const renderTypingContent = () => {
    const brandName = 'Motion Pub'
    if (displayedText.length <= brandName.length) {
      return <span className="mp-brand-highlight">{displayedText}</span>
    }
    return (
      <>
        <span className="mp-brand-highlight">{brandName}</span>
        {displayedText.slice(brandName.length)}
      </>
    )
  }

  return (
    <section className="mp-hero-wrapper" id="home">
      {/* Subtle Ambient Background */}
      <div className="mp-hero-bg">
        <div className="mp-hero-orb mp-hero-orb-1"></div>
      </div>

      <div className="mp-hero-content-stack">
        {/* Main 2-Column Row: Left Typing Text & Right 3D Art */}
        <div className="mp-hero-main-row">
          {/* Left Column: Typing Animation */}
          <div className="mp-hero-left">
            <div className="mp-typing-box">
              <p className="mp-typing-text">
                {renderTypingContent()}
                <span className={`mp-typing-cursor ${isTypingComplete ? 'idle' : ''}`}>|</span>
              </p>
            </div>
          </div>

          {/* Right Column: 3D Art */}
          <div className="mp-hero-right">
            <ThreeDArt videoSrc={videoUrl} />
          </div>
        </div>

        {/* Animated Three Words: Amplify | Engage | Brand */}
        <div
          ref={containerRef}
          className="mp-words-container"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: isHovered
              ? `perspective(800px) rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)`
              : 'none',
          }}
        >
          <div className="mp-words-row">
            <span className="mp-word mp-word-amplify">Amplify</span>
            <span className="mp-divider">|</span>
            <span className="mp-word mp-word-engage">Engage</span>
            <span className="mp-divider">|</span>
            <span className="mp-word mp-word-brand">Brand</span>
          </div>
        </div>
      </div>
    </section>
  )
}
