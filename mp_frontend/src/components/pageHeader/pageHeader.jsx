import React, { useState, useEffect, useRef, useLayoutEffect, useId } from 'react';
import './pageheader.css';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Parse #rgb / #rgba / #rrggbb / #rrggbbaa / rgb() / rgba() into {r,g,b,a}.
 */
function parseColor(input) {
  if (typeof input !== 'string') return null;
  const c = input.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((ch) => ch + ch).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
  }
  const m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i);
  if (!m) return null;
  let a = 1;
  if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}

/** Re-emit short / 8-digit hex as rgba() so every SVG/CSS consumer understands it. */
function normalizeColor(c) {
  if (!c) return c;
  const p = parseColor(c);
  if (!p) return c;
  if (typeof c === 'string' && c.startsWith('#') && c.length === 7) return c;
  return `rgba(${p.r}, ${p.g}, ${p.b}, ${+p.a.toFixed(3)})`;
}

/** Same colour with a different alpha (multiplied with any alpha it already has). */
function withAlpha(c, alpha) {
  const p = parseColor(c);
  if (p) return `rgba(${p.r}, ${p.g}, ${p.b}, ${+(p.a * alpha).toFixed(3)})`;
  return `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`;
}

/**
 * Geometry of the pin silhouette (circular bulb + horizontal bar) for a given height.
 */
function getPinGeometry(height) {
  const pad = 1.2;
  const D = Math.max(30, height - pad * 2);
  const R = D / 2;
  const Hbar = Math.max(18, Math.round(D * 0.58));
  const h = Hbar / 2;
  const cx = R + pad;
  const cy = R + pad;
  const dx = Math.sqrt(Math.max(0, R * R - h * h));
  return { pad, R, cx, cy, h, x0: cx + dx, barTop: cy - h, barBottom: cy + h };
}

/**
 * Single silhouette path that morphs continuously between the full pin
 * (p = 0) and a complete circle (p = 1): the bar shortens, thickens to the
 * full diameter and its flat end rounds off into the right half of the circle.
 */
function buildPinPath(height, width, p, cornerRadius = 0) {
  const { pad, R, cx, cy, h: h0, x0: x0Exp } = getPinGeometry(height);
  const h = lerp(h0, R, p);
  const x0 = cx + Math.sqrt(Math.max(0, R * R - h * h));
  const rightExp = Math.max(width - pad, x0Exp + 10);
  const rightX = lerp(rightExp, cx + R, p);
  const top = cy - h;
  const bottom = cy + h;
  // Corner radius at rest (capped to the bar's half-height), growing to a full semicircle when collapsed
  const restRadius = Math.min(Math.max(0, cornerRadius), h0);
  const c = Math.min(lerp(restRadius, h, p), Math.max(0, rightX - x0));
  const f = (n) => n.toFixed(2);

  const cornerTop = c > 0.01
    ? `L ${f(rightX - c)} ${f(top)} A ${f(c)} ${f(c)} 0 0 1 ${f(rightX)} ${f(top + c)}`
    : `L ${f(rightX)} ${f(top)}`;
  const cornerBottom = c > 0.01
    ? `L ${f(rightX)} ${f(bottom - c)} A ${f(c)} ${f(c)} 0 0 1 ${f(rightX - c)} ${f(bottom)}`
    : `L ${f(rightX)} ${f(bottom)}`;

  return `M ${f(x0)} ${f(top)} ${cornerTop} ${cornerBottom} L ${f(x0)} ${f(bottom)} A ${f(R)} ${f(R)} 0 1 1 ${f(x0)} ${f(top)} Z`;
}

/**
 * Built-in preset icons matching page contexts
 */
