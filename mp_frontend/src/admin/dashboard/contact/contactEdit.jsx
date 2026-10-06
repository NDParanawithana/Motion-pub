import { useState, useEffect, useRef } from 'react';
import './contactEdit.css';

const DEFAULT_CONTACT_INFO = {
    email: 'mp.motionpub@gmail.com',
    phone: '+94 76 237 1431',
    location: 'Walapane, Central Province, Sri Lanka',
    workingDays: 'Monday – Saturday',
    workingHours: '10:00 AM – 10:00 PM',
    offDays: 'Sunday',
    facebookUrl: 'https://facebook.com',
    youtubeUrl: 'https://youtube.com',
    instagramUrl: 'https://instagram.com',
    linkedinUrl: 'https://linkedin.com',
};

export default function ContactEdit({ onOpenMessages, unreadCount = 0 }) {
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
    const [info, setInfo] = useState(() => {
        try {
            const saved = localStorage.getItem('mp_contact_settings');
            return saved ? { ...DEFAULT_CONTACT_INFO, ...JSON.parse(saved) } : DEFAULT_CONTACT_INFO;
        } catch {
            return DEFAULT_CONTACT_INFO;
        }
    });

    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(info));
    const [alert, setAlert] = useState(null);

    const hasChanges = JSON.stringify(info) !== savedSnapshot;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        if (window.confirm('Reset contact information to default template?')) {
            setInfo(DEFAULT_CONTACT_INFO);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        try {
            localStorage.setItem('mp_contact_settings', JSON.stringify(info));
            setSavedSnapshot(JSON.stringify(info));
            setAlert({ type: 'success', message: 'Contact details saved and applied to website!' });

            // Notify open pages via custom storage event
            window.dispatchEvent(new Event('storage'));

            setTimeout(() => setAlert(null), 4000);
        } catch (err) {
            console.error('Save failed:', err);
            setAlert({ type: 'error', message: 'Failed to save changes. Please try again.' });
        }
    };

    return (
        <div className="mp-contact-edit-root">
            {/* Header with Title and Mode Switcher Tabs */}
            <div className="mp-contact-edit-header">
                <div className="mp-contact-title-group">
                    <div className="mp-contact-badge-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="mp-contact-page-title">Contact Page Manager</h2>
                        <p className="mp-contact-page-desc">
                            Manage contact details, business hours, studio location, and social links.
                        </p>
                    </div>
                </div>

                <div className="mp-contact-tabs">
                    <button
                        type="button"
                        className={`mp-contact-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('editor')}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span>Editor</span>
                    </button>
                    <button
                        type="button"
                        className={`mp-contact-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>Live Simulation</span>
                    </button>
                </div>
            </div>

            {/* Quick Messages Shortcut Banner */}
            {onOpenMessages && (
                <div className="mp-contact-inquiry-banner" onClick={onOpenMessages}>
                    <div className="mp-inquiry-banner-left">
                        <div className="mp-inquiry-banner-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <strong>Visitor Messages & Inquiries</strong>
                            <span>Messages sent from the frontend contact form are stored in MongoDB.</span>
                        </div>
                    </div>
                    <div className="mp-inquiry-banner-right">
                        {unreadCount > 0 ? (
                            <span className="mp-inquiry-unread-badge">{unreadCount} Unread</span>
                        ) : (
                            <span className="mp-inquiry-read-badge">View Messages</span>
                        )}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            )}

            {/* Alert Banner */}
            {alert && (
                <div className={`mp-contact-alert ${alert.type}`}>
                    <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
                    <span>{alert.message}</span>
                </div>
            )}

            {activeTab === 'editor' ? (
                <form onSubmit={handleSave} className="mp-contact-form-layout">
                    {/* Section 1: Direct Contact Information */}
                    <div className="mp-contact-card">
                        <div className="mp-card-header">
                            <div className="mp-card-icon-wrap blue">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 className="mp-card-title">Contact Channels</h3>
                                <p className="mp-card-subtitle">Primary email, phone number, and office location displayed to visitors.</p>
                            </div>
                        </div>

                        <div className="mp-grid-2cols">
                            <div className="mp-input-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={info.email}
                                    onChange={handleChange}
                                    placeholder="motionpub@gmail.com"
                                    required
                                />
                            </div>

                            <div className="mp-input-group">
                                <label htmlFor="phone">Phone / WhatsApp Number</label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={info.phone}
                                    onChange={handleChange}
                                    placeholder="+94 76 237 1431"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mp-input-group" style={{ marginTop: '1rem' }}>
                            <label htmlFor="location">Physical Studio / Office Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={info.location}
                                onChange={handleChange}
                                placeholder="Walapane, Central Province, Sri Lanka"
                                required
                            />
                        </div>
                    </div>

                    {/* Section 2: Working Hours & Availability */}
                    <div className="mp-contact-card">
                        <div className="mp-card-header">
                            <div className="mp-card-icon-wrap emerald">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 className="mp-card-title">Working Hours & Availability</h3>
                                <p className="mp-card-subtitle">Displayed operating schedule and availability status.</p>
                            </div>
                        </div>

                        <div className="mp-grid-2cols">
                            <div className="mp-input-group">
                                <label htmlFor="workingDays">Active Working Days</label>
                                <input
                                    type="text"
                                    id="workingDays"
                                    name="workingDays"
                                    value={info.workingDays}
                                    onChange={handleChange}
                                    placeholder="Monday – Saturday"
                                />
                            </div>

                            <div className="mp-input-group">
                                <label htmlFor="workingHours">Operating Hours Range</label>
                                <input
                                    type="text"
                                    id="workingHours"
                                    name="workingHours"
                                    value={info.workingHours}
                                    onChange={handleChange}
                                    placeholder="10:00 AM – 10:00 PM"
                                />
                            </div>
                        </div>

                        <div className="mp-input-group" style={{ marginTop: '1rem' }}>
                            <label htmlFor="offDays">Closed / Off Days</label>
                            <input
                                type="text"
                                id="offDays"
                                name="offDays"
                                value={info.offDays}
                                onChange={handleChange}
                                placeholder="Sunday"
                            />
                        </div>
                    </div>

                    {/* Section 3: Social Media Links */}
                    <div className="mp-contact-card">
                        <div className="mp-card-header">
                            <div className="mp-card-icon-wrap violet">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="mp-card-title">Social Media Profiles</h3>
                                <p className="mp-card-subtitle">Links to your official YouTube, Instagram, Facebook, and LinkedIn pages.</p>
                            </div>
                        </div>

                        <div className="mp-grid-2cols">
                            <div className="mp-input-group">
                                <label htmlFor="youtubeUrl">YouTube Channel URL</label>
                                <input
                                    type="url"
                                    id="youtubeUrl"
                                    name="youtubeUrl"
                                    value={info.youtubeUrl}
                                    onChange={handleChange}
                                    placeholder="https://youtube.com/@motionpub"
                                />
                            </div>

                            <div className="mp-input-group">
                                <label htmlFor="instagramUrl">Instagram Profile URL</label>
                                <input
                                    type="url"
                                    id="instagramUrl"
                                    name="instagramUrl"
                                    value={info.instagramUrl}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/motionpub"
                                />
                            </div>

                            <div className="mp-input-group">
                                <label htmlFor="facebookUrl">Facebook Page URL</label>
                                <input
                                    type="url"
                                    id="facebookUrl"
                                    name="facebookUrl"
                                    value={info.facebookUrl}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/motionpub"
                                />
                            </div>

                            <div className="mp-input-group">
                                <label htmlFor="linkedinUrl">LinkedIn Page URL</label>
                                <input
                                    type="url"
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    value={info.linkedinUrl}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/company/motionpub"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sticky Action Bar */}
                    <div className="mp-contact-actions-bar">
                        {hasChanges && (
                            <span className="mp-unsaved-badge">
                                ● Unsaved changes
                            </span>
                        )}
                        <button
                            type="button"
                            className="mp-btn-reset-default"
                            onClick={handleReset}
                        >
                            Reset Default Template
                        </button>
                        <button
                            type="submit"
                            className="mp-btn-save-contact"
                            disabled={!hasChanges}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Save & Apply Changes</span>
                        </button>
                    </div>
                </form>
            ) : (
                /* Live Simulation Preview Mode */
                <div className="mp-contact-sim-container">
                    <div className="mp-sim-badge">Live Website Simulation</div>

                    <div className="mp-sim-grid">
                        {/* Information Card Simulation */}
                        <div className="mp-sim-card">
                            <h4 className="mp-sim-card-heading">Contact Information</h4>
                            <div className="mp-sim-items">
                                <div className="mp-sim-item">
                                    <div className="mp-sim-icon-box">✉</div>
                                    <div>
                                        <small>Email</small>
                                        <p>{info.email}</p>
                                    </div>
                                </div>
                                <div className="mp-sim-item">
                                    <div className="mp-sim-icon-box">📞</div>
                                    <div>
                                        <small>Phone</small>
                                        <p>{info.phone}</p>
                                    </div>
                                </div>
                                <div className="mp-sim-item">
                                    <div className="mp-sim-icon-box">📍</div>
                                    <div>
                                        <small>Location</small>
                                        <p>{info.location}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mp-sim-hours-box">
                                <div className="mp-sim-hours-row">
                                    <span>{info.workingDays}</span>
                                    <strong>{info.workingHours}</strong>
                                </div>
                                <div className="mp-sim-hours-row">
                                    <span>{info.offDays}</span>
                                    <span style={{ color: '#f87171' }}>Closed</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Links Simulation */}
                        <div className="mp-sim-card">
                            <h4 className="mp-sim-card-heading">Connected Platforms</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                                Visitors can connect directly via these social media endpoints:
                            </p>
                            <div className="mp-sim-social-list">
                                <div className="mp-sim-social-item">
                                    <span>YouTube:</span>
                                    <a href={info.youtubeUrl} target="_blank" rel="noreferrer">{info.youtubeUrl || '(Not set)'}</a>
                                </div>
                                <div className="mp-sim-social-item">
                                    <span>Instagram:</span>
                                    <a href={info.instagramUrl} target="_blank" rel="noreferrer">{info.instagramUrl || '(Not set)'}</a>
                                </div>
                                <div className="mp-sim-social-item">
                                    <span>Facebook:</span>
                                    <a href={info.facebookUrl} target="_blank" rel="noreferrer">{info.facebookUrl || '(Not set)'}</a>
                                </div>
                                <div className="mp-sim-social-item">
                                    <span>LinkedIn:</span>
                                    <a href={info.linkedinUrl} target="_blank" rel="noreferrer">{info.linkedinUrl || '(Not set)'}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
