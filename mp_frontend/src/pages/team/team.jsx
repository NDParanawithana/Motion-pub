import { useState, useEffect, useCallback, useMemo } from 'react'
import TeamImageCard from '../../components/teamImageCard/teamImageCard'
import './team.css'

const DEFAULT_TEAM_MEMBERS = [
  {
    id: 'member-1',
    name: 'Leo Martin',
    role: 'Lead Video Editor',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80',
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: '',
    },
  },
  {
    id: 'member-2',
    name: 'Minh Nguyen',
    role: 'Motion Designer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80',
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: '',
    },
  },
  {
    id: 'member-3',
    name: 'Taylor Jones',
    role: 'Founder of Motion Pub',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: '',
    },
  },
  {
    id: 'member-4',
    name: 'Aisha Rahman',
    role: 'Creative Director',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=80',
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: '',
    },
  },
  {
    id: 'member-5',
    name: 'Arjun Lim',
    role: 'Cinematographer & Colorist',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=640&q=80',
    socials: {
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      x: 'https://x.com',
      instagram: '',
    },
  },
]

const loadCachedMembers = () => {
  try {
    const raw = localStorage.getItem('mp_team_members')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore invalid cache
  }
  return DEFAULT_TEAM_MEMBERS
}

export default function Team() {
  const [members, setMembers] = useState(loadCachedMembers)
  const [activeIndex, setActiveIndex] = useState(() => {
    const initial = loadCachedMembers()
    return initial.length >= 3 ? Math.floor(initial.length / 2) : 0
  })

  // Fetch live team members from backend and listen for real-time Admin updates
  useEffect(() => {
    let isMounted = true

    fetch('/api/content/team')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setMembers(data.data)
          try {
            localStorage.setItem('mp_team_members', JSON.stringify(data.data))
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {
        // Fallback silently to cached/default members
      })

    const handleTeamUpdated = (e) => {
      if (Array.isArray(e?.detail?.members)) {
        setMembers(e.detail.members)
      }
    }

    const handleStorage = (e) => {
      if (e.key === 'mp_team_members' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setMembers(parsed)
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('mp-team-updated', handleTeamUpdated)
    window.addEventListener('storage', handleStorage)
    return () => {
      isMounted = false
      window.removeEventListener('mp-team-updated', handleTeamUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const total = members.length
  const safeActiveIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0

  useEffect(() => {
    if (total > 0 && activeIndex >= total) {
      setActiveIndex(total - 1)
    }
  }, [total, activeIndex])

  const handlePrev = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const handleNext = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  // Keyboard arrow navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlePrev, handleNext])

  // Build visible slots cleanly regardless of whether team has 1, 2, 3, 4, or 5+ members
  const visibleSlots = useMemo(() => {
    if (total === 0) return []
    if (total === 1) return [{ memberIdx: 0, offset: 0 }]
    if (total === 2) {
      const other = (safeActiveIndex + 1) % 2
      return [
        { memberIdx: safeActiveIndex, offset: 0 },
        { memberIdx: other, offset: 1 },
      ]
    }
    if (total === 3 || total === 4) {
      const offsets = total === 3 ? [-1, 0, 1] : [-1, 0, 1, 2]
      return offsets.map((offset) => ({
        memberIdx: (safeActiveIndex + offset + total) % total,
        offset,
      }))
    }
    return [-2, -1, 0, 1, 2].map((offset) => ({
      memberIdx: (safeActiveIndex + offset + total) % total,
      offset,
    }))
  }, [total, safeActiveIndex])

  const progressWidth = total > 0 ? 100 / total : 100
  const progressLeft = total > 0 ? (safeActiveIndex / total) * 100 : 0

  return (
    <section className="mp-team-section" id="team">
      {/* Subtle Ambient Background Glow */}
      <div className="mp-team-bg-glow" aria-hidden="true" />

      <div className="mp-team-container">
        {/* Top Centered Display Heading */}
        <header className="mp-team-header">
          <h1 className="mp-team-title">
            Meet Motion Pub&apos;s <span className="mp-team-title-accent">Minds</span>
          </h1>
        </header>

        {/* Spotlight Carousel Row */}
        {total > 0 ? (
          <>
            <div className="mp-team-carousel" aria-label="Motion Pub team members">
              {visibleSlots.map(({ memberIdx, offset }) => {
                const member = members[memberIdx]
                const isActive = offset === 0

                return (
                  <TeamImageCard
                    key={member.id || member._id || memberIdx}
                    name={member.name}
                    role={member.role}
                    image={member.image}
                    socials={member.socials}
                    isActive={isActive}
                    position={offset}
                    onClick={() => setActiveIndex(memberIdx)}
                  />
                )
              })}
            </div>

            {/* Bottom Progress Rail & Circular Navigation Arrows */}
            {total > 1 && (
              <div className="mp-team-controls">
                <div
                  className="mp-team-progress-track"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-valuenow={safeActiveIndex + 1}
                  aria-label="Team member carousel progress"
                >
                  <div
                    className="mp-team-progress-indicator"
                    style={{
                      width: `${progressWidth}%`,
                      left: `${progressLeft}%`,
                    }}
                  />
                </div>

                <div className="mp-team-nav-arrows">
                  <button
                    type="button"
                    className="mp-team-arrow-btn"
                    onClick={handlePrev}
                    aria-label="Previous team member"
                    title="Previous"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="mp-team-arrow-btn"
                    onClick={handleNext}
                    aria-label="Next team member"
                    title="Next"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mp-team-empty-msg">Our team roster is being updated.</p>
        )}
      </div>
    </section>
  )
}
