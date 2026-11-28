import React, { useEffect, useMemo, useState } from 'react';
import './breadcrumb.css';

/**
 * Default route hierarchy used when <Breadcrumb /> is rendered without explicit `items`.
 * Keeps breadcrumb trails consistent across the entire Motion Pub site.
 */
export const SITE_BREADCRUMB_ROUTES = {
    '#about': [{ label: 'About', href: '#about' }],
    '#team': [{ label: 'Team', href: '#team' }],
    '#services': [{ label: 'Services', href: '#services' }],
    '#pubpulse': [
        { label: 'Services', href: '#services' },
        { label: 'PubPulse', href: '#pubpulse' },
    ],
    '#testimonials': [{ label: 'Testimonials', href: '#testimonials' }],
    '#contact': [{ label: 'Contact Us', href: '#contact' }],
    '#works': [{ label: 'Our Works', href: '#works' }],
    '#partners': [{ label: 'Partners', href: '#partners' }],
};

export function getRouteBreadcrumbItems(hash = '') {
    const normalized = (hash || '').trim().toLowerCase();
    return SITE_BREADCRUMB_ROUTES[normalized] || [];
}

function HomeIcon() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-breadcrumb-home-icon"
            aria-hidden="true"
        >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20a1 1 0 0 0 1 1h4.5v-6h3v6H18a1 1 0 0 0 1-1V9.5" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg
            width="14"
            height="14"
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
    );
}

