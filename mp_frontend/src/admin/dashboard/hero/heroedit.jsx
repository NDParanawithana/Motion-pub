import { useState, useEffect, useRef } from 'react';
import defaultVideo from '../../../assets/videos/default.mp4';
import './heroedit.css';

const LEGACY_HERO_TITLE = "We Create Videos That Make Brands Stand Out.";
const LEGACY_HERO_TEXT = "Motion Pub transforms your ideas into powerful visual experiences through creative editing, motion, and storytelling.";
const DEFAULT_HERO_TITLE = "We make videos that\nMake Brands Standout";
const DEFAULT_HERO_PARAGRAPH = "Powerful video content for businesses and personal brands ready to capture attention, build influence, and grow.";

const resolveTitle = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed || trimmed === LEGACY_HERO_TITLE) {
        return DEFAULT_HERO_TITLE;
    }
    return trimmed;
};

const resolveParagraph = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed || trimmed === LEGACY_HERO_TEXT) {
        return DEFAULT_HERO_PARAGRAPH;
    }
    return trimmed;
};

export default function HeroEdit({ onHeroTextChange, activeSection = 'all', onSelectSection }) {
    const fileInputRef = useRef(null);
    const previewVideoRef = useRef(null);

    // Initial persisted hero title & paragraph
    const initialHeroTitle = resolveTitle(localStorage.getItem('mp_hero_title'));
    const initialHeroParagraph = resolveParagraph(
        localStorage.getItem('mp_hero_paragraph') || localStorage.getItem('mp_hero_text')
    );

    // Persisted values from database/localStorage for dirty checking
    const [savedHeroTitle, setSavedHeroTitle] = useState(initialHeroTitle);
    const [savedHeroParagraph, setSavedHeroParagraph] = useState(initialHeroParagraph);

    // Active editing values
    const [heroTitle, setHeroTitle] = useState(initialHeroTitle);
    const [heroParagraph, setHeroParagraph] = useState(initialHeroParagraph);

    // Track if user explicitly clicked "Reset Default"
    const [isResetToDefault, setIsResetToDefault] = useState(false);

    const [isSavingText, setIsSavingText] = useState(false);
    const [alert, setAlert] = useState(null);

    // Live Preview replay key
    const [previewKey, setPreviewKey] = useState(0);

    // Hero Background Media State (supports both Video and Image)
    const [videoUrl, setVideoUrl] = useState(() => {
        return localStorage.getItem('mp_hero_video') || null;
    });
    const [mediaType, setMediaType] = useState(() => {
        return localStorage.getItem('mp_hero_media_type') || 'video';
    });
    const [uploadMode, setUploadMode] = useState(() => {
        return localStorage.getItem('mp_hero_media_type') || 'video';
    });
    const [videoUpdatedAt, setVideoUpdatedAt] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileType, setSelectedFileType] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isResettingVideo, setIsResettingVideo] = useState(false);
    const [isCleaningStorage, setIsCleaningStorage] = useState(false);
    const [autoDeletePrevious, setAutoDeletePrevious] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);

    // Fetch current hero title, paragraph and background media from backend database on mount
    useEffect(() => {
        fetch('/api/content/hero')
            .then(res => res.json())
            .then(data => {
                if (data?.success) {
                    const fetchedTitle = resolveTitle(data.title);
                    const fetchedParagraph = resolveParagraph(data.paragraph || data.fullText);

                    setSavedHeroTitle(fetchedTitle);
                    setHeroTitle(fetchedTitle);
                    setSavedHeroParagraph(fetchedParagraph);
                    setHeroParagraph(fetchedParagraph);
                    setIsResetToDefault(false);

                    localStorage.setItem('mp_hero_title', fetchedTitle);
                    localStorage.setItem('mp_hero_paragraph', fetchedParagraph);
                    localStorage.setItem('mp_hero_text', fetchedParagraph);

                    if (onHeroTextChange) {
                        onHeroTextChange(fetchedParagraph);
                    }

                    const incomingType = data.mediaType === 'image' ? 'image' : 'video';
                    if (data.videoUrl) {
                        setVideoUrl(data.videoUrl);
                        setMediaType(incomingType);
                        setUploadMode(incomingType);
                        setVideoUpdatedAt(data.videoUpdatedAt || null);
                        localStorage.setItem('mp_hero_video', data.videoUrl);
                        localStorage.setItem('mp_hero_media_type', incomingType);
                    } else {
                        setVideoUrl(null);
                        setMediaType('video');
                        localStorage.removeItem('mp_hero_video');
                        localStorage.removeItem('mp_hero_media_type');
                    }
                }
            })
            .catch(() => {
                // Fallback to local storage
            });
    }, [onHeroTextChange]);

    const handleTitleChange = (e) => {
        setHeroTitle(e.target.value);
        setIsResetToDefault(false);
    };

    const handleParagraphChange = (e) => {
        const val = e.target.value;
        setHeroParagraph(val);
        setIsResetToDefault(false);
        if (onHeroTextChange) {
            onHeroTextChange(val);
        }
    };

    // Handle Save Hero Title & Paragraph
    const handleSaveHero = async () => {
        const trimmedTitle = heroTitle.trim();
        const trimmedParagraph = heroParagraph.trim();

        if (!trimmedTitle) {
            setAlert({ type: 'error', message: 'Hero title cannot be empty. Please enter a title.' });
            return;
        }
        if (!trimmedParagraph) {
            setAlert({ type: 'error', message: 'Hero paragraph cannot be empty. Please enter a paragraph.' });
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
                body: JSON.stringify({
                    title: trimmedTitle,
                    paragraph: trimmedParagraph,
                    fullText: trimmedParagraph
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to save changes');
            }

            localStorage.setItem('mp_hero_title', trimmedTitle);
            localStorage.setItem('mp_hero_paragraph', trimmedParagraph);
            localStorage.setItem('mp_hero_text', trimmedParagraph);

            window.dispatchEvent(new CustomEvent('hero-text-updated', {
                detail: {
                    title: trimmedTitle,
                    paragraph: trimmedParagraph,
                    fullText: trimmedParagraph
                }
            }));

            setHeroTitle(trimmedTitle);
            setHeroParagraph(trimmedParagraph);
            setSavedHeroTitle(trimmedTitle);
            setSavedHeroParagraph(trimmedParagraph);
            setIsResetToDefault(false);

            if (onHeroTextChange) {
                onHeroTextChange(trimmedParagraph);
            }

            setAlert({
                type: 'success',
                message: 'Hero title and paragraph successfully saved!'
            });

            setPreviewKey(k => k + 1);
        } catch (err) {
            localStorage.setItem('mp_hero_title', trimmedTitle);
            localStorage.setItem('mp_hero_paragraph', trimmedParagraph);
            localStorage.setItem('mp_hero_text', trimmedParagraph);

            window.dispatchEvent(new CustomEvent('hero-text-updated', {
                detail: {
                    title: trimmedTitle,
                    paragraph: trimmedParagraph,
                    fullText: trimmedParagraph
                }
            }));

            setHeroTitle(trimmedTitle);
            setHeroParagraph(trimmedParagraph);
            setSavedHeroTitle(trimmedTitle);
            setSavedHeroParagraph(trimmedParagraph);
            setIsResetToDefault(false);

            if (onHeroTextChange) {
                onHeroTextChange(trimmedParagraph);
            }

            setAlert({
                type: 'success',
                message: 'Saved locally! (' + err.message + ')'
            });
        } finally {
            setIsSavingText(false);
        }
    };

    const handleResetDefault = () => {
        setHeroTitle(DEFAULT_HERO_TITLE);
        setHeroParagraph(DEFAULT_HERO_PARAGRAPH);
        setIsResetToDefault(true);
        setPreviewKey(k => k + 1);
        if (onHeroTextChange) {
            onHeroTextChange(DEFAULT_HERO_PARAGRAPH);
        }
        setAlert({
            type: 'success',
            message: 'Reset to default title and paragraph. Click "Save Changes" to apply.'
        });
    };

    // ==========================================
    // Hero Background Media Handlers (Video & Image)
    // ==========================================

    const validateAndProcessFile = (file) => {
        if (!file) return;

        // Check video & image formats
        const validVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'];
        const validImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

        const isVideo = validVideoMimes.includes(file.type) || file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|ogg)$/i.test(file.name);
        const isImage = validImageMimes.includes(file.type) || file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name);

        if (!isVideo && !isImage) {
            setAlert({
                type: 'error',
                message: 'Invalid file format. Please upload a video (MP4, WebM, MOV) or image (JPG, PNG, WebP).'
            });
            return;
        }

        const detectedType = isImage ? 'image' : 'video';
        const maxSize = isImage ? 20 * 1024 * 1024 : 100 * 1024 * 1024;
        const maxLabel = isImage ? '20MB' : '100MB';

        if (file.size > maxSize) {
            setAlert({
                type: 'error',
                message: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${maxLabel} limit.`
            });
            return;
        }

        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setSelectedFileType(detectedType);
        setUploadMode(detectedType);
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
        setSelectedFileType(null);
        setFilePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload Selected Background Media (Video or Image)
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
                throw new Error(data.message || 'Failed to upload background media.');
            }

            const uploadedType = data.mediaType === 'image' || selectedFileType === 'image' ? 'image' : 'video';

            // Successfully uploaded and saved in DB
            setVideoUrl(data.videoUrl);
            setMediaType(uploadedType);
            setUploadMode(uploadedType);
            setVideoUpdatedAt(data.videoUpdatedAt || new Date().toISOString());
            localStorage.setItem('mp_hero_video', data.videoUrl);
            localStorage.setItem('mp_hero_media_type', uploadedType);

            // Broadcast real-time event to landing page
            window.dispatchEvent(new CustomEvent('hero-video-updated', {
                detail: { videoUrl: data.videoUrl, mediaType: uploadedType }
            }));

            // Clear temporary preview
            handleClearSelection();

            const cleanMsg = data.message
                ? data.message.replace(/to Cloudinary/gi, '').replace(/from Cloudinary/gi, '').replace(/Cloudinary/gi, 'cloud storage').replace(/\s{2,}/g, ' ').trim()
                : `Hero background ${uploadedType} successfully uploaded and live!`;

            setAlert({
                type: 'success',
                message: cleanMsg || `Hero background ${uploadedType} successfully uploaded and live!`
            });
        } catch (err) {
            console.error('Background upload error:', err);
            setAlert({
                type: 'error',
                message: err.message?.replace(/Cloudinary/gi, 'storage') || 'Error uploading file. Please try again.'
            });
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // Remove Custom Background Media and restore default
    const handleDeleteVideo = async () => {
        const currentLabel = mediaType === 'image' ? 'image' : 'video';
        const confirmDelete = window.confirm(
            `Are you sure you want to remove this custom background ${currentLabel}? This will delete the uploaded file and restore the default background video.`
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
                throw new Error(data.message || 'Failed to remove background media.');
            }

            setVideoUrl(null);
            setMediaType('video');
            setVideoUpdatedAt(null);
            localStorage.removeItem('mp_hero_video');
            localStorage.removeItem('mp_hero_media_type');

            window.dispatchEvent(new CustomEvent('hero-video-updated', {
                detail: { videoUrl: null, mediaType: 'video' }
            }));

            handleClearSelection();

            setAlert({
                type: 'success',
                message: 'Custom background removed and restored to default background video.'
            });
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message?.replace(/Cloudinary/gi, 'storage') || 'Failed to remove hero background.'
            });
        } finally {
            setIsResettingVideo(false);
        }
    };

    // Clean Up Unused Video Files from Storage
    const handleCleanupStorage = async () => {
        setIsCleaningStorage(true);
        setAlert(null);

        try {
            const res = await fetch('/api/content/hero/video/cleanup', {
                method: 'POST',
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to clean up storage.');
            }

            const cleanMsg = data.message
                ? data.message.replace(/from Cloudinary storage/gi, '').replace(/from Cloudinary/gi, '').replace(/Cloudinary storage is/gi, 'Storage is').replace(/Cloudinary/gi, 'storage').replace(/\s{2,}/g, ' ').trim()
                : 'Storage cleanup completed successfully.';

            setAlert({
                type: 'success',
                message: cleanMsg || 'Storage cleanup completed successfully.'
            });
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message?.replace(/Cloudinary/gi, 'storage') || 'Error cleaning up storage space.'
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

    // Active background media source & type for preview
    const activePreviewSrc = filePreviewUrl || videoUrl || defaultVideo;
    const activePreviewType = filePreviewUrl
        ? (selectedFileType || 'video')
        : (videoUrl ? mediaType : 'video');

    // Has text changes
    const hasTextChanges = (
        heroTitle.trim() !== savedHeroTitle.trim() ||
        heroParagraph.trim() !== savedHeroParagraph.trim() ||
        isResetToDefault
    ) && Boolean(heroTitle.trim()) && Boolean(heroParagraph.trim());
    const isSaveDisabled = isSavingText || !hasTextChanges;

    const previewTitleLines = (heroTitle || DEFAULT_HERO_TITLE)
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

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
                            ? 'Hero Title & Paragraph'
                            : activeSection === 'video'
                                ? 'Hero Background'
                                : 'Hero Section'}
                    </h2>
                    <p className="mp-page-desc">
                        {activeSection === 'text'
                            ? 'Edit the main headline and supporting paragraph displayed on your landing page.'
                            : activeSection === 'video'
                                ? 'Upload and manage a background video or image for your Hero section.'
                                : 'Customize the Hero title, paragraph, and background media.'}
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
                        title="Show Text section"
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
                        title="Show Hero Background section"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>Hero Background</span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 1: HERO TITLE & PARAGRAPH                         */}
            {/* ========================================================= */}
            {showTextSection && (
                <>
                    <div className="mp-section-divider">
                        <div className="mp-section-title-wrap">
                            <h3 className="mp-section-heading">Hero Section Content</h3>
                        </div>
                        <p className="mp-section-subheading">
                            Edit the main title and supporting paragraph displayed on the left side of the Hero section.
                        </p>
                    </div>

                    <div className="mp-hero-editor-grid">
                        {/* Left Card: Title & Paragraph Editor */}
                        <div className="mp-card">
                            <div className="mp-card-header">
                                <div className="mp-card-title-group">
                                    <span className="mp-card-title">Title &amp; Paragraph</span>
                                </div>
                            </div>

                            {/* Field 1: Hero Title */}
                            <div className="mp-field-group">
                                <div className="mp-field-label-row">
                                    <label htmlFor="hero-title-input" className="mp-field-label">
                                        Title
                                    </label>
                                    <span className="mp-char-count">{heroTitle.length} characters</span>
                                </div>

                                <textarea
                                    id="hero-title-input"
                                    className="mp-hero-text-input mp-hero-title-input"
                                    value={heroTitle}
                                    onChange={handleTitleChange}
                                    placeholder={DEFAULT_HERO_TITLE}
                                    rows={2}
                                />
                            </div>

                            {/* Field 2: Hero Paragraph */}
                            <div className="mp-field-group">
                                <div className="mp-field-label-row">
                                    <label htmlFor="hero-paragraph-input" className="mp-field-label">
                                        Paragraph
                                    </label>
                                    <span className="mp-char-count">{heroParagraph.length} characters</span>
                                </div>

                                <textarea
                                    id="hero-paragraph-input"
                                    className="mp-hero-text-input mp-hero-paragraph-input"
                                    value={heroParagraph}
                                    onChange={handleParagraphChange}
                                    placeholder={DEFAULT_HERO_PARAGRAPH}
                                    rows={4}
                                />
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
                                                : 'Save changes'
                                    }
                                >
                                    {isSavingText ? (
                                        <span>Saving Changes...</span>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                            <span>Save Changes</span>
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

                        {/* Right Card: Live Hero Text Preview */}
                        <div className="mp-preview-card">
                            <div className="mp-preview-badge-row">
                                <span className="mp-preview-tag">
                                    <span className="mp-live-status-dot" />
                                    Live Hero Preview
                                </span>
                                <button
                                    type="button"
                                    className="mp-btn-restart-sim"
                                    onClick={() => setPreviewKey(k => k + 1)}
                                    title="Replay entrance animation"
                                >
                                    ↺ Replay
                                </button>
                            </div>

                            <div className="mp-preview-mockup-window mp-hero-live-mockup" key={previewKey}>
                                <div className="mp-mockup-editorial">
                                    <h4 className="mp-mockup-hero-title">
                                        {previewTitleLines.map((line, idx) => (
                                            <span
                                                key={`${idx}-${line}`}
                                                className="mp-mockup-hero-title-line"
                                                style={{ animationDelay: `${0.06 + idx * 0.12}s` }}
                                            >
                                                {line}
                                            </span>
                                        ))}
                                    </h4>
                                    <p className="mp-mockup-hero-paragraph">
                                        {heroParagraph || DEFAULT_HERO_PARAGRAPH}
                                    </p>
                                    <div className="mp-mockup-hero-actions">
                                        <span className="mp-mockup-hero-cta">
                                            Let&apos;s Work Together ↗
                                        </span>
                                        <span className="mp-mockup-hero-text-cta">
                                            Explore Our Work ↗
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ========================================================= */}
            {/* SECTION 2: HERO BACKGROUND (VIDEO OR IMAGE)               */}
            {/* ========================================================= */}
            {showVideoSection && (
                <>
                    <div className="mp-section-divider">
                        <div className="mp-section-title-wrap">
                            <h3 className="mp-section-heading">Hero Background</h3>
                        </div>
                        <p className="mp-section-subheading">
                            Upload and manage a background video or image displayed behind the Hero section.
                        </p>
                    </div>

                    <div className="mp-hero-editor-grid mp-video-management-grid">
                        {/* Left Card: Background Media Upload Zone & Controls */}
                        <div className="mp-card mp-video-uploader-card">
                            <div className="mp-card-header">
                                <div className="mp-card-title-group">
                                    <span className="mp-card-title">Background Upload</span>
                                </div>

                                {/* Active Media Status Badge */}
                                <div className="mp-active-status-wrap">
                                    {videoUrl ? (
                                        <span className="mp-status-pill online" title={`Custom ${mediaType} is published and active on the website`}>
                                            <span className="mp-status-pulse" />
                                            Active ({mediaType === 'image' ? 'Image' : 'Video'})
                                        </span>
                                    ) : (
                                        <span className="mp-status-pill default" title="Using default background video">
                                            <span className="mp-status-dot-blue" />
                                            Default Video
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Format Switcher: Video or Image */}
                            <div className="mp-bg-format-toggle" role="tablist" aria-label="Background media format">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={uploadMode === 'video'}
                                    className={`mp-bg-format-btn ${uploadMode === 'video' ? 'active' : ''}`}
                                    onClick={() => setUploadMode('video')}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                    </svg>
                                    <span>Video</span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={uploadMode === 'image'}
                                    className={`mp-bg-format-btn ${uploadMode === 'image' ? 'active' : ''}`}
                                    onClick={() => setUploadMode('image')}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    <span>Image</span>
                                </button>
                            </div>

                            {/* Hidden Native File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={
                                    uploadMode === 'image'
                                        ? 'image/jpeg,image/png,image/webp,image/avif,image/gif'
                                        : 'video/mp4,video/webm,video/quicktime,video/x-matroska'
                                }
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
                                            {selectedFile
                                                ? `Change Selected ${selectedFileType === 'image' ? 'Image' : 'Video'}`
                                                : uploadMode === 'image'
                                                    ? 'Drag & drop image here, or Browse'
                                                    : 'Drag & drop video here, or Browse'}
                                        </p>
                                        <span className="mp-dropzone-sub">
                                            {uploadMode === 'image'
                                                ? 'Supports JPG, PNG, WebP, AVIF up to 20MB (or drop a video)'
                                                : 'Supports MP4, WebM, MOV up to 100MB (or drop an image)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Selected File Details Chip */}
                            {selectedFile && (
                                <div className="mp-selected-file-chip">
                                    <div className="mp-file-info-left">
                                        <div className="mp-file-video-badge">
                                            {selectedFileType === 'image' ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="mp-file-meta">
                                            <span className="mp-file-name" title={selectedFile.name}>{selectedFile.name}</span>
                                            <span className="mp-file-size">
                                                {selectedFileType === 'image' ? 'Image' : 'Video'} • {formatBytes(selectedFile.size)} • Ready to upload
                                            </span>
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

                            {/* Storage Management Option when a file is selected */}
                            {selectedFile && (
                                <div className="mp-storage-options-wrap">
                                    <label className="mp-auto-delete-checkbox-label" title="When enabled, previously uploaded background files will be removed to free up storage space">
                                        <input
                                            type="checkbox"
                                            checked={autoDeletePrevious}
                                            onChange={(e) => setAutoDeletePrevious(e.target.checked)}
                                        />
                                        <span>Replace and remove previous background file (frees up storage space)</span>
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
                                            <span>Uploading {selectedFileType === 'image' ? 'Image' : 'Video'}...</span>
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
                                            <span>
                                                {selectedFile
                                                    ? `Upload & Publish ${selectedFileType === 'image' ? 'Image' : 'Video'}`
                                                    : 'Upload & Publish Background'}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {/* Button to remove custom background media and restore default */}
                                {videoUrl && (
                                    <button
                                        type="button"
                                        className="mp-btn-delete-previous-video"
                                        onClick={handleDeleteVideo}
                                        disabled={isResettingVideo || isUploadingVideo}
                                        title="Remove custom background and restore default background video"
                                    >
                                        {isResettingVideo ? (
                                            <>
                                                <span className="mp-spinner red" />
                                                <span>Removing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                                <span>Remove Custom Background</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Clean up unused storage */}
                                <button
                                    type="button"
                                    className="mp-btn-cleanup-storage"
                                    onClick={handleCleanupStorage}
                                    disabled={isCleaningStorage || isUploadingVideo}
                                    title="Clean up unused background files to free up storage space"
                                >
                                    {isCleaningStorage ? (
                                        <>
                                            <span className="mp-spinner subtle" />
                                            <span>Freeing Storage...</span>
                                        </>
                                    ) : (
                                        <span>🧹 Free Up Storage Space</span>
                                    )}
                                </button>
                            </div>

                            {/* Direct Link & Status Details */}
                            {videoUrl && (
                                <div className="mp-cloudinary-info-box">
                                    <div className="mp-cloudinary-meta-row">
                                        <span className="mp-meta-label">
                                            Direct {mediaType === 'image' ? 'Image' : 'Video'} Link:
                                        </span>
                                        <a
                                            href={videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mp-cloudinary-link"
                                        >
                                            View {mediaType === 'image' ? 'Image' : 'Video'} in New Tab ↗
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

                        {/* Right Card: Live Background Media Preview */}
                        <div className="mp-card mp-video-preview-card">
                            <div className="mp-card-header">
                                <div className="mp-card-title-group">
                                    <span className="mp-card-title">Live Hero Background Preview</span>
                                </div>
                                <div className="mp-preview-source-tag">
                                    {filePreviewUrl ? (
                                        <span className="mp-tag-staged">
                                            Selected {selectedFileType === 'image' ? 'Image' : 'Video'} Preview
                                        </span>
                                    ) : videoUrl ? (
                                        <span className="mp-tag-live">
                                            Live ({mediaType === 'image' ? 'Image' : 'Video'})
                                        </span>
                                    ) : (
                                        <span className="mp-tag-default">Default Video</span>
                                    )}
                                </div>
                            </div>

                            {/* Preview Frame (Video or Image) */}
                            <div className="mp-video-player-container">
                                {activePreviewType === 'image' ? (
                                    <>
                                        <img
                                            key={activePreviewSrc}
                                            src={activePreviewSrc}
                                            alt="Hero Background Preview"
                                            className="mp-preview-video-element"
                                        />
                                        <div className="mp-player-overlay-bar mp-image-overlay-bar">
                                            <span className="mp-player-badge">Image Background Preview</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
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

                                            <span className="mp-player-badge">Looping Background Preview</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
