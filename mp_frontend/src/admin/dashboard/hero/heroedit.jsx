import { useState, useEffect, useRef } from 'react';
import defaultVideo from '../../../assets/videos/default.mp4';
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

export default function HeroEdit({ onHeroTextChange, activeSection = 'all', onSelectSection }) {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const previewVideoRef = useRef(null);

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

    const [isSavingText, setIsSavingText] = useState(false);
    const [alert, setAlert] = useState(null);

    // Live Simulator state
    const [simText, setSimText] = useState('');
    const [simKey, setSimKey] = useState(0);

    // Typing speed state (ms per character, default 40ms, stepped by 10ms)
    const [typingSpeed, setTypingSpeed] = useState(() => {
        const saved = localStorage.getItem('mp_typing_speed');
        return saved ? parseInt(saved, 10) : 40;
    });

    // Cloudinary Hero Video State
    const [videoUrl, setVideoUrl] = useState(() => {
        return localStorage.getItem('mp_hero_video') || null;
    });
    const [videoUpdatedAt, setVideoUpdatedAt] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isResettingVideo, setIsResettingVideo] = useState(false);
    const [isCleaningStorage, setIsCleaningStorage] = useState(false);
    const [autoDeletePrevious, setAutoDeletePrevious] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);

    const handleSpeedChange = (newSpeed) => {
        const stepped = Math.max(10, Math.min(300, Math.round(newSpeed / 10) * 10));
        setTypingSpeed(stepped);
        localStorage.setItem('mp_typing_speed', String(stepped));
        window.dispatchEvent(new CustomEvent('hero-speed-updated', {
            detail: { speed: stepped }
        }));
        setSimKey(k => k + 1);
    };

    // Fetch current hero text and video from backend database on mount
    useEffect(() => {
        fetch('/api/content/hero')
            .then(res => res.json())
            .then(data => {
                if (data?.success) {
                    if (data.fullText) {
                        setSavedHeroText(data.fullText);
                        setHeroText(data.fullText);
                        setStatementBody(getStatementBody(data.fullText));
                        setIsResetToDefault(false);
                        localStorage.setItem('mp_hero_text', data.fullText);
                        if (onHeroTextChange) {
                            onHeroTextChange(data.fullText);
                        }
                    }
                    if (data.videoUrl) {
                        setVideoUrl(data.videoUrl);
                        setVideoUpdatedAt(data.videoUpdatedAt || null);
                        localStorage.setItem('mp_hero_video', data.videoUrl);
                    } else {
                        setVideoUrl(null);
                        localStorage.removeItem('mp_hero_video');
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
        const clean = rawVal.replace(/^Motion\s*Pub\s*/i, '');
        const newFull = buildFullStatement(clean);
        setStatementBody(clean);
        setHeroText(newFull);
        setIsResetToDefault(false);
        if (onHeroTextChange) {
            onHeroTextChange(newFull);
        }
    };

    // Handle Save Hero Text Statement
    const handleSaveHero = async () => {
        const fullTextToSave = buildFullStatement(statementBody);
        const trimmed = fullTextToSave.trim();
        if (!statementBody.trim()) {
            setAlert({ type: 'error', message: 'Hero statement cannot be empty. Please enter text after "Motion Pub".' });
            return;
        }

        setIsSavingText(true);
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
                message: 'Hero statement successfully saved!'
            });

            setSimKey(k => k + 1);
        } catch (err) {
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
                message: 'Saved locally! (Backend notice: ' + err.message + ')'
            });
        } finally {
            setIsSavingText(false);
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

    // ==========================================
    // Cloudinary Hero Video Handlers
    // ==========================================

    const validateAndProcessFile = (file) => {
        if (!file) return;

        // Check format
        const validFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
        const isValidMime = validFormats.includes(file.type) || file.type.startsWith('video/');
        const isValidExt = /\.(mp4|webm|mov|mkv)$/i.test(file.name);

        if (!isValidMime && !isValidExt) {
            setAlert({
                type: 'error',
                message: 'Invalid file format. Please upload an MP4, WebM, or MOV video.'
            });
            return;
        }

        // Limit size: 100MB
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            setAlert({
                type: 'error',
                message: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 100MB limit.`
            });
            return;
        }

        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setFilePreviewUrl(previewUrl);
        setIsVideoPlaying(true);
        setAlert(null);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndProcessFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndProcessFile(file);
        }
    };

    const handleClearSelection = () => {
        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
        }
        setSelectedFile(null);
        setFilePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload Selected Video to Cloudinary (with automatic deletion of previous video to eliminate storage waste)
    const handleUploadVideo = async () => {
        if (!selectedFile) return;

        setIsUploadingVideo(true);
        setAlert(null);

        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('deletePrevious', autoDeletePrevious ? 'true' : 'false');

        try {
            const res = await fetch('/api/content/hero/video', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to upload video to Cloudinary.');
            }

            // Successfully uploaded and saved in DB
            setVideoUrl(data.videoUrl);
            setVideoUpdatedAt(data.videoUpdatedAt || new Date().toISOString());
            localStorage.setItem('mp_hero_video', data.videoUrl);

            // Broadcast real-time event to landing page
            window.dispatchEvent(new CustomEvent('hero-video-updated', {
                detail: { videoUrl: data.videoUrl }
            }));

            // Clear temporary preview
            handleClearSelection();

            setAlert({
                type: 'success',
                message: data.message || 'Showcase video successfully uploaded to Cloudinary and live on your Hero section!'
            });
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            setAlert({
                type: 'error',
                message: err.message || 'Error uploading video to Cloudinary.'
            });
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // Permanently Delete Video from Cloudinary (Frees Cloudinary Storage Quota)
    const handleDeleteVideo = async () => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this video from Cloudinary? This will permanently remove the asset from Cloudinary storage to free your quota and restore the default template video.'
        );
        if (!confirmDelete) return;

        setIsResettingVideo(true);
        setAlert(null);

        try {
            const res = await fetch('/api/content/hero/video', {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete video from Cloudinary.');
            }

            setVideoUrl(null);
            setVideoUpdatedAt(null);
            localStorage.removeItem('mp_hero_video');

            window.dispatchEvent(new CustomEvent('hero-video-updated', {
                detail: { videoUrl: null }
            }));

            handleClearSelection();

            setAlert({
                type: 'success',
                message: data.message || 'Hero video permanently deleted from Cloudinary and reset to default template video.'
            });
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message || 'Failed to delete hero video from Cloudinary.'
            });
        } finally {
            setIsResettingVideo(false);
        }
    };

    // Clean Up All Orphaned / Unused Videos from Cloudinary Storage
    const handleCleanupStorage = async () => {
        setIsCleaningStorage(true);
        setAlert(null);

        try {
            const res = await fetch('/api/content/hero/video/cleanup', {
                method: 'POST',
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to clean up Cloudinary storage.');
            }

            setAlert({
                type: 'success',
                message: data.message
            });
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message || 'Error cleaning up Cloudinary storage.'
            });
        } finally {
            setIsCleaningStorage(false);
        }
    };

    const toggleVideoPlayback = () => {
        if (!previewVideoRef.current) return;
        if (isVideoPlaying) {
            previewVideoRef.current.pause();
            setIsVideoPlaying(false);
        } else {
            previewVideoRef.current.play();
            setIsVideoPlaying(true);
        }
    };

    const toggleVideoMute = () => {
        if (!previewVideoRef.current) return;
        previewVideoRef.current.muted = !isVideoMuted;
        setIsVideoMuted(!isVideoMuted);
    };

    // Format bytes to human readable
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Active video source for preview
    const activePreviewSrc = filePreviewUrl || videoUrl || defaultVideo;

    // Has text changes
    const hasTextChanges = (heroText.trim() !== savedHeroText.trim() || isResetToDefault) && Boolean(statementBody.trim());
    const isSaveDisabled = isSavingText || !hasTextChanges;

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

    const showTextSection = activeSection === 'all' || activeSection === 'text';
    const showVideoSection = activeSection === 'all' || activeSection === 'video';

    return (
        <div className="mp-hero-management-page">
            {/* Alert Banner */}
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

            {/* Page Header */}
            <div className="mp-page-header">
                <div className="mp-page-header-text">
                    <h2 className="mp-page-title">
                        {activeSection === 'text'
                            ? 'Hero Text Statement'
                            : activeSection === 'video'
                            ? 'Hero 3D Showcase Video'
                            : 'Hero Section CMS'}
                    </h2>
                    <p className="mp-page-desc">
                        {activeSection === 'text'
                            ? 'Configure the real-time typing statement rendered on the landing page.'
                            : activeSection === 'video'
                            ? 'Upload and manage high-definition 3D showcase video hosted on Cloudinary.'
                            : 'Customize the live typing statement and manage the 3D showcase video streamed via Cloudinary.'}
                    </p>
                </div>

                {/* Sub-menu Switcher Pill Tabs */}
                <div className="mp-hero-subnav-pills">
                    <button
                        type="button"
                        className={`mp-hero-pill-btn ${activeSection === 'all' ? 'active' : ''}`}
                        onClick={() => onSelectSection?.('all')}
                        title="Show all Hero sections"
                    >
                        <span>All</span>
                    </button>
                    <button
                        type="button"
                        className={`mp-hero-pill-btn ${activeSection === 'text' ? 'active' : ''}`}
                        onClick={() => onSelectSection?.('text')}
                        title="Show Text Statement section"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="4 7 4 4 20 4 20 7"></polyline>
                            <line x1="9" y1="20" x2="15" y2="20"></line>
                            <line x1="12" y1="4" x2="12" y2="20"></line>
                        </svg>
                        <span>Text Section</span>
                    </button>
                    <button
                        type="button"
                        className={`mp-hero-pill-btn ${activeSection === 'video' ? 'active' : ''}`}
                        onClick={() => onSelectSection?.('video')}
                        title="Show Video Showcase section"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                        <span>Video Section</span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 1: HERO TYPING STATEMENT                          */}
            {/* ========================================================= */}
            {showTextSection && (
                <>
                    <div className="mp-section-divider">
                        <div className="mp-section-title-wrap">
                            <span className="mp-section-badge">Hero Typography</span>
                            <h3 className="mp-section-heading">Hero Section Statement</h3>
                        </div>
                        <p className="mp-section-subheading">
                            Edit the animated typing sentence rendered dynamically on the Hero section.
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
                                isSavingText
                                    ? 'Saving...'
                                    : !hasTextChanges
                                        ? 'No changes to save'
                                        : 'Save changes to hero section'
                            }
                        >
                            {isSavingText ? (
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
            )}

            {/* ========================================================= */}
            {/* SECTION 2: CLOUDINARY 3D SHOWCASE VIDEO                   */}
            {/* ========================================================= */}
            {showVideoSection && (
                <>
                    <div className="mp-section-divider">
                        <div className="mp-section-title-wrap">
                            <span className="mp-section-badge">Cloudinary Media</span>
                            <h3 className="mp-section-heading">Hero 3D Showcase Video</h3>
                        </div>
                        <p className="mp-section-subheading">
                            Upload and manage the video featured inside the interactive 3D card display on the landing page.
                        </p>
                    </div>

            <div className="mp-hero-editor-grid mp-video-management-grid">
                {/* Left Card: Video Upload Zone & Controls */}
                <div className="mp-card mp-video-uploader-card">
                    <div className="mp-card-header">
                        <div className="mp-card-title-group">
                            <span className="mp-card-title">Video Upload</span>
                            <span className="mp-card-tag">CDN Powered</span>
                        </div>

                        {/* Active Video Status Badge */}
                        <div className="mp-active-status-wrap">
                            {videoUrl ? (
                                <span className="mp-status-pill online" title="Video is live via Cloudinary CDN">
                                    <span className="mp-status-pulse" />
                                    Cloudinary Active
                                </span>
                            ) : (
                                <span className="mp-status-pill default" title="Using built-in local default video">
                                    <span className="mp-status-dot-blue" />
                                    Default Template
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                    />

                    {/* Drag & Drop Upload Area */}
                    <div
                        className={`mp-video-dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="mp-dropzone-glow" />
                        <div className="mp-dropzone-inner">
                            <div className="mp-dropzone-icon-box">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>

                            <div className="mp-dropzone-copy">
                                <p className="mp-dropzone-headline">
                                    {selectedFile ? 'Change Selected Video' : 'Drag & drop video here, or Browse'}
                                </p>
                                <span className="mp-dropzone-sub">
                                    Supports MP4, WebM, MOV up to 100MB (High Definition)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Selected File Details Chip */}
                    {selectedFile && (
                        <div className="mp-selected-file-chip">
                            <div className="mp-file-info-left">
                                <div className="mp-file-video-badge">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                    </svg>
                                </div>
                                <div className="mp-file-meta">
                                    <span className="mp-file-name" title={selectedFile.name}>{selectedFile.name}</span>
                                    <span className="mp-file-size">{formatBytes(selectedFile.size)} • Ready to upload</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mp-btn-clear-selection"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSelection();
                                }}
                                title="Remove selected file"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Storage Waste Prevention Option when a file is selected */}
                    {selectedFile && (
                        <div className="mp-storage-options-wrap">
                            <label className="mp-auto-delete-checkbox-label" title="When enabled, previous hero videos are permanently removed from Cloudinary">
                                <input
                                    type="checkbox"
                                    checked={autoDeletePrevious}
                                    onChange={(e) => setAutoDeletePrevious(e.target.checked)}
                                />
                                <span>Delete previously uploaded video from Cloudinary upon save (Saves storage quota)</span>
                            </label>
                        </div>
                    )}

                    {/* Upload & Storage Management Actions */}
                    <div className="mp-video-actions-row">
                        <button
                            type="button"
                            className="mp-btn-upload-video"
                            onClick={handleUploadVideo}
                            disabled={!selectedFile || isUploadingVideo}
                        >
                            {isUploadingVideo ? (
                                <>
                                    <span className="mp-spinner" />
                                    <span>Uploading & Cleaning Storage...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v8"></path>
                                        <path d="m16 6-4-4-4 4"></path>
                                        <rect width="20" height="8" x="2" y="14" rx="2"></rect>
                                        <path d="M6 18h.01"></path>
                                        <path d="M10 18h.01"></path>
                                    </svg>
                                    <span>Upload Video to Cloudinary</span>
                                </>
                            )}
                        </button>

                        {/* Explicit button to delete previously uploaded video from Cloudinary */}
                        {videoUrl && (
                            <button
                                type="button"
                                className="mp-btn-delete-previous-video"
                                onClick={handleDeleteVideo}
                                disabled={isResettingVideo || isUploadingVideo}
                                title="Permanently delete this video from Cloudinary to free storage and reset to default video"
                            >
                                {isResettingVideo ? (
                                    <>
                                        <span className="mp-spinner red" />
                                        <span>Deleting from Cloudinary...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                        <span>Delete Previously Uploaded Video</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Clean up orphaned / older videos from Cloudinary */}
                        <button
                            type="button"
                            className="mp-btn-cleanup-storage"
                            onClick={handleCleanupStorage}
                            disabled={isCleaningStorage || isUploadingVideo}
                            title="Scan Cloudinary and purge any unused older videos in the hero folder"
                        >
                            {isCleaningStorage ? (
                                <>
                                    <span className="mp-spinner subtle" />
                                    <span>Cleaning Storage...</span>
                                </>
                            ) : (
                                <span>🧹 Clean Up Cloudinary Storage</span>
                            )}
                        </button>
                    </div>

                    {/* CDN & Live Status Details */}
                    {videoUrl && (
                        <div className="mp-cloudinary-info-box">
                            <div className="mp-cloudinary-meta-row">
                                <span className="mp-meta-label">Cloudinary URL:</span>
                                <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mp-cloudinary-link"
                                >
                                    Open Asset in New Tab ↗
                                </a>
                            </div>
                            {videoUpdatedAt && (
                                <div className="mp-cloudinary-meta-row">
                                    <span className="mp-meta-label">Last Updated:</span>
                                    <span className="mp-meta-val">
                                        {new Date(videoUpdatedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Card: Live Video Player Preview */}
                <div className="mp-card mp-video-preview-card">
                    <div className="mp-card-header">
                        <div className="mp-card-title-group">
                            <span className="mp-card-title">Live 3D Card Video Preview</span>
                        </div>
                        <div className="mp-preview-source-tag">
                            {filePreviewUrl ? (
                                <span className="mp-tag-staged">● Selected File Preview</span>
                            ) : videoUrl ? (
                                <span className="mp-tag-live">● Cloudinary Live</span>
                            ) : (
                                <span className="mp-tag-default">● Motion Pub Default</span>
                            )}
                        </div>
                    </div>

                    {/* Preview Player Frame */}
                    <div className="mp-video-player-container">
                        <video
                            ref={previewVideoRef}
                            key={activePreviewSrc}
                            src={activePreviewSrc}
                            className="mp-preview-video-element"
                            autoPlay
                            loop
                            muted={isVideoMuted}
                            playsInline
                        />

                        {/* Player Overlay Controls */}
                        <div className="mp-player-overlay-bar">
                            <div className="mp-player-controls-left">
                                <button
                                    type="button"
                                    className="mp-player-btn"
                                    onClick={toggleVideoPlayback}
                                    title={isVideoPlaying ? 'Pause video' : 'Play video'}
                                >
                                    {isVideoPlaying ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="6" y="4" width="4" height="16"></rect>
                                            <rect x="14" y="4" width="4" height="16"></rect>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="mp-player-btn"
                                    onClick={toggleVideoMute}
                                    title={isVideoMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isVideoMuted ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                            <line x1="12" y1="19" x2="12" y2="23"></line>
                                            <line x1="8" y1="23" x2="16" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <span className="mp-player-badge">Looping Card Preview</span>
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