function renderSeparator(separator) {
    if (React.isValidElement(separator)) {
        return separator;
    }

    if (separator === 'slash') {
        return (
            <span className="mp-breadcrumb-sep-text" aria-hidden="true">
                /
            </span>
        );
    }

    if (separator === 'dot') {
        return <span className="mp-breadcrumb-sep-dot" aria-hidden="true" />;
    }

    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-breadcrumb-sep-chevron"
            aria-hidden="true"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

/**
 * Reusable, accessible Breadcrumb navigation component for Motion Pub.
 *
 * @param {Object} props
 * @param {Array<{label: string, href?: string, onClick?: Function, icon?: React.ReactNode, current?: boolean, title?: string}>} [props.items]
 *   Explicit breadcrumb trail. If omitted, automatically derived from window.location.hash.
 * @param {boolean} [props.showHome=true] - Prepends a Home link to the trail unless already present.
 * @param {string} [props.homeLabel='Home'] - Label for the Home crumb.
 * @param {string} [props.homeHref='#home'] - Href for the Home crumb.
 * @param {boolean} [props.showHomeIcon=true] - Displays a compact home icon on the root Home item.
 * @param {boolean} [props.showBackButton=false] - Shows a quick back arrow button linked to the parent crumb.
 * @param {Function} [props.onBack] - Optional custom handler for the back button.
 * @param {'chevron'|'slash'|'dot'|React.ReactNode} [props.separator='chevron'] - Separator style between crumbs.
 * @param {'glass'|'minimal'|'inline'} [props.variant='glass'] - Visual theme variant.
 * @param {'left'|'center'|'right'} [props.align='left'] - Alignment when rendered standalone.
 * @param {boolean} [props.sticky=false] - Renders in a sticky bar aligned beneath the main navbar.
 * @param {number} [props.maxItems=4] - Collapses middle crumbs behind an expandable "..." button when exceeded.
 * @param {string} [props.ariaLabel='Breadcrumb'] - Accessible landmark label.
 * @param {string} [props.className=''] - Additional CSS classes.
 * @param {Object} [props.style] - Optional inline styles.
 */
export default function Breadcrumb({
    items,
    showHome = true,
    homeLabel = 'Home',
    homeHref = '#home',
    showHomeIcon = true,
    showBackButton = false,
    onBack,
    separator = 'chevron',
    variant = 'glass',
    align = 'left',
    sticky = false,
    maxItems = 4,
    ariaLabel = 'Breadcrumb',
    className = '',
    style,
}) {
    const [currentHash, setCurrentHash] = useState(() =>
        typeof window !== 'undefined' ? window.location.hash : ''
    );
    const [isExpanded, setIsExpanded] = useState(false);

    // Track hash changes when auto-deriving breadcrumbs
    useEffect(() => {
        if (Array.isArray(items)) return undefined;
        const handleHashChange = () => setCurrentHash(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [items]);

    // Build normalized crumb list
    const normalizedItems = useMemo(() => {
        const raw = Array.isArray(items) ? items.filter(Boolean) : getRouteBreadcrumbItems(currentHash);
        const list = [];

        const firstIsHome =
            raw.length > 0 &&
            (raw[0].isHome ||
                (typeof raw[0].href === 'string' &&
                    (raw[0].href === '#home' || raw[0].href === '#' || raw[0].href === '/')));

        if (showHome && !firstIsHome) {
            list.push({
                label: homeLabel,
                href: homeHref,
                isHome: true,
                title: `Go to ${homeLabel}`,
            });
        }

        raw.forEach((item) => {
            list.push({ ...item });
        });

        return list.map((item, idx) => ({
            ...item,
            isCurrent: item.current !== undefined ? Boolean(item.current) : idx === list.length - 1,
        }));
    }, [items, currentHash, showHome, homeLabel, homeHref]);

    // Reset collapse state when trail changes
    useEffect(() => {
        setIsExpanded(false);
    }, [normalizedItems.length, currentHash]);

    if (normalizedItems.length === 0) {
        return null;
    }

    // Collapse middle crumbs if trail exceeds maxItems
    const shouldCollapse = !isExpanded && maxItems >= 3 && normalizedItems.length > maxItems;
    const visibleItems = shouldCollapse
        ? [
            normalizedItems[0],
            { isEllipsis: true, hiddenCount: normalizedItems.length - (maxItems - 1) },
            ...normalizedItems.slice(-(maxItems - 2)),
        ]
        : normalizedItems;

    // Parent item for optional back button
    const parentItem =
        normalizedItems.length >= 2 ? normalizedItems[normalizedItems.length - 2] : null;

    const handleHomeOrLinkClick = (e, item) => {
        if (typeof item.onClick === 'function') {
            item.onClick(e);
        }

        if (!e.defaultPrevented && (item.href === '#home' || item.href === '#')) {
            const current = window.location.hash;
            if (!current || current === '#' || current === '#home' || current === '#site') {
                e.preventDefault();
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }
        }
    };

    const handleBackClick = (e) => {
        if (typeof onBack === 'function') {
            onBack(e);
            return;
        }

        if (parentItem) {
            if (typeof parentItem.onClick === 'function') {
                parentItem.onClick(e);
                return;
            }
            if (parentItem.href) {
                if (parentItem.href === '#home' && (!window.location.hash || window.location.hash === '#home')) {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                } else {
                    window.location.hash = parentItem.href;
                }
                return;
            }
        }

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.hash = homeHref;
        }
    };

    const navClasses = [
        'mp-breadcrumb',
        `mp-breadcrumb--${variant}`,
        `mp-breadcrumb--align-${align}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const backLabel = parentItem ? `Back to ${parentItem.label}` : 'Go back';

    const breadcrumbNav = (
        <nav className={navClasses} aria-label={ariaLabel} style={style}>
            <div className="mp-breadcrumb-surface">
                {showBackButton && (
                    <>
                        <button
                            type="button"
                            className="mp-breadcrumb-back-btn"
                            onClick={handleBackClick}
                            aria-label={backLabel}
                            title={backLabel}
                        >
                            <BackIcon />
                        </button>
                        <span className="mp-breadcrumb-divider" aria-hidden="true" />
                    </>
                )}

                <ol className="mp-breadcrumb-list">
                    {visibleItems.map((item, idx) => {
                        const isLast = idx === visibleItems.length - 1;
                        const key = item.isEllipsis
                            ? 'mp-breadcrumb-ellipsis'
                            : `${item.label}-${idx}`;

                        return (
                            <li key={key} className="mp-breadcrumb-item">
                                {item.isEllipsis ? (
                                    <button
                                        type="button"
                                        className="mp-breadcrumb-ellipsis-btn"
                                        onClick={() => setIsExpanded(true)}
                                        aria-label={`Show ${item.hiddenCount} hidden navigation levels`}
                                        title="Show full path"
                                    >
                                        &hellip;
                                    </button>
                                ) : item.isCurrent ? (
                                    <span
                                        className="mp-breadcrumb-current"
                                        aria-current="page"
                                        title={item.title || item.label}
                                    >
                                        {(variant === 'glass' || variant === 'navbar') && (
                                            <span className="mp-breadcrumb-current-dot" aria-hidden="true" />
                                        )}
                                        {item.icon ? (
                                            <span className="mp-breadcrumb-item-icon">{item.icon}</span>
                                        ) : item.isHome && showHomeIcon ? (
                                            <HomeIcon />
                                        ) : null}
                                        <span className="mp-breadcrumb-label">{item.label}</span>
                                    </span>
                                ) : item.href ? (
                                    <a
                                        href={item.href}
                                        className={`mp-breadcrumb-link ${item.isHome ? 'is-home' : ''}`}
                                        onClick={(e) => handleHomeOrLinkClick(e, item)}
                                        title={item.title || `Go to ${item.label}`}
                                    >
                                        {item.icon ? (
                                            <span className="mp-breadcrumb-item-icon">{item.icon}</span>
                                        ) : item.isHome && showHomeIcon ? (
                                            <HomeIcon />
                                        ) : null}
                                        <span className="mp-breadcrumb-label">{item.label}</span>
                                    </a>
                                ) : typeof item.onClick === 'function' ? (
                                    <button
                                        type="button"
                                        className={`mp-breadcrumb-link mp-breadcrumb-btn-link ${item.isHome ? 'is-home' : ''}`}
                                        onClick={item.onClick}
                                        title={item.title || `Go to ${item.label}`}
                                    >
                                        {item.icon ? (
                                            <span className="mp-breadcrumb-item-icon">{item.icon}</span>
                                        ) : item.isHome && showHomeIcon ? (
                                            <HomeIcon />
                                        ) : null}
                                        <span className="mp-breadcrumb-label">{item.label}</span>
                                    </button>
                                ) : (
                                    <span className="mp-breadcrumb-static" title={item.title || item.label}>
                                        {item.icon ? (
                                            <span className="mp-breadcrumb-item-icon">{item.icon}</span>
                                        ) : null}
                                        <span className="mp-breadcrumb-label">{item.label}</span>
                                    </span>
                                )}

                                {!isLast && (
                                    <span className="mp-breadcrumb-sep" aria-hidden="true">
                                        {renderSeparator(separator)}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );

    if (sticky) {
        return (
            <div className="mp-breadcrumb-sticky">
                <div className={`mp-breadcrumb-sticky-inner mp-breadcrumb-sticky--${align}`}>
                    {breadcrumbNav}
                </div>
            </div>
        );
    }

    return breadcrumbNav;
}

export { Breadcrumb };
