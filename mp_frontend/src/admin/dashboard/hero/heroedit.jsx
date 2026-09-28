import { useState, useEffect, useRef } from 'react';
import './heroedit.css';

const BRAND_PREFIX = "Motion Pub";

const getStatementBody = (fullText) => {
    if (!fullText) return '';
    return fullText.replace(/^Motion\s*Pub\s*/i, '');
};

const buildFullStatement = (body) => {
    const trimmed = (body || '').trimStart();
    return trimmed ? `${BRAND_PREFIX} ${trimmed}` : BRAND_PREFIX;
};

const DEFAULT_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling.";

export default function HeroEdit({ onHeroTextChange }) {
    const textareaRef = useRef(null);

    // Initial persisted hero statement
    const initialHeroText = localStorage.getItem('mp_hero_text') || DEFAULT_HERO_TEXT;

    // Persisted text from database/localStorage for dirty checking
    const [savedHeroText, setSavedHeroText] = useState(initialHeroText);

    // Hero Section text state (active editing)
    const [heroText, setHeroText] = useState(initialHeroText);

    // Statement body state (editable portion after 'Motion Pub')
    const [statementBody, setStatementBody] = useState(() => {
        return getStatementBody(initialHeroText);
    });

    // Track if user explicitly clicked "Reset Default"
    const [isResetToDefault, setIsResetToDefault] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    // Live Simulator state
    const [simText, setSimText] = useState('');
    const [simKey, setSimKey] = useState(0);

    // Typing speed state (ms per character, default 40ms, stepped by 10ms)
    const [typingSpeed, setTypingSpeed] = useState(() => {
        const saved = localStorage.getItem('mp_typing_speed');
        return saved ? parseInt(saved, 10) : 40;
    });

    const handleSpeedChange = (newSpeed) => {
        const stepped = Math.max(10, Math.min(300, Math.round(newSpeed / 10) * 10));
        setTypingSpeed(stepped);
        localStorage.setItem('mp_typing_speed', String(stepped));
        window.dispatchEvent(new CustomEvent('hero-speed-updated', {
            detail: { speed: stepped }
        }));
        setSimKey(k => k + 1);
    };

    // Fetch current hero text from backend database on mount
    useEffect(() => {
        fetch('/api/content/hero')
            .then(res => res.json())
            .then(data => {
                if (data?.success && data?.fullText) {
                    setSavedHeroText(data.fullText);
                    setHeroText(data.fullText);
                    setStatementBody(getStatementBody(data.fullText));
                    setIsResetToDefault(false);
                    localStorage.setItem('mp_hero_text', data.fullText);
                    if (onHeroTextChange) {
                        onHeroTextChange(data.fullText);
                    }
                }
            })
            .catch(() => {
                // Fallback to local storage
            });
    }, [onHeroTextChange]);

    // Simulator typing loop
    useEffect(() => {
        let index = 0;
        setSimText('');

        const timer = setInterval(() => {
            index++;
            if (index <= heroText.length) {
                setSimText(heroText.slice(0, index));
            } else {
                clearInterval(timer);
            }
        }, typingSpeed);

        return () => clearInterval(timer);
    }, [heroText, simKey, typingSpeed]);

    const handleBodyChange = (e) => {
        const rawVal = e.target.value;
        // Strip leading "Motion Pub" if user pastes a complete sentence
        const clean = rawVal.replace(/^Motion\s*Pub\s*/i, '');
        const newFull = buildFullStatement(clean);
        setStatementBody(clean);
        setHeroText(newFull);
        setIsResetToDefault(false);
        if (onHeroTextChange) {
            onHeroTextChange(newFull);
        }
    };

    // Handle Save to MongoDB Atlas and Local Storage
    const handleSaveHero = async () => {
        const fullTextToSave = buildFullStatement(statementBody);
        const trimmed = fullTextToSave.trim();
        if (!statementBody.trim()) {
            setAlert({ type: 'error', message: 'Hero statement cannot be empty. Please enter text after "Motion Pub".' });
            return;
        }

        setIsSaving(true);
        setAlert(null);

        try {
            const res = await fetch('/api/content/hero', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullText: trimmed })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to save to database');
            }

            // 1. Update localStorage
            localStorage.setItem('mp_hero_text', trimmed);

            // 2. Broadcast custom event to live landing page
            window.dispatchEvent(new CustomEvent('hero-text-updated', {
                detail: { fullText: trimmed }
            }));

            setSavedHeroText(trimmed);
            setIsResetToDefault(false);
            if (onHeroTextChange) {
                onHeroTextChange(trimmed);
            }

            setAlert({
                type: 'success',
                message: 'Hero statement successfully saved!'
            });

            // Restart preview
            setSimKey(k => k + 1);
        } catch (err) {
            // Still persist locally so admin experiences immediate update
            localStorage.setItem('mp_hero_text', trimmed);
            window.dispatchEvent(new CustomEvent('hero-text-updated', {
                detail: { fullText: trimmed }
            }));

            setSavedHeroText(trimmed);
            setIsResetToDefault(false);
            if (onHeroTextChange) {
                onHeroTextChange(trimmed);
            }

            setAlert({
                type: 'success',
                message: 'Saved locally! (Backend update notice: ' + err.message + ')'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDefault = () => {
        setHeroText(DEFAULT_HERO_TEXT);
        setStatementBody(getStatementBody(DEFAULT_HERO_TEXT));
        setIsResetToDefault(true);
        setSimKey(k => k + 1);
        if (onHeroTextChange) {
            onHeroTextChange(DEFAULT_HERO_TEXT);
        }
        setAlert({
            type: 'success',
            message: 'Reset to default template text. Click "Save Changes to Hero" to persist.'
        });
    };

    // Has changes: either text differs from saved, or user explicitly hit Reset Default, and statement is not empty
    const hasChanges = (heroText.trim() !== savedHeroText.trim() || isResetToDefault) && Boolean(statementBody.trim());
    const isSaveDisabled = isSaving || !hasChanges;

    const renderSimContent = () => {
        const brandName = 'Motion Pub';
        if (simText.length <= brandName.length) {
            return <span className="mp-mockup-brand">{simText}</span>;
        }
        return (
            <>
                <span className="mp-mockup-brand">{brandName}</span>
                {simText.slice(brandName.length)}
            </>
        );
    };

    return (
        <>
            {/* Alert Notifications */}
            {alert && (
                <div className={`mp-alert-banner ${alert.type}`}>
                    <div className="mp-alert-left">
                        {alert.type === 'success' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                        <span>{alert.message}</span>
                    </div>
                    <button
                        type="button"
                        className="mp-alert-close"
                        onClick={() => setAlert(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="mp-page-header">
                <h2 className="mp-page-title">Hero Section Statement</h2>
                <p className="mp-page-desc">
                    Edit the core typing sentence rendered in the Hero section.
                </p>
            </div>

            <div className="mp-hero-editor-grid">
                {/* Left Card: Text Editor */}
                <div className="mp-card">
                    <div className="mp-card-header">
                        <div className="mp-card-title-group">
                            <span className="mp-card-title">Typing Statement</span>
                        </div>
                    </div>

                    <div className="mp-field-group">
                        <div className="mp-field-label-row">
                            <label htmlFor="hero-text-input" className="mp-field-label">
                                Statement Content
                            </label>
                            <span className="mp-char-count">{heroText.length} characters (10 fixed)</span>
                        </div>

                        <div
                            className="mp-prefixed-editor"
                            onClick={() => textareaRef.current?.focus()}
                        >
                            <div className="mp-prefix-header">
                                <div className="mp-prefix-pill" title="Brand prefix is fixed and cannot be edited">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <span>Motion Pub</span>
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                id="hero-text-input"
                                className="mp-prefixed-textarea"
                                value={statementBody}
                                onChange={handleBodyChange}
                                placeholder="transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mp-editor-actions">
                        <button
                            type="button"
                            className="mp-btn-save"
                            onClick={handleSaveHero}
                            disabled={isSaveDisabled}
                            title={
                                isSaving
                                    ? 'Saving...'
                                    : !hasChanges
                                        ? 'No changes to save'
                                        : 'Save changes to hero section'
                            }
                        >
                            {isSaving ? (
                                <span>Saving to Database...</span>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    <span>Save Changes to Hero</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className="mp-btn-reset"
                            onClick={handleResetDefault}
                        >
                            Reset Default
                        </button>
                    </div>
                </div>

                {/* Right Card: Live Interactive Preview */}
                <div className="mp-preview-card">
                    <div className="mp-preview-badge-row">
                        <span className="mp-preview-tag">
                            <span className="mp-live-status-dot" />
                            Live Typing Simulator
                        </span>
                        <button
                            type="button"
                            className="mp-btn-restart-sim"
                            onClick={() => setSimKey(k => k + 1)}
                            title="Replay typing animation"
                        >
                            ↺ Replay
                        </button>
                    </div>

                    <div className="mp-preview-mockup-window">
                        <p className="mp-mockup-typing-text">
                            {renderSimContent()}
                            <span className="mp-mockup-cursor">|</span>
                        </p>
                    </div>

                    <div className="mp-preview-meta">
                        <div className="mp-speed-control-group">
                            <div className="mp-speed-label-wrap">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span className="mp-speed-label">Speed:</span>
                            </div>

                            <div className="mp-speed-stepper">
                                <button
                                    type="button"
                                    className="mp-speed-btn"
                                    onClick={() => handleSpeedChange(typingSpeed - 10)}
                                    disabled={typingSpeed <= 10}
                                    title="Faster (−10ms)"
                                >
                                    −
                                </button>

                                <div className="mp-speed-display">
                                    <input
                                        type="number"
                                        className="mp-speed-input"
                                        value={typingSpeed}
                                        step={10}
                                        min={10}
                                        max={300}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val)) {
                                                handleSpeedChange(val);
                                            }
                                        }}
                                    />
                                    <span className="mp-speed-unit">ms / char</span>
                                </div>

                                <button
                                    type="button"
                                    className="mp-speed-btn"
                                    onClick={() => handleSpeedChange(typingSpeed + 10)}
                                    disabled={typingSpeed >= 300}
                                    title="Slower (+10ms)"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="mp-speed-reset-btn"
                            onClick={() => handleSpeedChange(40)}
                            title="Reset to default 40ms speed"
                            style={{ visibility: typingSpeed === 40 ? 'hidden' : 'visible' }}
                        >
                            Default (40ms)
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
