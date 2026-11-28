import { useEffect, useRef, useState } from 'react'
import pubPulseVideo from '../../assets/videos/pub pulse video.mp4'
import './pubPulsePage.css'

export default function PubPulsePage() {
  const videoRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = true
    vid.play().catch(() => {})
  }, [])

  const toggleMute = () => {
    const vid = videoRef.current
    if (!vid) return
    const nextMuted = !isMuted
    vid.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play().catch(() => {})
      setIsPaused(false)
    } else {
      vid.pause()
      setIsPaused(true)
    }
  }

  return (
    <div className="mp-pubpulse-site" id="pubpulse">
      {/* Full-Bleed PubPulse Video Hero Section */}
      <section className="mp-pubpulse-hero" aria-label="PubPulse Hero">
        {/* Background Video Layer */}
        <div className="mp-pubpulse-video-bg" aria-hidden="true">
          <video
            ref={videoRef}
            src={pubPulseVideo}
            className="mp-pubpulse-bg-video"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="mp-pubpulse-video-scrim" />
          <div className="mp-pubpulse-video-vignette" />
          <div className="mp-pubpulse-hero-orb" />
        </div>

        {/* Left-Aligned PubPulse Hero Editorial Content */}
        <div className="mp-pubpulse-hero-inner">
          <div className="mp-pubpulse-hero-editorial">
            <h1 className="mp-pubpulse-hero-headline">
              <span className="mp-pubpulse-headline-line" style={{ animationDelay: '0.08s' }}>
                The new content creation arm
              </span>
              <span className="mp-pubpulse-headline-line accent" style={{ animationDelay: '0.2s' }}>
                powered by Motion Pub.
              </span>
            </h1>

            <p className="mp-pubpulse-hero-subtext">
              Built to capture moments, create conversations, and bring ideas to life — From capturing the first frame to crafting the final story, we bring ideas to life through creative mobile filmmaking.
            </p>

            <div className="mp-pubpulse-hero-actions">
              <a
                href="#contact"
                className="mp-pubpulse-cta-btn"
                onClick={() => {
                  try {
                    sessionStorage.setItem('mp_preselected_service', 'PubPulse')
                    sessionStorage.setItem('mp_open_booking_modal', 'true')
                  } catch {
                    // ignore storage errors
                  }
                }}
              >
                <span>Start a PubPulse Project</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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

        {/* Subtle Bottom-Right Video Controls */}
        <div className="mp-pubpulse-video-controls">
          <button
            type="button"
            className="mp-pubpulse-vid-btn"
            onClick={togglePlay}
            aria-label={isPaused ? 'Play background video' : 'Pause background video'}
            title={isPaused ? 'Play video' : 'Pause video'}
          >
            {isPaused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="mp-pubpulse-vid-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute background video' : 'Mute background video'}
            title={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
