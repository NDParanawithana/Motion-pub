import { useState, useRef, useEffect, useCallback } from 'react';
import './aboutedit.css';

const DEFAULT_CORNER_TITLE = 'ABOUT MOTION PUB';
const DEFAULT_HEADING_LINE1 = 'We Turn Ideas Into';
const DEFAULT_HEADING_LINE2 = 'Visual Stories.';
const DEFAULT_LEAD_PARAGRAPH =
    '<strong>MOTION PUB is a Sri Lankan video production and post-production agency</strong> dedicated to creating powerful visual content that helps brands stand out. We combine creativity, storytelling, and visual design to transform ideas into engaging content that connects with audiences.';
const DEFAULT_SUBTEXT_PARAGRAPH =
    "Whether it's bringing a concept to life or shaping existing footage into a compelling story, we focus on creating visuals that communicate your brand's identity and leave a lasting impression.";

// Case conversion helpers
export const toSentenceCase = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/(^\s*|[.!?\n]\s*)([a-z\u00E0-\u00FC])/gi, (match, prefix, char) => {
            return prefix + char.toUpperCase();
        });
};

export const toCapitalCase = (str) => {
    if (!str) return '';
    return str.toUpperCase();
};

export const toSimpleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase();
};

/**
 * WordTextEditor - A Microsoft Word-style rich text editor component.
 * Allows bold, italic, underline, strikethrough, text coloring, quick insertions,
 * case changing (Capital, Simple, Paragraph), and live word/character counting.
 */
