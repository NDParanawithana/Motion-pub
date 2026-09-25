import { useState, useRef } from 'react'
import crowPortrait from '../../assets/images/crow_portrait.jpg'
import timelinePreview from '../../assets/images/timeline_preview.jpg'
import './3dart.css'

export default function ThreeDArt() {
  const sceneRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!sceneRef.current) return
    const rect = sceneRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = -((y - centerY) / centerY) * 12
    const rotateY = ((x - centerX) / centerX) * 12
    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div className="three-d-art-wrapper">
      <div
        ref={sceneRef}
        className="three-d-art-scene"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >


        {/* 3D Interactive Card Stack Container */}
        <div
          className="art-card-container"
          style={{
            transform: isHovered
              ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.03, 1.03, 1.03)`
              : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          }}
        >
          <div className="art-floating-layer">
            {/* TOP CARD: Raven in Trench Coat */}
            <div className="art-card art-card-top">
              <div className="art-card-border-glow"></div>
              <div className="art-card-content">
                <img
                  src={crowPortrait}
                  alt="Cinematic Raven in Trench Coat"
                  className="art-card-img"
                  loading="eager"
                />
                {/* Subtle Glass / Sheen Overlay */}
                <div className="art-card-sheen"></div>
              </div>
            </div>

            {/* BOTTOM CARD: Video Editing Timeline */}
            <div className="art-card art-card-bottom">
              <div className="art-card-border-glow"></div>
              <div className="art-card-content">
                <img
                  src={timelinePreview}
                  alt="Video Editing Timeline"
                  className="art-card-img art-card-img-timeline"
                  loading="eager"
                />

                {/* Animated Vertical Playhead Overlay */}
                <div className="art-timeline-playhead">
                  <div className="art-playhead-needle"></div>
                  <div className="art-playhead-cap"></div>
                </div>

                {/* Dynamic Audio Level Pulse Accent */}
                <div className="art-timeline-scanline"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
