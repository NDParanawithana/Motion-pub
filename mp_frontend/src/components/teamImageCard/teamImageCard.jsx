import { useState, useEffect } from 'react'
import './teamImageCard.css'

const normalizeHref = (url) => {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function TeamImageCard({
  name,
  role,
  image,
  socials = {},
  isActive = false,
  position = 0,
  onClick,
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [image])

  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const dist = Math.abs(position)
  const positionClass = isActive
    ? 'is-active'
    : dist === 1
      ? 'is-near'
      : 'is-far'

  const socialItems = [
    {
      key: 'facebook',
      label: `${name} on Facebook`,
      href: normalizeHref(socials.facebook),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
        </svg>
      ),
    },
    {
      key: 'linkedin',
      label: `${name} on LinkedIn`,
      href: normalizeHref(socials.linkedin),
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" />
        </svg>
      ),
    },
    {
      key: 'x',
      label: `${name} on X`,
      href: normalizeHref(socials.x),
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: 'instagram',
      label: `${name} on Instagram`,
      href: normalizeHref(socials.instagram),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(item.href))

  return (
    <article
      className={`mp-team-card ${positionClass}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${name}${role ? `, ${role}` : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div className="mp-team-card-frame">
        {image && !imgError ? (
          <img
            src={image}
            alt={name}
            className="mp-team-card-img"
            loading="eager"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="mp-team-card-fallback" aria-hidden="true">
            <span>{initials}</span>
          </div>
        )}

        {/* Soft bottom vignette inside portrait frame */}
        <div className="mp-team-card-vignette" aria-hidden="true" />

        {/* Floating Social Links on Active Spotlight Card */}
        {isActive && socialItems.length > 0 && (
          <div className="mp-team-card-socials" onClick={(e) => e.stopPropagation()}>
            {socialItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mp-team-social-btn"
                aria-label={item.label}
                title={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Member Name & Role */}
      <div className="mp-team-card-meta">
        <h3 className="mp-team-card-name">{name}</h3>
        {isActive && role && (
          <p className="mp-team-card-role">({role})</p>
        )}
      </div>
    </article>
  )
}