function WordTextEditor({
    label,
    badge = 'Word Editor',
    value,
    onChange,
    placeholder = 'Type narrative text here...'
}) {
    const editorRef = useRef(null);
    const caseMenuRef = useRef(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);

    // Close case dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (caseMenuRef.current && !caseMenuRef.current.contains(e.target)) {
                setIsCaseMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to calculate word & character counts from innerText
    const updateCounts = useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || '';
        const cleanText = text.trim();
        const words = cleanText ? cleanText.split(/\s+/).length : 0;
        setWordCount(words);
        setCharCount(text.replace(/\n/g, '').length);
    }, []);

    // Sync initial and external value changes into the contentEditable div
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
            updateCounts();
        }
    }, [value, updateCounts]);

    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        updateCounts();
        if (onChange) {
            onChange(html);
        }
    };

    // Execute formatting command without stealing focus from selection
    const execFormat = (command, valueArg = null) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, valueArg);
        handleInput();
    };

    // Quick insertion of brand name with bold styling
    const insertBrand = () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand('insertHTML', false, '<strong>MOTION PUB</strong>&nbsp;');
        handleInput();
    };

    // Change case: converts highlighted selection or entire document if no selection
    const changeEditorCase = (caseType) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        const selection = window.getSelection();

        // 1. If text is highlighted inside this editor canvas, convert only the selection
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            if (editorRef.current.contains(range.commonAncestorContainer)) {
                const selectedText = selection.toString();
                let converted = selectedText;
                if (caseType === 'capital') converted = toCapitalCase(selectedText);
                else if (caseType === 'simple') converted = toSimpleCase(selectedText);
                else if (caseType === 'paragraph') converted = toSentenceCase(selectedText);

                const success = document.execCommand('insertText', false, converted);
                if (!success) {
                    range.deleteContents();
                    range.insertNode(document.createTextNode(converted));
                }
                handleInput();
                return;
            }
        }

        // 2. If nothing is highlighted, convert all text nodes while keeping HTML tags intact
        const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let n;
        while ((n = walker.nextNode())) {
            textNodes.push(n);
        }

        if (caseType === 'capital') {
            textNodes.forEach((node) => {
                node.nodeValue = node.nodeValue.toUpperCase();
            });
        } else if (caseType === 'simple') {
            textNodes.forEach((node) => {
                node.nodeValue = node.nodeValue.toLowerCase();
            });
        } else if (caseType === 'paragraph') {
            let capitalizeNext = true;
            textNodes.forEach((node) => {
                const val = node.nodeValue.toLowerCase();
                let res = '';
                for (let i = 0; i < val.length; i++) {
                    const c = val[i];
                    if (capitalizeNext && /[a-zA-Z\u00E0-\u00FC]/.test(c)) {
                        res += c.toUpperCase();
                        capitalizeNext = false;
                    } else {
                        res += c;
                        if (/[.!?\n]/.test(c)) {
                            capitalizeNext = true;
                        }
                    }
                }
                node.nodeValue = res;
            });
        }
        handleInput();
    };

    const handleClear = () => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = '';
        handleInput();
    };

    const colors = [
        { name: 'Light Green (Default)', hex: '#d0ffa6' },
        { name: 'Pure White (Emphasis)', hex: '#ffffff' },
        { name: 'Neon Lime (Brand)', hex: '#94e000' },
        { name: 'Electric Cyan', hex: '#38bdf8' },
        { name: 'Amber Gold', hex: '#facc15' }
    ];

    return (
        <div className="mp-about-form-group">
            <div className="mp-about-label">
                <span>{label}</span>
                {badge && <span className="mp-about-label-badge">{badge}</span>}
            </div>

            <div className="mp-word-editor">
                {/* Word-Style Ribbon Toolbar */}
                <div className="mp-word-toolbar">
                    {/* Undo / Redo */}
                    <div className="mp-word-btn-group">
                        <button
                            type="button"
                            className="mp-word-tool-btn"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('undo');
                            }}
                            title="Undo (Ctrl+Z)"
                        >
                            ↶
                        </button>
                        <button
                            type="button"
                            className="mp-word-tool-btn"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('redo');
                            }}
                            title="Redo (Ctrl+Y)"
                        >
                            ↷
                        </button>
                    </div>

                    <div className="mp-word-separator" />

                    {/* Bold, Italic, Underline, Strikethrough */}
                    <div className="mp-word-btn-group">
                        <button
                            type="button"
                            className="mp-word-tool-btn bold"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('bold');
                            }}
                            title="Bold (Ctrl+B)"
                        >
                            B
                        </button>
                        <button
                            type="button"
                            className="mp-word-tool-btn italic"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('italic');
                            }}
                            title="Italic (Ctrl+I)"
                        >
                            I
                        </button>
                        <button
                            type="button"
                            className="mp-word-tool-btn underline"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('underline');
                            }}
                            title="Underline (Ctrl+U)"
                        >
                            U
                        </button>
                        <button
                            type="button"
                            className="mp-word-tool-btn strike"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                execFormat('strikeThrough');
                            }}
                            title="Strikethrough"
                        >
                            S
                        </button>
                    </div>

                    <div className="mp-word-separator" />

                    {/* Change Case Dropdown: Capital, Simple, Paragraph */}
                    <div className="mp-word-case-dropdown" ref={caseMenuRef}>
                        <button
                            type="button"
                            className={`mp-word-tool-btn mp-case-trigger-btn ${isCaseMenuOpen ? 'active' : ''}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsCaseMenuOpen((prev) => !prev);
                            }}
                            title="Change Case (Capital, Simple, Paragraph)"
                        >
                            <span>Aa</span>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isCaseMenuOpen && (
                            <div className="mp-case-menu">
                                <div className="mp-case-menu-header">Change Case</div>
                                <button
                                    type="button"
                                    className="mp-case-menu-item"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        changeEditorCase('paragraph');
                                        setIsCaseMenuOpen(false);
                                    }}
                                >
                                    <span className="mp-case-item-name">Paragraph</span>
                                    <span className="mp-case-item-hint">Sentence case.</span>
                                </button>
                                <button
                                    type="button"
                                    className="mp-case-menu-item"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        changeEditorCase('capital');
                                        setIsCaseMenuOpen(false);
                                    }}
                                >
                                    <span className="mp-case-item-name">Capital</span>
                                    <span className="mp-case-item-hint">ALL UPPERCASE</span>
                                </button>
                                <button
                                    type="button"
                                    className="mp-case-menu-item"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        changeEditorCase('simple');
                                        setIsCaseMenuOpen(false);
                                    }}
                                >
                                    <span className="mp-case-item-name">Simple</span>
                                    <span className="mp-case-item-hint">all lowercase</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mp-word-separator" />

                    {/* Color Palette */}
                    <div className="mp-word-colors" title="Text Color Palette">
                        {colors.map((c) => (
                            <button
                                key={c.hex}
                                type="button"
                                className="mp-color-swatch-btn"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    execFormat('foreColor', c.hex);
                                }}
                            />
                        ))}
                    </div>

                    <div className="mp-word-separator" />

                    {/* Clear Formatting */}
                    <button
                        type="button"
                        className="mp-word-tool-btn"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execFormat('removeFormat');
                        }}
                        title="Clear Formatting"
                    >
                        T̸
                    </button>

                    {/* Quick Insert Brand Button */}
                    <button
                        type="button"
                        className="mp-word-chip-btn"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            insertBrand();
                        }}
                        title="Insert brand name with bold styling"
                    >
                        <span>+</span>
                        <span>MOTION PUB</span>
                    </button>
                </div>

                {/* Word Document Canvas */}
                <div
                    ref={editorRef}
                    className="mp-word-canvas"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    data-placeholder={placeholder}
                    role="textbox"
                    aria-multiline="true"
                />

                {/* Word-Style Status Footer */}
                <div className="mp-word-statusbar">
                    <div className="mp-word-status-left">
                        <span>Words: <strong>{wordCount}</strong></span>
                        <span>Characters: <strong>{charCount}</strong></span>
                        <span>Reading: <strong>~{Math.max(1, Math.ceil(wordCount / 200))} min</strong></span>
                    </div>
                    <div className="mp-word-status-right">
                        <button type="button" className="mp-word-status-btn" onClick={handleClear}>
                            Clear text
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AboutEdit() {
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

    const initialValues = useRef({
        cornerTitle: localStorage.getItem('mp_about_corner_title') || DEFAULT_CORNER_TITLE,
        headingLine1: localStorage.getItem('mp_about_heading_line1') || DEFAULT_HEADING_LINE1,
        headingLine2: localStorage.getItem('mp_about_heading_line2') || DEFAULT_HEADING_LINE2,
        leadParagraph: localStorage.getItem('mp_about_lead') || DEFAULT_LEAD_PARAGRAPH,
        subtextParagraph: localStorage.getItem('mp_about_subtext') || DEFAULT_SUBTEXT_PARAGRAPH,
        additionalParagraphs: JSON.parse(localStorage.getItem('mp_about_additional_paragraphs') || '[]'),
    });

    const [cornerTitle, setCornerTitle] = useState(initialValues.current.cornerTitle);
    const [headingLine1, setHeadingLine1] = useState(initialValues.current.headingLine1);
    const [headingLine2, setHeadingLine2] = useState(initialValues.current.headingLine2);
    const [leadParagraph, setLeadParagraph] = useState(initialValues.current.leadParagraph);
    const [subtextParagraph, setSubtextParagraph] = useState(initialValues.current.subtextParagraph);
    const [additionalParagraphs, setAdditionalParagraphs] = useState(initialValues.current.additionalParagraphs);

    // Track saved baseline for dirty checking
    const [savedBaseline, setSavedBaseline] = useState(initialValues.current);

    // Track if user explicitly clicked reset to default
    const [isResetPressed, setIsResetPressed] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const normalize = (str) => (str || '').trim();

    // Check if any field differs from saved values
    const isContentEdited =
        normalize(cornerTitle) !== normalize(savedBaseline.cornerTitle) ||
        normalize(headingLine1) !== normalize(savedBaseline.headingLine1) ||
        normalize(headingLine2) !== normalize(savedBaseline.headingLine2) ||
        normalize(leadParagraph) !== normalize(savedBaseline.leadParagraph) ||
        normalize(subtextParagraph) !== normalize(savedBaseline.subtextParagraph) ||
        JSON.stringify(additionalParagraphs) !== JSON.stringify(savedBaseline.additionalParagraphs);

    const canSave = isResetPressed || isContentEdited;

    const handleSave = (e) => {
        if (e) e.preventDefault();
        if (!canSave) return;

        localStorage.setItem('mp_about_corner_title', cornerTitle);
        localStorage.setItem('mp_about_heading_line1', headingLine1);
        localStorage.setItem('mp_about_heading_line2', headingLine2);
        localStorage.setItem('mp_about_lead', leadParagraph);
        localStorage.setItem('mp_about_subtext', subtextParagraph);
        localStorage.setItem('mp_about_additional_paragraphs', JSON.stringify(additionalParagraphs));

        // Update baseline to the new saved values
        setSavedBaseline({
            cornerTitle,
            headingLine1,
            headingLine2,
            leadParagraph,
            subtextParagraph,
            additionalParagraphs,
        });
        setIsResetPressed(false);

        // Broadcast update across open tabs and components
        window.dispatchEvent(
            new CustomEvent('mp-about-update', {
                detail: {
                    cornerTitle,
                    headingLine1,
                    headingLine2,
                    leadHtml: leadParagraph,
                    subtextHtml: subtextParagraph,
                    additionalParagraphsHtml: additionalParagraphs
                }
            })
        );

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    const handleResetToDefault = () => {
        if (window.confirm('Reset About section to original default statements?')) {
            setCornerTitle(DEFAULT_CORNER_TITLE);
            setHeadingLine1(DEFAULT_HEADING_LINE1);
            setHeadingLine2(DEFAULT_HEADING_LINE2);
            setLeadParagraph(DEFAULT_LEAD_PARAGRAPH);
            setSubtextParagraph(DEFAULT_SUBTEXT_PARAGRAPH);
            setAdditionalParagraphs([]);
            setIsResetPressed(true);
            setIsSaved(false);
        }
    };

    return (
        <div className="mp-about-edit-page">
            {/* Sticky Top Bar for View Mode Tabs & Saved Badge */}
            <div className="mp-about-sticky-bar">
                <div className="mp-about-sticky-title">
                    <h2>Edit About page</h2>
                </div>
                
                <div className="mp-about-sticky-actions">
                    {isSaved && (
                        <div className="mp-about-saved-badge">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Saved & Synced!</span>
                        </div>
                    )}

                    {/* View Mode Tabs (Sticky) */}
                    <div className="mp-about-tabs">
                        <button
                            type="button"
                            className={`mp-about-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('editor')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span>Editor</span>
                        </button>
                        <button
                            type="button"
                            className={`mp-about-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preview')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>Live Preview</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Tab View */}
            {activeTab === 'editor' ? (
                <div className="mp-about-edit-card">
                    <div className="mp-about-edit-card-header">
                        <div className="mp-about-card-title-left">
                            <div className="mp-about-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                            </div>
                            <h3 className="mp-about-card-title">Headings & Rich Narrative Editors</h3>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="mp-about-form-grid">
                        {/* Corner Badge */}
                        <div className="mp-about-form-group">
                            <div className="mp-about-label">
                                <span>Page Title</span>
                            </div>
                            <input
                                type="text"
                                className="mp-about-input"
                                value={cornerTitle}
                                onChange={(e) => setCornerTitle(e.target.value)}
                                placeholder="ABOUT MOTION PUB"
                            />
                        </div>

                        {/* Main Headings */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            <div className="mp-about-form-group">
                                <div className="mp-about-label">
                                    <span>Main Heading Line 1</span>
                                    <span className="mp-about-label-badge">White Bold</span>
                                </div>
                                <input
                                    type="text"
                                    className="mp-about-input"
                                    value={headingLine1}
                                    onChange={(e) => setHeadingLine1(e.target.value)}
                                    placeholder="We Turn Ideas Into"
                                />
                            </div>

                            <div className="mp-about-form-group">
                                <div className="mp-about-label">
                                    <span>Main Heading Line 2</span>
                                    <span className="mp-about-label-badge">Neon Gradient</span>
                                </div>
                                <input
                                    type="text"
                                    className="mp-about-input"
                                    value={headingLine2}
                                    onChange={(e) => setHeadingLine2(e.target.value)}
                                    placeholder="Visual Stories."
                                />
                            </div>
                        </div>

                        {/* Word-Style Rich Text Editor: Lead Narrative Paragraph */}
                        <WordTextEditor
                            label="Lead Narrative Paragraph"
                            value={leadParagraph}
                            onChange={setLeadParagraph}
                            placeholder="Enter the primary agency narrative..."
                        />

                        {/* Word-Style Rich Text Editor: Secondary Narrative Paragraph */}
                        <WordTextEditor
                            label="Secondary Narrative Paragraph"
                            value={subtextParagraph}
                            onChange={setSubtextParagraph}
                            placeholder="Enter the supporting narrative statement..."
                        />

                        {/* Dynamic Additional Paragraphs */}
                        {additionalParagraphs.map((p, i) => (
                            <div key={i} className="mp-about-dynamic-editor">
                                {p === '[DIVIDER]' ? (
                                    <div className="mp-about-divider-placeholder">
                                        <div className="mp-about-preview-divider" style={{ margin: '2rem 0' }}>
                                            <span className="mp-about-preview-line left" />
                                            <span className="mp-about-preview-camera">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                                    <circle cx="12" cy="13" r="3" />
                                                </svg>
                                            </span>
                                            <span className="mp-about-preview-line right" />
                                        </div>
                                    </div>
                                ) : (
                                    <WordTextEditor
                                        label={`Additional Paragraph ${i + 1}`}
                                        value={p}
                                        onChange={(newVal) => {
                                            const newP = [...additionalParagraphs];
                                            newP[i] = newVal;
                                            setAdditionalParagraphs(newP);
                                        }}
                                        placeholder="Enter additional narrative..."
                                    />
                                )}
                                <button
                                    type="button"
                                    className="mp-btn-delete-paragraph"
                                    onClick={() => {
                                        const newP = additionalParagraphs.filter((_, idx) => idx !== i);
                                        setAdditionalParagraphs(newP);
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete {p === '[DIVIDER]' ? 'Divider' : 'Paragraph'}
                                </button>
                            </div>
                        ))}

                        <div className="mp-about-add-paragraph-wrapper" style={{ gap: '1rem' }}>
                            <button
                                type="button"
                                className="mp-btn-add-paragraph"
                                onClick={() => setAdditionalParagraphs([...additionalParagraphs, ''])}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add New Paragraph
                            </button>
                            <button
                                type="button"
                                className="mp-btn-add-paragraph"
                                onClick={() => setAdditionalParagraphs([...additionalParagraphs, '[DIVIDER]'])}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Divider
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="mp-about-actions">
                            {canSave && (
                                <span style={{ fontSize: '0.82rem', color: '#94e000', fontWeight: 600, marginRight: 'auto' }}>
                                    ● Unsaved changes
                                </span>
                            )}
                            <button
                                type="button"
                                className="mp-btn-reset-default"
                                onClick={handleResetToDefault}
                            >
                                Reset Default Template
                            </button>
                            <button
                                type="submit"
                                className="mp-btn-save"
                                disabled={!canSave}
                                title={canSave ? 'Save and apply changes to website' : 'Make edits or reset template to enable saving'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Save & Apply Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Live Website Preview Simulation Box */
                <div className="mp-about-preview-box">
                    <div className="mp-about-preview-badge">Live Website Simulation</div>

                    <div className="mp-about-preview-corner">{cornerTitle}</div>

                    <h2 className="mp-about-preview-title">
                        <span>{headingLine1}</span>
                        <br />
                        <span className="highlight">{headingLine2}</span>
                    </h2>

                    <div
                        className="mp-about-preview-lead"
                        dangerouslySetInnerHTML={{ __html: leadParagraph }}
                    />

                    <div className="mp-about-preview-divider">
                        <span className="mp-about-preview-line left" />
                        <span className="mp-about-preview-camera">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                        </span>
                        <span className="mp-about-preview-line right" />
                    </div>

                    <div
                        className="mp-about-preview-subtext"
                        dangerouslySetInnerHTML={{ __html: subtextParagraph }}
                    />

                    {additionalParagraphs.map((p, i) => {
                        if (p === '[DIVIDER]') {
                            return (
                                <div key={i} className="mp-about-preview-divider" style={{ marginTop: '2rem' }}>
                                    <span className="mp-about-preview-line left" />
                                    <span className="mp-about-preview-camera">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                            <circle cx="12" cy="13" r="3" />
                                        </svg>
                                    </span>
                                    <span className="mp-about-preview-line right" />
                                </div>
                            );
                        }
                        return (
                            <div
                                key={i}
                                className="mp-about-preview-subtext mp-about-preview-additional"
                                dangerouslySetInnerHTML={{ __html: p }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
