import { useState, useRef } from 'react'
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
    const rotateX = -((y - centerY) / centerY) * 14
    const rotateY = ((x - centerX) / centerX) * 14
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
        {/* Ambient Glow */}
        <div className="art-glow-core"></div>
        <div className="art-glow-ring-outer"></div>
        <div className="art-glow-ring-inner"></div>

        {/* Floating Particles */}
        <div className="art-particles">
          <span className="art-particle art-particle-1"></span>
          <span className="art-particle art-particle-2"></span>
          <span className="art-particle art-particle-3"></span>
          <span className="art-particle art-particle-4"></span>
        </div>

        {/* 3D Interactive Container */}
        <div
          className="art-card-container"
          style={{
            transform: isHovered
              ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.06, 1.06, 1.06)`
              : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          }}
        >
          <div className="art-floating-layer">
            <div className="art-svg-stage">
              <svg
                className="art-svg-canvas"
                viewBox="0 0 400 360"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e1e1e" />
                    <stop offset="100%" stopColor="#111111" />
                  </linearGradient>
                  <linearGradient id="monitorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2a2a2a" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                  </linearGradient>
                  <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8FF00" />
                    <stop offset="50%" stopColor="#94E000" />
                    <stop offset="100%" stopColor="#6BAA00" />
                  </linearGradient>
                  <linearGradient id="clipGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94E000" />
                    <stop offset="100%" stopColor="#6BAA00" />
                  </linearGradient>
                  <linearGradient id="clipGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5a9e18" />
                    <stop offset="100%" stopColor="#3d7010" />
                  </linearGradient>
                  <linearGradient id="clipGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B8FF00" />
                    <stop offset="100%" stopColor="#94E000" />
                  </linearGradient>
                  <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94E000" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#B8FF00" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#94E000" stopOpacity="0.6" />
                  </linearGradient>
                  <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#94E000" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="3" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                  <clipPath id="screenClip">
                    <rect x="60" y="42" width="280" height="168" rx="6" />
                  </clipPath>
                  <clipPath id="timelineClip">
                    <rect x="60" y="250" width="280" height="55" rx="0" />
                  </clipPath>
                </defs>

                {/* ===== MONITOR FRAME ===== */}
                <g className="svg-monitor" filter="url(#softShadow)">
                  {/* Monitor Outer Shell */}
                  <rect x="48" y="30" width="304" height="195" rx="14" fill="url(#monitorGrad)" stroke="#3a3a3a" strokeWidth="2" />
                  {/* Monitor Bezel Highlight */}
                  <rect x="48" y="30" width="304" height="195" rx="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                  {/* Screen Area */}
                  <rect x="60" y="42" width="280" height="168" rx="6" fill="url(#screenGrad)" />

                  {/* ===== SCREEN CONTENT (Video Preview) ===== */}
                  <g clipPath="url(#screenClip)">
                    {/* Cinematic gradient backdrop */}
                    <rect x="60" y="42" width="280" height="168" fill="#0a0f05" />
                    <rect x="60" y="42" width="280" height="168" fill="url(#accentGrad)" opacity="0.06" />

                    {/* Film grain / noise overlay (subtle) */}
                    <rect x="60" y="42" width="280" height="168" fill="url(#screenGrad)" opacity="0.3" />

                    {/* Simulated video scene: landscape shapes */}
                    <rect x="60" y="155" width="280" height="55" fill="#0f1a06" opacity="0.8" />
                    <ellipse cx="130" cy="100" rx="35" ry="35" fill="#94E000" opacity="0.07" />
                    <ellipse cx="270" cy="85" rx="50" ry="30" fill="#94E000" opacity="0.05" />

                    {/* Cinematic letterbox bars */}
                    <rect x="60" y="42" width="280" height="18" fill="#000" opacity="0.7" />
                    <rect x="60" y="192" width="280" height="18" fill="#000" opacity="0.7" />

                    {/* Timecode overlay */}
                    <text className="svg-timecode" x="78" y="58" fontSize="8" fontFamily="monospace" fontWeight="600" fill="#94E000" opacity="0.8">
                      00:01:24:16
                    </text>
                    <text x="290" y="58" fontSize="7" fontFamily="monospace" fill="#666" textAnchor="end">
                      REC ●
                    </text>
                    <circle className="svg-rec-dot" cx="296" cy="55" r="3" fill="#ff3333" opacity="0.9" />

                    {/* Center Play Overlay */}
                    <g className="svg-play-overlay">
                      <circle cx="200" cy="126" r="22" fill="rgba(0,0,0,0.5)" stroke="#94E000" strokeWidth="1.5" />
                      <polygon points="194,116 194,136 212,126" fill="#94E000" />
                    </g>
                  </g>

                  {/* Screen bezel inner stroke */}
                  <rect x="60" y="42" width="280" height="168" rx="6" fill="none" stroke="#94E000" strokeWidth="0.5" opacity="0.3" />

                  {/* Monitor stand */}
                  <path d="M170 225 L180 240 L220 240 L230 225" fill="#222" stroke="#333" strokeWidth="1.5" />
                  <rect x="165" y="240" width="70" height="6" rx="3" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1" />

                  {/* Status LED */}
                  <circle className="svg-status-led" cx="200" cy="218" r="2.5" fill="#94E000" />
                </g>

                {/* ===== EDITING TIMELINE PANEL ===== */}
                <g className="svg-timeline-panel">
                  {/* Timeline Background */}
                  <rect x="48" y="255" width="304" height="70" rx="10" fill="#181818" stroke="#2a2a2a" strokeWidth="1.5" />

                  {/* Track Labels */}
                  <text x="58" y="274" fontSize="6.5" fontFamily="system-ui, sans-serif" fontWeight="600" fill="#555">V1</text>
                  <text x="58" y="291" fontSize="6.5" fontFamily="system-ui, sans-serif" fontWeight="600" fill="#555">V2</text>
                  <text x="58" y="308" fontSize="6.5" fontFamily="system-ui, sans-serif" fontWeight="600" fill="#555">A1</text>

                  {/* Track Lines */}
                  <line x1="75" y1="278" x2="340" y2="278" stroke="#222" strokeWidth="0.5" />
                  <line x1="75" y1="295" x2="340" y2="295" stroke="#222" strokeWidth="0.5" />
                  <line x1="75" y1="312" x2="340" y2="312" stroke="#222" strokeWidth="0.5" />

                  {/* ===== VIDEO TRACK 1: Clips ===== */}
                  <rect className="svg-clip svg-clip-1" x="78" y="267" width="65" height="11" rx="3" fill="url(#clipGrad1)" opacity="0.9" />
                  <rect className="svg-clip svg-clip-2" x="148" y="267" width="45" height="11" rx="3" fill="url(#clipGrad2)" opacity="0.85" />
                  <rect className="svg-clip svg-clip-3" x="198" y="267" width="80" height="11" rx="3" fill="url(#clipGrad1)" opacity="0.9" />
                  <rect className="svg-clip svg-clip-4" x="283" y="267" width="50" height="11" rx="3" fill="url(#clipGrad3)" opacity="0.8" />

                  {/* Clip thumbnails (tiny stripes representing frames) */}
                  <g opacity="0.3">
                    <line x1="92" y1="268" x2="92" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="105" y1="268" x2="105" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="118" y1="268" x2="118" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="131" y1="268" x2="131" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="210" y1="268" x2="210" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="225" y1="268" x2="225" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="240" y1="268" x2="240" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="255" y1="268" x2="255" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                    <line x1="270" y1="268" x2="270" y2="277" stroke="#1a3000" strokeWidth="0.5" />
                  </g>

                  {/* ===== VIDEO TRACK 2: Clips ===== */}
                  <rect className="svg-clip svg-clip-5" x="90" y="284" width="55" height="11" rx="3" fill="url(#clipGrad2)" opacity="0.75" />
                  <rect className="svg-clip svg-clip-6" x="155" y="284" width="95" height="11" rx="3" fill="url(#clipGrad3)" opacity="0.7" />
                  <rect className="svg-clip svg-clip-7" x="260" y="284" width="70" height="11" rx="3" fill="url(#clipGrad2)" opacity="0.75" />

                  {/* ===== AUDIO TRACK: Waveform ===== */}
                  <g className="svg-audio-wave" clipPath="url(#timelineClip)">
                    <rect x="78" y="301" width="255" height="11" rx="3" fill="#1a2a08" opacity="0.5" />
                    {/* Audio waveform bars */}
                    <g className="svg-waveform-bars">
                      <rect x="82"  y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="86"  y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="90"  y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="94"  y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="98"  y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="102" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="106" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="110" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="114" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="118" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="122" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="126" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="130" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="134" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="138" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="142" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="146" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="150" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="154" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.85" />
                      <rect x="158" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="162" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="166" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="170" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="174" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="178" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="182" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="186" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="190" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="194" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="198" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="202" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.85" />
                      <rect x="206" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="210" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="214" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="218" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="222" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="226" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="230" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="234" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="238" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="242" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="246" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="250" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.85" />
                      <rect x="254" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="258" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.8" />
                      <rect x="262" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="266" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="270" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="274" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="278" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="282" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="286" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="290" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="294" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                      <rect x="298" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.85" />
                      <rect x="302" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.4" />
                      <rect x="306" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="310" y="301" width="2" height="11" rx="1" fill="url(#waveGrad)" opacity="1" />
                      <rect x="314" y="304" width="2" height="5" rx="1" fill="url(#waveGrad)" opacity="0.6" />
                      <rect x="318" y="302" width="2" height="9" rx="1" fill="url(#waveGrad)" opacity="0.9" />
                      <rect x="322" y="303" width="2" height="7" rx="1" fill="url(#waveGrad)" opacity="0.7" />
                      <rect x="326" y="305" width="2" height="3" rx="1" fill="url(#waveGrad)" opacity="0.5" />
                    </g>
                  </g>

                  {/* ===== PLAYHEAD ===== */}
                  <g className="svg-playhead">
                    <rect x="0" y="260" width="2" height="60" rx="1" fill="#94E000" />
                    <polygon points="-4,258 4,258 0,263" fill="#94E000" />
                    {/* Playhead glow */}
                    <rect x="-1" y="260" width="4" height="60" rx="2" fill="#94E000" opacity="0.3" filter="url(#neonGlow)" />
                  </g>

                  {/* Neon border glow */}
                  <rect x="48" y="255" width="304" height="70" rx="10" fill="none" stroke="#94E000" strokeWidth="0.5" opacity="0.2" filter="url(#neonGlow)" />
                </g>

                {/* ===== FILM STRIP ACCENT (Left Side) ===== */}
                <g className="svg-filmstrip" opacity="0.5">
                  <rect x="20" y="50" width="18" height="175" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
                  {/* Sprocket holes */}
                  <rect x="23" y="58"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="72"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="86"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="100" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="114" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="128" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="142" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="156" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="170" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="184" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="23" y="198" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="58"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="72"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="86"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="100" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="114" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="128" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="142" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="156" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="170" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="184" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="31" y="198" width="4" height="6" rx="1" fill="#0a0a0a" />
                  {/* Frame previews */}
                  <rect x="24" y="64"  width="10" height="6" rx="1" fill="#94E000" opacity="0.1" />
                  <rect x="24" y="92"  width="10" height="6" rx="1" fill="#94E000" opacity="0.15" />
                  <rect x="24" y="120" width="10" height="6" rx="1" fill="#94E000" opacity="0.1" />
                  <rect x="24" y="148" width="10" height="6" rx="1" fill="#94E000" opacity="0.12" />
                  <rect x="24" y="176" width="10" height="6" rx="1" fill="#94E000" opacity="0.15" />
                </g>

                {/* ===== FILM STRIP (Right Side) ===== */}
                <g className="svg-filmstrip-right" opacity="0.4">
                  <rect x="362" y="65" width="18" height="170" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
                  <rect x="365" y="73"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="87"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="101" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="115" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="129" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="143" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="157" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="171" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="185" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="365" y="199" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="73"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="87"  width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="101" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="115" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="129" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="143" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="157" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="171" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="185" width="4" height="6" rx="1" fill="#0a0a0a" />
                  <rect x="373" y="199" width="4" height="6" rx="1" fill="#0a0a0a" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
