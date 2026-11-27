import pubPulseIcon from '../../assets/icons/pubpulse.jpg'
import './pubPulse.css'

export default function PubPulse({
  label = 'PubPulse',
  sublabel = 'Explore Motion Pub in action',
  href = '#pubpulse',
  target,
  rel,
  onClick,
  className = '',
}) {
  const isExternal = target === '_blank'
  const resolvedRel = rel ?? (isExternal ? 'noopener noreferrer' : undefined)

  const content = (
    <>
      <span className="mp-pubpulse-icon-wrap" aria-hidden="true">
        <span className="mp-pubpulse-pulse-ring" />
        <img
          src={pubPulseIcon}
          alt=""
          className="mp-pubpulse-icon-img"
          draggable={false}
        />
      </span>

      <span className="mp-pubpulse-text">
        <span className="mp-pubpulse-label">{label}</span>
        {sublabel && <span className="mp-pubpulse-sublabel">{sublabel}</span>}
      </span>

      <span className="mp-pubpulse-arrow" aria-hidden="true">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={resolvedRel}
        onClick={onClick}
        className={`mp-pubpulse-btn ${className}`.trim()}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mp-pubpulse-btn ${className}`.trim()}
    >
      {content}
    </button>
  )
}
