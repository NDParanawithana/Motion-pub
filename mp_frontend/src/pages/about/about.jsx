import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import PageHeader from '../../components/pageHeader/pageHeader'
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

  // Split content parts into word objects with formatting flags (supports HTML string or object parts)
  const words = useMemo(() => {
    if (Array.isArray(parts)) {
      const list = []
      parts.forEach((part) => {
        const splitWords = (part.text || '').trim().split(/\s+/)
        splitWords.forEach((w) => {
          if (w) {
            list.push({
              word: w,
              strong: !!part.strong,
              em: !!part.em,
              underline: !!part.underline,
              color: part.color || null,
            })
          }
        })
      })
      return list
    }

    if (typeof parts === 'string') {
      if (typeof document === 'undefined') return []
      const div = document.createElement('div')
      div.innerHTML = parts

      const list = []
      function traverse(node, formatting) {
        if (node.nodeType === Node.TEXT_NODE) {
          const splitWords = (node.textContent || '').split(/\s+/)
          splitWords.forEach((w) => {
            if (w) {
              list.push({
                word: w,
                strong: formatting.strong,
                em: formatting.em,
                underline: formatting.underline,
                color: formatting.color,
              })
            }
          })
          return
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase()
          const nextFormatting = { ...formatting }

          if (
            tag === 'strong' ||
            tag === 'b' ||
            node.style.fontWeight === 'bold' ||
            parseInt(node.style.fontWeight, 10) >= 600
          ) {
            nextFormatting.strong = true
          }
          if (tag === 'em' || tag === 'i' || node.style.fontStyle === 'italic') {
            nextFormatting.em = true
          }
          if (tag === 'u' || (node.style.textDecoration && node.style.textDecoration.includes('underline'))) {
            nextFormatting.underline = true
          }
          if (node.style.color || (node.getAttribute && node.getAttribute('color'))) {
            nextFormatting.color = node.style.color || node.getAttribute('color')
          }

          node.childNodes.forEach((child) => traverse(child, nextFormatting))
        }
      }

      traverse(div, { strong: false, em: false, underline: false, color: null })
      return list
    }

    return []
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
            style={{
              fontWeight: item.strong ? 750 : 400,
              fontStyle: item.em ? 'italic' : 'normal',
              textDecoration: item.underline ? 'underline' : 'none',
            }}
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
                    const style = item.color ? { color: item.color } : {}
                    let content = <span key={wIdx} style={style}>{item.word}</span>

                    if (item.strong) {
                      content = <strong key={wIdx} style={style}>{item.word}</strong>
                    } else if (item.em) {
                      content = <em key={wIdx} style={style}>{item.word}</em>
                    } else if (item.underline) {
                      content = <u key={wIdx} style={style}>{item.word}</u>
                    }

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
              {words.map((item, idx) => {
                const style = item.color ? { color: item.color } : {}
                let content = <span key={idx} style={style}>{item.word}</span>
                if (item.strong) {
                  content = <strong key={idx} style={style}>{item.word}</strong>
                } else if (item.em) {
                  content = <em key={idx} style={style}>{item.word}</em>
                } else if (item.underline) {
                  content = <u key={idx} style={style}>{item.word}</u>
                }
                return (
                  <React.Fragment key={idx}>
                    {content}
                    {idx < words.length - 1 ? ' ' : ''}
                  </React.Fragment>
                )
              })}
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

  // Ensure About page stays strictly in the top position when loading/mounting
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  const [cornerTitle, setCornerTitle] = useState(() => {
    return localStorage.getItem('mp_about_corner_title') || 'ABOUT MOTION PUB'
  })
  const [headingLine1, setHeadingLine1] = useState(() => {
    return localStorage.getItem('mp_about_heading_line1') || 'We Turn Ideas Into'
  })
  const [headingLine2, setHeadingLine2] = useState(() => {
    return localStorage.getItem('mp_about_heading_line2') || 'Visual Stories.'
  })
  const [leadHtml, setLeadHtml] = useState(() => {
    return localStorage.getItem('mp_about_lead') || null
  })
  const [subtextHtml, setSubtextHtml] = useState(() => {
    return localStorage.getItem('mp_about_subtext') || null
  })
  const [additionalParagraphsHtml, setAdditionalParagraphsHtml] = useState(() => {
    return JSON.parse(localStorage.getItem('mp_about_additional_paragraphs') || '[]')
  })

  // Sync real-time updates from AboutEdit Studio
  useEffect(() => {
    const handleAboutUpdate = (e) => {
      if (e?.detail) {
        if (e.detail.cornerTitle !== undefined) setCornerTitle(e.detail.cornerTitle)
        if (e.detail.headingLine1 !== undefined) setHeadingLine1(e.detail.headingLine1)
        if (e.detail.headingLine2 !== undefined) setHeadingLine2(e.detail.headingLine2)
        if (e.detail.leadHtml !== undefined) setLeadHtml(e.detail.leadHtml)
        if (e.detail.subtextHtml !== undefined) setSubtextHtml(e.detail.subtextHtml)
        if (e.detail.additionalParagraphsHtml !== undefined) setAdditionalParagraphsHtml(e.detail.additionalParagraphsHtml)
      }
    }
    const handleStorage = (e) => {
      if (e.key === 'mp_about_lead') setLeadHtml(e.newValue)
      if (e.key === 'mp_about_subtext') setSubtextHtml(e.newValue)
      if (e.key === 'mp_about_corner_title') setCornerTitle(e.newValue || 'ABOUT MOTION PUB')
      if (e.key === 'mp_about_heading_line1') setHeadingLine1(e.newValue || 'We Turn Ideas Into')
      if (e.key === 'mp_about_heading_line2') setHeadingLine2(e.newValue || 'Visual Stories.')
      if (e.key === 'mp_about_additional_paragraphs') setAdditionalParagraphsHtml(JSON.parse(e.newValue || '[]'))
    }
    window.addEventListener('mp-about-update', handleAboutUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('mp-about-update', handleAboutUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const defaultLeadParts = [
    {
      text: 'MOTION PUB is a Sri Lankan video production and post-production agency',
      strong: true,
    },
    {
      text: 'dedicated to creating powerful visual content that helps brands stand out. We combine creativity, storytelling, and visual design to transform ideas into engaging content that connects with audiences.',
      strong: false,
    },
  ]

  const defaultSubtextParts = [
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

    // Re-trigger and keep at top on hash navigation to #about
    const handleHashChange = () => {
      if (window.location.hash === '#about') {
        trigger()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('hashchange', handleHashChange)

    // Re-trigger and keep at top on click of any link pointing to #about
    const handleLinkClick = (e) => {
      const link = e.target.closest('a')
      if (link && link.getAttribute('href') === '#about') {
        trigger()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }
    }
    document.addEventListener('click', handleLinkClick)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      document.removeEventListener('click', handleLinkClick)
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
    <section className="mp-about-section" id="about" ref={sectionRef}>
      {/* Ambient background glow */}
      <div className="mp-about-bg-glow" />

      {/* Top-Left Page Header with matching icon and changeable props */}
      <PageHeader
        text={cornerTitle}
        animateKey={animateKey}
        textColor="#78b700"
        containerColor="#8888881f"
        icon="about"
      />

      <div className="mp-about-container">
        {/* Main Section Title with Bouncing Letters */}
        <h2 className="mp-about-title">
          <span className="mp-title-line">
            {renderBouncingLetters(headingLine1, 0)}
          </span>
          <br />
          <span className="highlight mp-title-line">
            {renderBouncingLetters(headingLine2, headingLine1.length + 1, true)}
          </span>
        </h2>

        {/* Narrative Text (Line by Line Right-to-Left Entrance) */}
        <div className="mp-about-content" key={animateKey}>
          <LineByLineText
            parts={leadHtml || defaultLeadParts}
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
            parts={subtextHtml || defaultSubtextParts}
            baseDelay={2.8}
            stagger={0.32}
            animateKey={animateKey}
            className="mp-about-subtext"
            tag="p"
          />

          {additionalParagraphsHtml.map((htmlStr, idx) => {
            if (htmlStr === '[DIVIDER]') {
              return (
                <div key={idx} className="mp-about-divider mp-divider-zoom-in" style={{ animationDelay: `${2.8 + (idx + 1) * 0.4}s`, margin: '4rem auto' }}>
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
              );
            }
            return (
              <LineByLineText
                key={idx}
                parts={htmlStr}
                baseDelay={2.8 + (idx + 1) * 0.4}
                stagger={0.32}
                animateKey={animateKey}
                className="mp-about-subtext mp-about-additional-p"
                tag="p"
              />
            );
          })}
        </div>
      </div>
    </section>
  )
}
