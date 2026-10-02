import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import './about.css'

function LineByLineText({
  parts,
  baseDelay = 1.15,
  stagger = 0.2,
  animateKey = 0,
  className = '',
  tag: Tag = 'p',
}) {
  const containerRef = useRef(null)
  const measureRef = useRef(null)
  const [lines, setLines] = useState([])
  const prevWidthRef = useRef(0)

  // Split content parts into word objects with formatting flags
  const words = useMemo(() => {
    const list = []
    const rawParts = typeof parts === 'string' ? [{ text: parts, strong: false }] : parts

    rawParts.forEach((part) => {
      const splitWords = part.text.trim().split(/\s+/)
      splitWords.forEach((w) => {
        if (w) {
          list.push({ word: w, strong: !!part.strong })
        }
      })
    })
    return list
  }, [parts])

  // Measure word offsetTop to group them into actual visual lines based on container width
  const computeLines = useCallback(() => {
    if (!measureRef.current) return
    const wordEls = measureRef.current.querySelectorAll('.mp-measure-word')
    if (!wordEls.length) return

    const grouped = []
    let currentLine = []
    let currentTop = null

    wordEls.forEach((el, index) => {
      const top = el.offsetTop
      if (currentTop === null || Math.abs(top - currentTop) < 6) {
        currentLine.push(words[index])
        if (currentTop === null) currentTop = top
      } else {
        grouped.push(currentLine)
        currentLine = [words[index]]
        currentTop = top
      }
    })

    if (currentLine.length > 0) {
      grouped.push(currentLine)
    }

    setLines(grouped)
  }, [words])

  // Synchronously compute lines before the browser paints to prevent flash
  useLayoutEffect(() => {
    computeLines()
  }, [computeLines, animateKey])

  // Responsive recomputation when container width changes (e.g. window resize)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width)
        if (width > 0 && Math.abs(width - prevWidthRef.current) >= 4) {
          prevWidthRef.current = width
          computeLines()
        }
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [computeLines])

  return (
    <Tag ref={containerRef} className={`mp-line-by-line-container ${className}`}>
      {/* Invisible measurement container matching exact typography */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="mp-measure-container"
      >
        {words.map((item, idx) => (
          <span
            key={idx}
            className="mp-measure-word"
            style={{ fontWeight: item.strong ? 750 : 400 }}
          >
            {item.word}{' '}
          </span>
        ))}
      </span>

      {/* Rendered animated lines */}
      <span
        className="mp-lines-wrapper"
        style={{ visibility: lines.length > 0 ? 'visible' : 'hidden' }}
      >
        {lines.length > 0 ? (
          lines.map((lineWords, lineIdx) => {
            const delay = (baseDelay + lineIdx * stagger).toFixed(2)
            return (
              <span
                key={`line-${animateKey}-${lineIdx}`}
                className="mp-line-row"
              >
                <span
                  className="mp-line-anim"
                  style={{ animationDelay: `${delay}s` }}
                >
                  {lineWords.map((item, wIdx) => {
                    const content = item.strong ? (
                      <strong key={wIdx}>{item.word}</strong>
                    ) : (
                      <span key={wIdx}>{item.word}</span>
                    )
                    return (
                      <React.Fragment key={wIdx}>
                        {content}
                        {wIdx < lineWords.length - 1 ? ' ' : ''}
                      </React.Fragment>
                    )
                  })}
                </span>
              </span>
            )
          })
        ) : (
          /* Fallback before first layout measurement */
          <span className="mp-line-row">
            <span className="mp-line-anim" style={{ animationDelay: `${baseDelay}s` }}>
              {words.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.strong ? <strong>{item.word}</strong> : item.word}
                  {idx < words.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </span>
          </span>
        )}
      </span>
    </Tag>
  )
}

export default function About() {
  const [animateKey, setAnimateKey] = useState(0)
  const sectionRef = useRef(null)

  const leadParagraphParts = [
    {
      text: 'MOTION PUB is a Sri Lankan video production and post-production agency',
      strong: true,
    },
    {
      text: 'dedicated to creating powerful visual content that helps brands stand out. We combine creativity, storytelling, and visual design to transform ideas into engaging content that connects with audiences.',
      strong: false,
    },
  ]

  const subtextParts = [
    {
      text: "Whether it's bringing a concept to life or shaping existing footage into a compelling story, we focus on creating visuals that communicate your brand's identity and leave a lasting impression.",
      strong: false,
    },
  ]

  useEffect(() => {
    let cooldown = false

    const trigger = () => {
      if (cooldown) return
      cooldown = true
      setAnimateKey((prev) => prev + 1)
      setTimeout(() => { cooldown = false }, 3000)
    }

    // Re-trigger on hash navigation to #about
    const handleHashChange = () => {
      if (window.location.hash === '#about') trigger()
    }
    window.addEventListener('hashchange', handleHashChange)

    // Re-trigger on click of any link pointing to #about
    const handleLinkClick = (e) => {
      const link = e.target.closest('a')
      if (link && link.getAttribute('href') === '#about') trigger()
    }
    document.addEventListener('click', handleLinkClick)

    // Trigger once when section scrolls into viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trigger()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.25 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      document.removeEventListener('click', handleLinkClick)
      observer.disconnect()
    }
  }, [])

  // Gradient color stops for highlight text (matching the original CSS gradient)
  const highlightColors = [
    '#dfff32', '#c4f01a', '#94e000', '#6fdf40',
    '#4ade80', '#3cd9a0', '#2dd4bf', '#33c8de', '#38bdf8',
  ]

  // Interpolate a color from the palette based on position (0 to 1)
  const getGradientColor = (t) => {
    const idx = t * (highlightColors.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(lo + 1, highlightColors.length - 1)
    const frac = idx - lo
    const parse = (hex) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ]
    const [r1, g1, b1] = parse(highlightColors[lo])
    const [r2, g2, b2] = parse(highlightColors[hi])
    const r = Math.round(r1 + (r2 - r1) * frac)
    const g = Math.round(g1 + (g2 - g1) * frac)
    const b = Math.round(b1 + (b2 - b1) * frac)
    return `rgb(${r}, ${g}, ${b})`
  }

  // Split text into individually animated bouncing letters
  const renderBouncingLetters = (text, startIndex = 0, useGradient = false) => {
    let idx = startIndex
    const words = text.split(' ')
    // Count total visible (non-space) characters for gradient positioning
    const totalVisible = text.replace(/ /g, '').length
    let visibleIdx = 0

    return words.map((word, wordIdx) => {
      const letters = word.split('').map((char) => {
        const delay = idx * 55
        const style = { animationDelay: `${delay}ms` }

        if (useGradient) {
          const t = totalVisible > 1 ? visibleIdx / (totalVisible - 1) : 0
          const color = getGradientColor(t)
          style.color = color
          style.WebkitTextFillColor = color
        }

        visibleIdx++
        const el = (
          <span
            key={`${animateKey}-${idx}`}
            className="bounce-letter"
            style={style}
          >
            {char}
          </span>
        )
        idx++
        return el
      })
      idx++ // account for space

      return (
        <span key={`w-${wordIdx}`} className="bounce-word">
          {letters}
          {wordIdx < words.length - 1 && <span className="bounce-space">&nbsp;</span>}
        </span>
      )
    })
  }

  return (
    <section className="mp-about-section section" id="about" ref={sectionRef}>
      {/* Ambient background glow */}
      <div className="mp-about-bg-glow" />

      <div className="mp-about-container">
        {/* Top-Left Corner Title (Replacing Badge) */}
        <div className="mp-about-corner-title">
          ABOUT MOTION PUB
        </div>

        {/* Main Section Title with Bouncing Letters */}
        <h2 className="mp-about-title">
          <span className="mp-title-line">
            {renderBouncingLetters('We Turn Ideas Into', 0)}
          </span>
          <br />
          <span className="highlight mp-title-line">
            {renderBouncingLetters('Visual Stories.', 19, true)}
          </span>
        </h2>

        {/* Narrative Text (Line by Line Right-to-Left Entrance) */}
        <div className="mp-about-content" key={animateKey}>
          <LineByLineText
            parts={leadParagraphParts}
            baseDelay={1.5}
            stagger={0.32}
            animateKey={animateKey}
            className="mp-about-lead"
            tag="p"
          />

          <div className="mp-about-divider mp-divider-zoom-in" style={{ animationDelay: '2.4s' }}>
            <span className="mp-about-divider-line left" />
            <span className="mp-about-divider-camera" title="Motion Pub Studio">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </span>
            <span className="mp-about-divider-line right" />
          </div>

          <LineByLineText
            parts={subtextParts}
            baseDelay={2.8}
            stagger={0.32}
            animateKey={animateKey}
            className="mp-about-subtext"
            tag="p"
          />
        </div>
      </div>
    </section>
  )
}
