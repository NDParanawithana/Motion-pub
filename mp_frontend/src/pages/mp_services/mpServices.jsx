import { useState } from 'react'
import PageHeader from '../../components/pageHeader/pageHeader'
import animatedVideoImg from '../../assets/services/animated-video-production.jpg'
import postProductionImg from '../../assets/services/post-production-editing.jpg'
import brandStorytellingImg from '../../assets/services/brand-storytelling.jpg'
import './mpServices.css'

const SERVICES = [
  {
    id: 'animated-video',
    variant: 'tone-lime',
    title: 'Animated Video\nProduction',
    badge: '2D Animation · Inquire',
    image: animatedVideoImg,
    imageAlt: 'Motion Pub 2D animated video production workstation',
    includes: [
      {
        label: '2D Animated Commercials',
        detail:
          'Custom-crafted 2D animated commercial spots designed to stop scrolls and communicate your offer in seconds.',
      },
      {
        label: 'Product, Service & App Promos',
        detail:
          'Engaging promotional videos that showcase products, digital services, and app features with crystal clarity.',
      },
      {
        label: 'Animated Company Profile Videos',
        detail:
          'Memorable animated brand introductions that present your company story, mission, and value to clients and investors.',
      },
    ],
  },
  {
    id: 'post-production',
    variant: 'tone-charcoal',
    title: 'Post-Production\n& Editing',
    badge: 'Editing & Motion · Inquire',
    image: postProductionImg,
    imageAlt: 'Motion Pub post-production editing and color grading suite',
    includes: [
      {
        label: 'Video Editing & Motion Graphics',
        detail:
          'Sharp narrative pacing, seamless cuts, custom kinetic typography, lower-thirds, and dynamic motion graphics.',
      },
      {
        label: 'Color Treatments & Sound Design',
        detail:
          'Cinematic color grading paired with clean audio mixing, custom sound effects, and balanced studio soundscapes.',
      },
      {
        label: 'Short-Form Social Content & Reels',
        detail:
          'High-retention vertical edits and social media reels tailored for Instagram, TikTok, and YouTube Shorts.',
      },
    ],
  },
  {
    id: 'brand-storytelling',
    variant: 'tone-olive',
    title: 'Brand\nStorytelling',
    badge: 'Campaigns · Inquire',
    image: brandStorytellingImg,
    imageAlt: 'Motion Pub commercial cinema camera rig for brand storytelling campaigns',
    includes: [
      {
        label: 'Promotional Campaigns',
        detail:
          'Cohesive visual campaign packages engineered to build brand awareness, capture attention, and drive conversions.',
      },
      {
        label: 'Visual Content Across Sri Lanka',
        detail:
          'Culturally tuned brand films and promotional visuals built for ambitious local businesses across Sri Lanka.',
      },
      {
        label: 'International Market Productions',
        detail:
          'Global-standard creative direction and video storytelling crafted for international brands and remote partners.',
      },
    ],
  },
]

export default function MpServices() {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (serviceId, index) => {
    const key = `${serviceId}-${index}`
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <section className="mp-services-section" id="services" aria-label="Services and Focus">
      <div className="mp-services-bg-glow" aria-hidden="true" />

      {/* Reusable PageHeader matching About / Contact pages */}
      <PageHeader
        text="SERVICES"
        textColor="#78b700"
        containerColor="#8888881f"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-pageheader-icon"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        }
      />

      <div className="mp-services-shell">
        {/* Stacked Full-Width Horizontal Service Cards */}
        <div className="mp-services-stack">
          {SERVICES.map((service, cardIndex) => (
            <article
              key={service.id}
              className={`mp-service-row-card ${service.variant}`}
              style={{ animationDelay: `${0.08 + cardIndex * 0.1}s` }}
            >
              {/* Left Column: Bold Title + Interactive What's Included Rows */}
              <div className="mp-service-row-left">
                <h2 className="mp-service-row-title">
                  {service.title.split('\n').map((line, idx) => (
                    <span key={idx} className="mp-service-title-line">
                      {line}
                    </span>
                  ))}
                </h2>

                <div className="mp-service-accordion" role="list">
                  {service.includes.map((item, idx) => {
                    const key = `${service.id}-${idx}`
                    const isOpen = Boolean(openItems[key])
                    return (
                      <div
                        key={item.label}
                        className={`mp-service-acc-item ${isOpen ? 'is-open' : ''}`}
                        role="listitem"
                      >
                        <button
                          type="button"
                          className="mp-service-acc-trigger"
                          onClick={() => toggleItem(service.id, idx)}
                          aria-expanded={isOpen}
                        >
                          <span className="mp-service-acc-label">{item.label}</span>
                          <span className="mp-service-acc-plus" aria-hidden="true">
                            +
                          </span>
                        </button>
                        {isOpen && (
                          <p className="mp-service-acc-detail">{item.detail}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Rounded Visual Frame + Floating Top-Right Pill */}
              <div className="mp-service-row-media">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  className="mp-service-media-img"
                  loading="lazy"
                />
                <div className="mp-service-media-scrim" aria-hidden="true" />
                <a href="#contact" className="mp-service-floating-pill">
                  <span>{service.badge}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