function renderHeaderIcon(iconProp, text) {
  if (React.isValidElement(iconProp)) {
    return iconProp;
  }

  // Determine key from prop or infer from heading text
  let key = typeof iconProp === 'string' ? iconProp.toLowerCase().trim() : null;
  if (!key) {
    const lower = (text || '').toLowerCase();
    if (lower.includes('contact')) key = 'contact';
    else if (lower.includes('about')) key = 'about';
  }

  switch (key) {
    case 'contact':
    case 'mail':
    case 'message':
    case 'email':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mp-pageheader-icon"
          aria-hidden="true"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );

    case 'phone':
    case 'call':
      return (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mp-pageheader-icon"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );

    case 'about':
    case 'info':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mp-pageheader-icon"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );

    case 'spark':
    case 'star':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mp-pageheader-icon"
          aria-hidden="true"
        >
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Reusable PageHeader Component.
 * Features a modern futuristic container shape (circular bulb on the left,
 * horizontal rectangular bar on the right with a flat vertical end)
 * aligned to the section content gutter, with animated pop-up typography,
 * customizable text color, container color, matching icon support,
 * and seamless scroll-collapse animation where the text smoothly
 * retracts into the icon badge when scrolling down.
 *
 * @param {Object} props
 * @param {string} [props.text] - Heading text (e.g. "ABOUT MOTION PUB", "CONTACT MOTION PUB")
 * @param {string} [props.title] - Alternative alias for text
 * @param {React.ReactNode} [props.children] - Custom children if not using text string
 * @param {string} [props.textColor] - Custom text color override (e.g. "#78b700", "#6366f1", "#ffffff")
 * @param {string} [props.color] - Alias for textColor
 * @param {string} [props.containerColor] - Custom container background color override (e.g. "#000000", "#111827", "rgba(0,0,0,0.85)")
 * @param {string} [props.bgColor] - Alias for containerColor
 * @param {string} [props.backgroundColor] - Alias for containerColor
 * @param {string} [props.borderColor] - Optional custom border color or gradient override
 * @param {string} [props.glowColor] - Optional custom glow / shadow color override
 * @param {string|React.ReactNode} [props.icon] - Icon name ("contact", "about", "phone", "spark") or custom SVG element
 * @param {boolean} [props.showDot=true] - Fallback to glowing accent dot if no icon is specified
 * @param {number|string} [props.topPadding] - Fixed padding between navbar and header (defaults to 18px)
 * @param {number|string} [props.offset] - Custom horizontal offset in px (defaults to -38 to align circle to the marked area)
 * @param {number|string} [props.offsetX] - Alias for offset
 * @param {'pin'|'trapezium'|'pill'} [props.shape='pin'] - Container silhouette shape (defaults to 'pin')
 * @param {boolean} [props.trapezium=false] - Backwards-compatible flag for trapezium shape
 * @param {boolean} [props.sticky=true] - Whether the header sticks beneath the navbar on scroll
 * @param {number} [props.cornerRadius=8] - Corner radius (px) of the bar's right-hand end (capped to the bar's half-height)
 * @param {string} [props.fontFamily] - Title font family override (defaults to "Chakra Petch", loaded in index.html)
 * @param {string|number} [props.animateKey=0] - Key that triggers the pop-up letter animation when changed
 * @param {boolean} [props.collapseOnScroll=true] - Collapse header text into circular icon badge on page scroll
 * @param {number} [props.collapseThreshold=45] - Scroll distance in px after which collapse activates
 * @param {boolean} [props.expandOnScrollUp=true] - Smoothly expand back out when user scrolls up
 * @param {boolean} [props.expandOnHover=true] - Expand header when hovering on collapsed badge
 * @param {string} [props.className=""] - Optional additional CSS class names
 * @param {Object} [props.style={}] - Optional inline styles for the outer container frame
 * @param {Object} [props.contentStyle={}] - Optional inline styles for the inner surface container
 * @param {Object} [props.titleStyle={}] - Optional inline styles for the title element
 * @param {string} [props.id] - Optional HTML id attribute
 */
export default function PageHeader({
  text = 'MOTION PUB',
  title,
  children,
  textColor,
  color,
  containerColor,
  bgColor,
  backgroundColor,
  borderColor,
  glowColor,
  icon,
  topPadding,
  paddingTop,
  offset,
  offsetX,
  shape = 'pin',
  trapezium = false,
  sticky = true,
  cornerRadius = 8,
  fontFamily,
  animateKey = 0,
  collapseOnScroll = true,
  collapseThreshold = 45,
  expandOnScrollUp = true,
  expandOnHover = true,
  showDot = true,
  className = '',
  style = {},
  contentStyle = {},
  titleStyle = {},
  id,
}) {
  const gradientId = useId();
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  // Natural (expanded) width + height used to draw the SVG silhouette
  const [dims, setDims] = useState({ width: 0, height: 44 });

  // Scroll collapse state + hover-peek state
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 0 = fully expanded pin, 1 = collapsed circular badge (eased tween)
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  // Resolve changeable prop aliases
  const resolvedTextColor = normalizeColor(textColor || color || null);
  const resolvedContainerColor = normalizeColor(containerColor || bgColor || backgroundColor || null);
  const displayText = title || text || (typeof children === 'string' ? children : '') || 'MOTION PUB';

  // Resolve matching icon
  const resolvedIcon = renderHeaderIcon(icon, displayText);

  // Scroll listener for collapse-on-scroll animation
  useEffect(() => {
    if (!collapseOnScroll || typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;

          if (currentScrollY <= collapseThreshold) {
            setIsScrolledDown(false);
          } else if (delta > 4) {
            // Scrolling down past threshold -> collapse header text inside to the icon
            setIsScrolledDown(true);
          } else if (expandOnScrollUp && delta < -16) {
            // Scrolling up -> expand back out
            setIsScrolledDown(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll state on mount
    if (window.scrollY > collapseThreshold) {
      setIsScrolledDown(true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [collapseOnScroll, collapseThreshold, expandOnScrollUp]);

  // Collapsed once scrolled down; hovering the badge peeks it back open
  const isCollapsed = Boolean(collapseOnScroll && isScrolledDown);
  const targetProgress = isCollapsed && !(expandOnHover && isHovered) ? 1 : 0;

  // Eased tween toward the target. Container width, silhouette, text and icon
  // are all derived from this one value, so they can never drift out of sync.
  useEffect(() => {
    const from = progressRef.current;
    const to = targetProgress;
    if (from === to) return;

    const reduced = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      progressRef.current = to;
      setProgress(to);
      return;
    }

    const duration = Math.max(260, 680 * Math.abs(to - from));
    const start = performance.now();
    let raf = 0;
    const step = (now) => {
      const t = clamp01((now - start) / duration);
      const v = lerp(from, to, easeOutCubic(t));
      progressRef.current = v;
      setProgress(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetProgress]);

  // Resolve top padding between navbar and header
  const customTopPadding = typeof topPadding !== 'undefined' ? topPadding : paddingTop;
  const resolvedTopPaddingStyle = typeof customTopPadding === 'number'
    ? { '--pageheader-top-padding': `${customTopPadding}px` }
    : typeof customTopPadding === 'string'
    ? { '--pageheader-top-padding': customTopPadding }
    : {};

  // Resolve horizontal offset to align circle with marked area
  const customOffset = typeof offset !== 'undefined' ? offset : offsetX;
  const resolvedOffsetStyle = typeof customOffset === 'number'
    ? { '--pageheader-offset': `${customOffset}px` }
    : typeof customOffset === 'string'
    ? { '--pageheader-offset': customOffset }
    : {};

  // Measure the natural expanded width synchronously before paint.
  // The title's own width is independent of the collapse transition, so the
  // silhouette never gets locked to a mid-animation size.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const titleEl = titleRef.current;
    if (!container || !titleEl) return;

    const measure = () => {
      const h = container.offsetHeight;
      const titleW = titleEl.offsetWidth;
      if (!h || !titleW) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const padRight = (window.innerWidth <= 768 ? 1.15 : 1.55) * rem;
      const { x0 } = getPinGeometry(h);
      const w = Math.ceil(Math.round(x0 + 7) + titleW + padRight);
      setDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(titleEl);
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [displayText, animateKey, shape, trapezium]);

  // Generate pop-up letter nodes if rendering plain text
  const words = (displayText || '').toString().split(' ');
  let charIdx = 0;

  const letterNodes = words.map((word, wordIdx) => {
    const letters = word.split('').map((char) => {
      const delay = charIdx * 45;
      const letterEl = (
        <span
          key={`${animateKey}-pop-${charIdx}`}
          className="mp-pageheader-pop-letter"
          style={{ animationDelay: `${delay}ms` }}
        >
          {char}
        </span>
      );
      charIdx++;
      return letterEl;
    });
    charIdx++; // account for space between words

    return (
      <span key={`ph-word-${wordIdx}`} className="mp-pageheader-pop-word">
        {letters}
        {wordIdx < words.length - 1 && (
          <span className="mp-pageheader-pop-space">&nbsp;</span>
        )}
      </span>
    );
  });

  // Calculate dynamic glow and shadow values based on textColor (works with any hex / rgba colour)
  const dynamicTextShadow = resolvedTextColor
    ? `0 0 14px ${withAlpha(resolvedTextColor, 0.5)}, 0 0 24px ${withAlpha(resolvedTextColor, 0.25)}`
    : undefined;

  const dynamicGlowColor = glowColor
    ? glowColor
    : resolvedTextColor
    ? withAlpha(resolvedTextColor, 0.28)
    : undefined;

  const dynamicGlowHover = glowColor
    ? glowColor
    : resolvedTextColor
    ? withAlpha(resolvedTextColor, 0.5)
    : undefined;

  // Title typography styles
  const resolvedTitleStyles = {
    ...(resolvedTextColor ? {
      color: resolvedTextColor,
      textShadow: dynamicTextShadow,
    } : {}),
    ...titleStyle,
  };

  const contentToRender = typeof children !== 'undefined' && typeof children !== 'string'
    ? children
    : letterNodes;

  // Decide active silhouette shape ('pin' is the default new shape requested)
  const isPinShape = shape === 'pin' && !trapezium;

  // --- SVG PATH CALCULATIONS FOR PIN / KEY SHAPE ---
  const effectiveH = dims.height > 0 ? dims.height : 44;
  const { cx, cy, x0 } = getPinGeometry(effectiveH);

  // Fallback estimated width until the first measurement lands (before paint)
  const fallbackW = Math.max(240, (displayText.length * 11) + 80);
  const isMeasured = dims.width > 0;
  const effectiveW = isMeasured ? dims.width : fallbackW;
  const svgH = effectiveH;

  // One path morphs between the pin and the circle; container width follows the same progress
  const pinPathD = buildPinPath(effectiveH, effectiveW, progress, cornerRadius);
  const currentWidth = lerp(effectiveW, effectiveH, progress);
  const titleOpacity = clamp01(1 - progress * 1.7);
  const titleShift = -30 * progress;
  const iconScale = 1 + 0.14 * progress;

  const accentBorderColor = resolvedTextColor || '#94e000';

  // Base CSS variables for dynamic theme customization
  const customVars = {
    ...(fontFamily ? { '--pageheader-font': fontFamily } : {}),
    ...(resolvedContainerColor ? { '--pageheader-container-bg': resolvedContainerColor } : {}),
    ...(resolvedTextColor ? { '--pageheader-text-color': resolvedTextColor } : {}),
    ...(dynamicTextShadow ? { '--pageheader-text-glow': dynamicTextShadow } : {}),
    ...(dynamicGlowColor ? { '--pageheader-glow-color': dynamicGlowColor } : {}),
    ...(dynamicGlowHover ? { '--pageheader-glow-hover': dynamicGlowHover } : {}),
    ...resolvedOffsetStyle,
    ...resolvedTopPaddingStyle,
    ...style,
  };

  // Click handler to smooth scroll to top when clicked in collapsed state
  const handleBadgeClick = () => {
    if (isCollapsed) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  // Render badge content based on selected shape
  let badgeContent = null;

  if (isPinShape) {
    const containerClasses = [
      'mp-pageheader-pin-container',
      isCollapsed ? 'is-collapsed' : 'is-expanded',
      expandOnHover ? 'expand-on-hover' : '',
      className,
    ].filter(Boolean).join(' ');

    badgeContent = (
      <div
        ref={containerRef}
        id={id}
        className={containerClasses}
        style={isMeasured ? { ...customVars, width: `${currentWidth}px` } : customVars}
        onClick={handleBadgeClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isCollapsed ? `${displayText} (click to scroll up)` : undefined}
        aria-label={typeof displayText === 'string' ? displayText : undefined}
      >
        {/* SVG Silhouette Background - a single path morphing between pin and circle */}
        <svg
          className="mp-pageheader-pin-svg"
          width={effectiveW}
          height={svgH}
          viewBox={`0 0 ${effectiveW} ${svgH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentBorderColor} stopOpacity="0.85" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.32" />
              <stop offset="100%" stopColor={accentBorderColor} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            className="mp-pageheader-path-pin"
            d={pinPathD}
            fill={resolvedContainerColor || '#000000'}
            stroke={borderColor || `url(#grad-${gradientId})`}
            strokeWidth="1.2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Content Layer Positioned on Top of the Shape */}
        <div className="mp-pageheader-pin-body" style={contentStyle}>
          {/* Centered Matching Icon or Accent Dot in the Circular Head */}
          {resolvedIcon ? (
            <div
              className="mp-pageheader-circle-icon-wrap"
              style={{
                position: 'absolute',
                left: `${cx}px`,
                top: `${cy}px`,
                transform: `translate(-50%, -50%) scale(${iconScale})`,
                zIndex: 2,
              }}
            >
              {resolvedIcon}
            </div>
          ) : showDot ? (
            <span
              className="mp-pageheader-circle-dot"
              style={{
                position: 'absolute',
                left: `${cx}px`,
                top: `${cy}px`,
                background: resolvedTextColor || 'var(--section-tag-color, #78b700)',
                boxShadow: `0 0 10px ${resolvedTextColor || '#78b700'}, 0 0 18px ${resolvedTextColor || '#78b700'}`,
                zIndex: 2,
              }}
            />
          ) : null}

          {/* Right Horizontal Bar Slot with Typography */}
          <div
            className="mp-pageheader-bar-slot"
            style={{
              paddingLeft: `${Math.round(x0 + 7)}px`,
              opacity: titleOpacity,
              transform: `translateX(${titleShift}px)`,
              pointerEvents: progress > 0.5 ? 'none' : 'auto',
            }}
          >
            <span ref={titleRef} className="mp-pageheader-title" style={resolvedTitleStyles}>
              {contentToRender}
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    // Fallback Trapezium or Pill Shape
    const shapeClass = trapezium || shape === 'trapezium' ? 'is-trapezium' : 'is-pill';
    const frameClasses = [
      'mp-pageheader-frame',
      shapeClass,
      isCollapsed ? 'is-collapsed' : 'is-expanded',
      className,
    ].filter(Boolean).join(' ');

    const frameStyles = {
      ...customVars,
      ...(borderColor ? {
        background: borderColor,
        '--pageheader-border-gradient': borderColor,
      } : resolvedTextColor && resolvedTextColor.startsWith('#') && resolvedTextColor.length === 7 ? {
        background: `linear-gradient(135deg, ${resolvedTextColor}cc 0%, rgba(255, 255, 255, 0.25) 45%, ${resolvedTextColor}80 100%)`,
      } : {}),
      ...style,
    };

    const resolvedContentStyles = {
      ...(resolvedContainerColor ? {
        background: resolvedContainerColor,
        backgroundColor: resolvedContainerColor,
      } : {}),
      ...contentStyle,
    };

    badgeContent = (
      <div
        id={id}
        className={frameClasses}
        style={frameStyles}
        aria-label={typeof displayText === 'string' ? displayText : undefined}
      >
        <div
          className={`mp-pageheader-content ${shapeClass}`}
          style={resolvedContentStyles}
        >
          <span className="mp-pageheader-title" style={resolvedTitleStyles}>
            {contentToRender}
          </span>
        </div>
      </div>
    );
  }

  if (sticky) {
    return (
      <div className="mp-pageheader-sticky" key={animateKey}>
        <div className="mp-pageheader-sticky-inner">
          {badgeContent}
        </div>
      </div>
    );
  }

  return (
    <div key={animateKey} className="mp-pageheader-static-wrap">
      {badgeContent}
    </div>
  );
}

export { PageHeader };
