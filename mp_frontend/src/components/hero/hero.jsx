import { useState, useEffect, useRef } from 'react'
import ThreeDArt from '../3dart/3dart'
import './hero.css'

export default function Hero() {
  const fullText = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling."
  const [displayedText, setDisplayedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef(null)

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
    }, 40)

    return () => clearInterval(timer)
  }, [fullText])

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
            <ThreeDArt />
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
