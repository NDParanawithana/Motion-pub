import React from 'react'
import './about.css'

export default function About() {
  const highlights = [
    {
      title: 'Animation & Motion Graphics',
      description:
        'Bringing ideas to life through captivating 2D & 3D animation, dynamic kinetic typography, and visual effects that give brands a distinctive digital identity.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      ),
    },
    {
      title: 'Professional Video Editing',
      description:
        'Transforming recorded footage through precision cutting, rhythm, color grading, sound design, and narrative pacing to create compelling cinematic experiences.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="10 8 16 12 10 16 10 8"></polygon>
        </svg>
      ),
    },
    {
      title: 'Production to Final Delivery',
      description:
        'We handle the full creative process from concept development and storyboard planning to high-resolution master rendering and multi-platform deployment.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
    },
  ]

  const stats = [
    { value: 'Sri Lanka', label: 'Agency Roots' },
    { value: 'End-to-End', label: 'Production Process' },
    { value: 'Motion & 3D', label: 'Creative Specialization' },
    { value: '100%', label: 'Custom Visual Content' },
  ]

  return (
    <section className="mp-about-section section" id="about">
      {/* Ambient background glow */}
      <div className="mp-about-bg-glow" />

      <div className="mp-about-container">
        {/* Section Header */}
        <div className="mp-about-header">
          <div className="mp-about-badge">
            <span className="mp-about-badge-dot" />
            <span>About Motion Pub</span>
          </div>

          <h2 className="mp-about-title">
            We Turn Ideas Into <span className="highlight">Visual Stories</span>
          </h2>

          <p className="mp-about-lead">
            Motion Pub is a Sri Lankan video production and post-production agency focused on creating powerful visual content that helps brands stand out.
          </p>

          <p className="mp-about-subtext">
            From bringing ideas to life through animation and motion graphics to transforming recorded footage through professional editing, we handle the creative process from production to final delivery.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mp-about-grid">
          {highlights.map((item, index) => (
            <div className="mp-about-card" key={index}>
              <div className="mp-about-card-glow" />
              <div className="mp-card-icon-wrap">{item.icon}</div>
              <h3 className="mp-card-title">{item.title}</h3>
              <p className="mp-card-description">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Stats & Capability Highlights Bar */}
        <div className="mp-about-stats-bar">
          {stats.map((stat, index) => (
            <div className="mp-stat-item" key={index}>
              <span className="mp-stat-val">{stat.value}</span>
              <span className="mp-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
