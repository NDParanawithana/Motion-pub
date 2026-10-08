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

const COUNTRIES = [
    { code: '+94', flag: '🇱🇰', name: 'Sri Lanka', country: 'LK' },
    { code: '+1', flag: '🇺🇸', name: 'United States', country: 'US' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom', country: 'GB' },
    { code: '+61', flag: '🇦🇺', name: 'Australia', country: 'AU' },
    { code: '+1', flag: '🇨🇦', name: 'Canada', country: 'CA' },
    { code: '+49', flag: '🇩🇪', name: 'Germany', country: 'DE' },
    { code: '+33', flag: '🇫🇷', name: 'France', country: 'FR' },
    { code: '+91', flag: '🇮🇳', name: 'India', country: 'IN' },
    { code: '+971', flag: '🇦🇪', name: 'UAE', country: 'AE' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore', country: 'SG' },
    { code: '+81', flag: '🇯🇵', name: 'Japan', country: 'JP' },
];

function getIsOpenNow() {
    try {
        const now = new Date();
        const slDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
        const slDate = new Date(slDateStr);
        const day = slDate.getDay();
        const hours = slDate.getHours();
        const minutes = slDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        return day >= 1 && day <= 6 && totalMinutes >= 600 && totalMinutes < 1320;
    } catch {
        return true;
    }
}

export default function ContactEdit({
    onOpenMessages,
    unreadCount = 0,
    activeSection = 'all',
    onSelectSection
}) {
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

    // Live Simulation Interactive State
    const [simCountry, setSimCountry] = useState(COUNTRIES[0]);
    const [isSimCountryOpen, setIsSimCountryOpen] = useState(false);
    const [simService, setSimService] = useState('');
    const [isSimServiceOpen, setIsSimServiceOpen] = useState(false);
    const [simForm, setSimForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    });
    const [simSubmitted, setSimSubmitted] = useState(false);
    const [isOpenNow] = useState(getIsOpenNow);
    const simCountryRef = useRef(null);
    const simServiceRef = useRef(null);

    // Dropdown Service Options State (connected to MongoDB)
    const [serviceOptions, setServiceOptions] = useState([]);
    const [isServicesLoading, setIsServicesLoading] = useState(true);
    const [newServiceName, setNewServiceName] = useState('');
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [editingServiceName, setEditingServiceName] = useState('');
    const [isUpdatingService, setIsUpdatingService] = useState(false);
    const [deletingServiceId, setDeletingServiceId] = useState(null);
    const [serviceFeedback, setServiceFeedback] = useState(null);

    const hasChanges = JSON.stringify(info) !== savedSnapshot;

    // Default simulation service to first MongoDB option if available
    useEffect(() => {
        if (serviceOptions.length > 0 && !simService) {
            setSimService(serviceOptions[0].name);
        }
    }, [serviceOptions, simService]);

    // Close simulation dropdowns on click outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (simCountryRef.current && !simCountryRef.current.contains(e.target)) {
                setIsSimCountryOpen(false);
            }
            if (simServiceRef.current && !simServiceRef.current.contains(e.target)) {
                setIsSimServiceOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Smooth scroll and pulse highlight when activeSection changes from sidebar or pills
    useEffect(() => {
        if (activeSection && activeSection !== 'all') {
            setActiveTab('editor');
            const targetId = `contact-section-${activeSection}`;
            const timer = setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const el = document.getElementById(targetId);
                if (el) {
                    el.classList.remove('mp-card-highlight-pulse');
                    void el.offsetWidth;
                    el.classList.add('mp-card-highlight-pulse');
                    const pulseTimer = setTimeout(() => {
                        el.classList.remove('mp-card-highlight-pulse');
                    }, 2600);
                    return () => clearTimeout(pulseTimer);
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeSection]);

    const handleSimSubmit = (e) => {
        e.preventDefault();
        setSimSubmitted(true);
        setTimeout(() => setSimSubmitted(false), 4000);
    };

    // Fetch service dropdown options from MongoDB backend
    const fetchServiceOptions = async () => {
        setIsServicesLoading(true);
        try {
            const res = await fetch('/api/contact/services');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setServiceOptions(data.data);
                }
            }
        } catch (err) {
            console.warn('Could not fetch service options:', err.message);
        } finally {
            setIsServicesLoading(false);
        }
    };

    useEffect(() => {
        fetchServiceOptions();
    }, []);

    const handleAddService = async (e) => {
        e.preventDefault();
        const trimmed = newServiceName.trim();
        if (!trimmed) return;

        setIsAddingService(true);
        try {
            const res = await fetch('/api/contact/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to add service option.');
            }
            setServiceOptions((prev) => [...prev, data.data]);
            setNewServiceName('');
            setServiceFeedback({ type: 'success', message: `Added "${data.data.name}" to dropdown!` });
            window.dispatchEvent(new Event('mp_services_updated'));
            setTimeout(() => setServiceFeedback(null), 3500);
        } catch (err) {
            setServiceFeedback({ type: 'error', message: err.message });
            setTimeout(() => setServiceFeedback(null), 4000);
        } finally {
            setIsAddingService(false);
        }
    };

    const handleStartEdit = (svc) => {
        setEditingServiceId(svc._id);
        setEditingServiceName(svc.name);
    };

    const handleCancelEdit = () => {
        setEditingServiceId(null);
        setEditingServiceName('');
    };

    const handleSaveEdit = async (id) => {
        const trimmed = editingServiceName.trim();
        if (!trimmed) return;

        setIsUpdatingService(true);
        try {
            const res = await fetch(`/api/contact/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to update service option.');
            }
            setServiceOptions((prev) => prev.map((s) => (s._id === id ? data.data : s)));
            setEditingServiceId(null);
            setEditingServiceName('');
            setServiceFeedback({ type: 'success', message: `Option updated to "${data.data.name}"!` });
            window.dispatchEvent(new Event('mp_services_updated'));
            setTimeout(() => setServiceFeedback(null), 3500);
        } catch (err) {
            setServiceFeedback({ type: 'error', message: err.message });
            setTimeout(() => setServiceFeedback(null), 4000);
        } finally {
            setIsUpdatingService(false);
        }
    };

    const handleDeleteService = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}" from the dropdown options?`)) {
            return;
        }
        setDeletingServiceId(id);
        try {
            const res = await fetch(`/api/contact/services/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete service option.');
            }
            setServiceOptions((prev) => prev.filter((s) => s._id !== id));
            setServiceFeedback({ type: 'success', message: `Deleted "${name}" from dropdown options!` });
            window.dispatchEvent(new Event('mp_services_updated'));
            setTimeout(() => setServiceFeedback(null), 3500);
        } catch (err) {
            setServiceFeedback({ type: 'error', message: err.message });
            setTimeout(() => setServiceFeedback(null), 4000);
        } finally {
            setDeletingServiceId(null);
        }
    };

    const handleResetServices = async () => {
        if (!window.confirm('Reset dropdown options to defaults (Edit Video, Video Production, Reel)?')) {
            return;
        }
        try {
            const res = await fetch('/api/contact/services/reset', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Reset failed');
            setServiceOptions(data.data);
            setServiceFeedback({ type: 'success', message: 'Dropdown options restored to defaults!' });
            window.dispatchEvent(new Event('mp_services_updated'));
            setTimeout(() => setServiceFeedback(null), 3500);
        } catch (err) {
            setServiceFeedback({ type: 'error', message: err.message });
            setTimeout(() => setServiceFeedback(null), 4000);
        }
    };

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

    const isSingleSection = activeSection && activeSection !== 'all';
    const showChannels = !isSingleSection || activeSection === 'channels';
    const showHours = !isSingleSection || activeSection === 'hours';
    const showSocials = !isSingleSection || activeSection === 'socials';
    const showServices = !isSingleSection || activeSection === 'services';

    return (
        <div className={`mp-contact-edit-root ${isSingleSection ? 'is-single-section' : ''}`}>
            {/* Top Control Bar with Section Pills and Mode Switcher Toggle Button */}
            <div className="mp-contact-top-bar">
                {activeTab === 'editor' && (
                    <div className="mp-contact-subnav-pills">
                        <button
                            type="button"
                            className={`mp-contact-pill-btn ${activeSection === 'all' ? 'active' : ''}`}
                            onClick={() => onSelectSection?.('all')}
                            title="View all contact sections"
                        >
                            <span>All Sections</span>
                        </button>
                        <button
                            type="button"
                            className={`mp-contact-pill-btn ${activeSection === 'channels' ? 'active' : ''}`}
                            onClick={() => onSelectSection?.('channels')}
                            title="Jump to Contact Channels"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span>Channels</span>
                        </button>
                        <button
                            type="button"
                            className={`mp-contact-pill-btn ${activeSection === 'hours' ? 'active' : ''}`}
                            onClick={() => onSelectSection?.('hours')}
                            title="Jump to Working Hours & Availability"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Working Hours</span>
                        </button>
                        <button
                            type="button"
                            className={`mp-contact-pill-btn ${activeSection === 'socials' ? 'active' : ''}`}
                            onClick={() => onSelectSection?.('socials')}
                            title="Jump to Social Media Profiles"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                            <span>Social Profiles</span>
                        </button>
                        <button
                            type="button"
                            className={`mp-contact-pill-btn ${activeSection === 'services' ? 'active' : ''}`}
                            onClick={() => onSelectSection?.('services')}
                            title="Jump to Service Options Dropdown Manager"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <span>Service Options ({serviceOptions.length})</span>
                        </button>
                    </div>
                )}

                <div className="mp-contact-tabs" role="tablist" aria-label="Contact View Mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'editor'}
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
                        role="tab"
                        aria-selected={activeTab === 'preview'}
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

            {/* Alert Banner */}
            {alert && (
                <div className={`mp-contact-alert ${alert.type}`}>
                    <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
                    <span>{alert.message}</span>
                </div>
            )}

            {activeTab === 'editor' ? (
                <form onSubmit={handleSave} className={`mp-contact-form-layout ${isSingleSection ? 'single-section-layout' : ''}`}>
                    {/* Section 1: Direct Contact Information */}
                    {showChannels && (
                        <div id="contact-section-channels" className={`mp-contact-card ${isSingleSection ? 'fit-screen' : ''}`}>
                            <div className="mp-card-header">
                                <div className="mp-card-icon-wrap blue">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="mp-section-header-title-row">
                                        <h3 className="mp-card-title">Contact Channels</h3>
                                        {isSingleSection && (
                                            <span className="mp-section-focus-pill blue">Focused View</span>
                                        )}
                                    </div>
                                    <p className="mp-card-subtitle">Primary email, phone number, and office location displayed to visitors.</p>
                                </div>
                            </div>

                            <div className="mp-card-body-fill">
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
                        </div>
                    )}

                    {/* Section 2: Working Hours & Availability */}
                    {showHours && (
                        <div id="contact-section-hours" className={`mp-contact-card ${isSingleSection ? 'fit-screen' : ''}`}>
                            <div className="mp-card-header">
                                <div className="mp-card-icon-wrap emerald">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="mp-section-header-title-row">
                                        <h3 className="mp-card-title">Working Hours & Availability</h3>
                                        {isSingleSection && (
                                            <span className="mp-section-focus-pill emerald">Focused View</span>
                                        )}
                                    </div>
                                    <p className="mp-card-subtitle">Displayed operating schedule and availability status.</p>
                                </div>
                            </div>

                            <div className="mp-card-body-fill">
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
                        </div>
                    )}

                    {/* Section 3: Social Media Links */}
                    {showSocials && (
                        <div id="contact-section-socials" className={`mp-contact-card ${isSingleSection ? 'fit-screen' : ''}`}>
                            <div className="mp-card-header">
                                <div className="mp-card-icon-wrap violet">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="mp-section-header-title-row">
                                        <h3 className="mp-card-title">Social Media Profiles</h3>
                                        {isSingleSection && (
                                            <span className="mp-section-focus-pill violet">Focused View</span>
                                        )}
                                    </div>
                                    <p className="mp-card-subtitle">Links to your official YouTube, Instagram, Facebook, and LinkedIn pages.</p>
                                </div>
                            </div>

                            <div className="mp-card-body-fill">
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
                        </div>
                    )}

                    {/* Section 4: Contact Form Service Options (Dropdown Management) */}
                    {showServices && (
                        <div id="contact-section-services" className={`mp-contact-card ${isSingleSection ? 'fit-screen' : ''}`}>
                            <div className="mp-card-header">
                                <div className="mp-card-icon-wrap amber">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                        <polyline points="2 17 12 22 22 17" />
                                        <polyline points="2 12 12 17 22 12" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="mp-services-card-title-row">
                                        <div className="mp-section-header-title-row">
                                            <h3 className="mp-card-title">Service Type Dropdown Options</h3>
                                            {isSingleSection && (
                                                <span className="mp-section-focus-pill amber">Focused View</span>
                                            )}
                                        </div>
                                        <span className="mp-services-count-badge">
                                            {serviceOptions.length} Options
                                        </span>
                                    </div>
                                    <p className="mp-card-subtitle">
                                        Manage options visitors select in the Contact form dropdown above the message field (stored in database).
                                    </p>
                                </div>
                            </div>

                            {/* Service Alert/Feedback */}
                            {serviceFeedback && (
                                <div className={`mp-contact-alert ${serviceFeedback.type}`} style={{ marginBottom: '1.2rem' }}>
                                    <span>{serviceFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                                    <span>{serviceFeedback.message}</span>
                                </div>
                            )}

                            {/* Add New Option Form */}
                            <div className="mp-service-add-box">
                                <div className="mp-service-add-input-wrap">
                                    <input
                                        type="text"
                                        placeholder="Enter new service name (e.g. Commercial Ad, 3D VFX)..."
                                        value={newServiceName}
                                        onChange={(e) => setNewServiceName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddService(e);
                                            }
                                        }}
                                        className="mp-service-add-input"
                                    />
                                    <button
                                        type="button"
                                        className="mp-btn-add-service"
                                        onClick={handleAddService}
                                        disabled={!newServiceName.trim() || isAddingService}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        <span>{isAddingService ? 'Adding...' : 'Add Option'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Existing Options List */}
                            <div className="mp-services-manage-list">
                                {isServicesLoading ? (
                                    <div className="mp-services-loading">
                                        <span className="mp-services-spinner" />
                                        <span>Loading service options from database...</span>
                                    </div>
                                ) : serviceOptions.length === 0 ? (
                                    <div className="mp-services-empty">
                                        <p>No service options found.</p>
                                        <button
                                            type="button"
                                            className="mp-btn-restore-defaults"
                                            onClick={handleResetServices}
                                        >
                                            Restore Defaults (Edit Video, Video Production, Reel)
                                        </button>
                                    </div>
                                ) : (
                                    serviceOptions.map((svc, index) => {
                                        const isEditing = editingServiceId === svc._id;
                                        return (
                                            <div key={svc._id} className={`mp-service-manage-item ${isEditing ? 'is-editing' : ''}`}>
                                                <div className="mp-service-item-left">
                                                    <span className="mp-service-order-num">{index + 1}</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editingServiceName}
                                                            onChange={(e) => setEditingServiceName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleSaveEdit(svc._id);
                                                                } else if (e.key === 'Escape') {
                                                                    handleCancelEdit();
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="mp-service-edit-input"
                                                        />
                                                    ) : (
                                                        <div className="mp-service-name-wrap">
                                                            <span className="mp-service-item-name">{svc.name}</span>
                                                            {svc.isDefault && (
                                                                <span className="mp-service-default-pill">Default</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mp-service-item-actions">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="mp-btn-action-save"
                                                                onClick={() => handleSaveEdit(svc._id)}
                                                                disabled={!editingServiceName.trim() || isUpdatingService}
                                                                title="Save changes"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                                <span>Save</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="mp-btn-action-cancel"
                                                                onClick={handleCancelEdit}
                                                                title="Cancel edit"
                                                            >
                                                                ✕
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="mp-btn-item-edit"
                                                                onClick={() => handleStartEdit(svc)}
                                                                title={`Edit "${svc.name}"`}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                </svg>
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="mp-btn-item-delete"
                                                                onClick={() => handleDeleteService(svc._id, svc.name)}
                                                                disabled={deletingServiceId === svc._id}
                                                                title={`Delete "${svc.name}"`}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                                <span>Delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Reset Options Row */}
                            <div className="mp-services-footer-row">
                                <span className="mp-services-tip">
                                    💡 Tip: Modifications sync in real-time with the visitor contact form.
                                </span>
                                <button
                                    type="button"
                                    className="mp-btn-restore-defaults"
                                    onClick={handleResetServices}
                                >
                                    Restore Default 3 Options
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sticky Action Bar */}
                    {(showChannels || showHours || showSocials) && (
                        <div className={`mp-contact-actions-bar ${isSingleSection ? 'fit-screen-bar' : ''}`}>
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
                    )}
                </form>
            ) : (
                /* Live Website Simulation (Exact Frontend Client View) */
                <div className="mp-contact-sim-container">
                    <div className="mp-sim-badge">Live Website Simulation</div>

                    {/* Ambient glow orbs matching live website */}
                    <div className="mp-sim-glow-orb top-left" />
                    <div className="mp-sim-glow-orb bottom-right" />

                    {/* Header Pill */}
                    <div className="mp-sim-header-pill">
                        <div className="mp-sim-header-pill-inner">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>CONTACT US</span>
                        </div>
                    </div>

                    <div className="mp-sim-frontend-layout">
                        {/* Left Column: Client Information & Details */}
                        <div className="mp-sim-left">
                            <h2 className="mp-sim-headline">
                                How can we help<br />
                                you today?
                            </h2>

                            <p className="mp-sim-subtext">
                                Our dedicated customer support team is just a message or call away.
                            </p>

                            <div className="mp-sim-info-list">
                                {/* Email item */}
                                <div className="mp-sim-info-item">
                                    <div className="mp-sim-icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="16" x="2" y="4" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    <div className="mp-sim-text-col">
                                        <span className="mp-sim-info-label">Email:</span>
                                        <a href={`mailto:${info.email}`} className="mp-sim-info-val">
                                            {info.email || 'mp.motionpub@gmail.com'}
                                        </a>
                                    </div>
                                </div>

                                {/* Phone item */}
                                <div className="mp-sim-info-item">
                                    <div className="mp-sim-icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                    </div>
                                    <div className="mp-sim-text-col">
                                        <span className="mp-sim-info-label">Phone:</span>
                                        <a href={`tel:${(info.phone || '').replace(/\s+/g, '')}`} className="mp-sim-info-val">
                                            {info.phone || '+94 76 237 1431'}
                                        </a>
                                    </div>
                                </div>

                                {/* Location item */}
                                <div className="mp-sim-info-item">
                                    <div className="mp-sim-icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div className="mp-sim-text-col">
                                        <span className="mp-sim-info-label">Location:</span>
                                        <span className="mp-sim-info-val">
                                            {info.location || 'Walapane, Central Province, Sri Lanka'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Working Hours Card */}
                            <div className="mp-sim-hours-card">
                                <div className="mp-sim-hours-header">
                                    <div className="mp-sim-hours-title-wrap">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mp-sim-hours-icon">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span className="mp-sim-hours-title">Working Hours</span>
                                    </div>
                                    <span className={`mp-sim-status-pill ${isOpenNow ? 'open' : 'closed'}`}>
                                        <span className="mp-sim-status-dot" />
                                        {isOpenNow ? 'Open Now' : 'Closed Now'}
                                    </span>
                                </div>

                                <div className="mp-sim-hours-grid">
                                    <div className="mp-sim-hours-row">
                                        <span className="mp-sim-days-tag">{info.workingDays || 'Monday – Saturday'}</span>
                                        <span className="mp-sim-time-tag">{info.workingHours || '10:00 AM – 10:00 PM'}</span>
                                    </div>
                                    <div className="mp-sim-hours-row">
                                        <span className="mp-sim-days-tag">{info.offDays || 'Sunday'}</span>
                                        <span className="mp-sim-time-tag closed">Closed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media Links */}
                            <div className="mp-sim-socials-wrap">
                                <span className="mp-sim-socials-label">Connect with us</span>
                                <div className="mp-sim-social-links-row">
                                    {info.facebookUrl && (
                                        <a href={info.facebookUrl} target="_blank" rel="noopener noreferrer" className="mp-sim-social-link-btn facebook" title="Facebook">
                                            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </a>
                                    )}
                                    {info.youtubeUrl && (
                                        <a href={info.youtubeUrl} target="_blank" rel="noopener noreferrer" className="mp-sim-social-link-btn youtube" title="YouTube">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                            </svg>
                                        </a>
                                    )}
                                    {info.instagramUrl && (
                                        <a href={info.instagramUrl} target="_blank" rel="noopener noreferrer" className="mp-sim-social-link-btn instagram" title="Instagram">
                                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                            </svg>
                                        </a>
                                    )}
                                    {info.linkedinUrl && (
                                        <a href={info.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mp-sim-social-link-btn linkedin" title="LinkedIn">
                                            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Interactive Client Form Simulation */}
                        <div className="mp-sim-form-card">
                            <form className="mp-sim-form" onSubmit={handleSimSubmit}>
                                {/* Row 1: Names */}
                                <div className="mp-sim-form-row">
                                    <div className="mp-sim-form-group">
                                        <label className="mp-sim-form-label">First name*</label>
                                        <input
                                            type="text"
                                            className="mp-sim-form-input"
                                            placeholder="John"
                                            value={simForm.firstName}
                                            onChange={(e) => setSimForm({ ...simForm, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="mp-sim-form-group">
                                        <label className="mp-sim-form-label">Last name*</label>
                                        <input
                                            type="text"
                                            className="mp-sim-form-input"
                                            placeholder="Doe"
                                            value={simForm.lastName}
                                            onChange={(e) => setSimForm({ ...simForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Work Email */}
                                <div className="mp-sim-form-group">
                                    <label className="mp-sim-form-label">Work email*</label>
                                    <input
                                        type="email"
                                        className="mp-sim-form-input"
                                        placeholder="Enter email"
                                        value={simForm.email}
                                        onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                                    />
                                </div>

                                {/* Row 3: Phone with Country Code */}
                                <div className="mp-sim-form-group">
                                    <label className="mp-sim-form-label">Phone number*</label>
                                    <div className="mp-sim-phone-wrap">
                                        <div className="mp-sim-country-box" ref={simCountryRef}>
                                            <button
                                                type="button"
                                                className="mp-sim-country-btn"
                                                onClick={() => setIsSimCountryOpen((prev) => !prev)}
                                            >
                                                <span className="mp-sim-country-flag">
                                                    <img
                                                        src={`https://flagcdn.com/24x18/${simCountry.country.toLowerCase()}.png`}
                                                        alt=""
                                                        className="mp-sim-country-flag-img"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </span>
                                                <span className="mp-sim-country-code">{simCountry.code}</span>
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    className={`mp-sim-country-chevron ${isSimCountryOpen ? 'open' : ''}`}
                                                >
                                                    <path d="m6 9 6 6 6-6" />
                                                </svg>
                                            </button>

                                            {isSimCountryOpen && (
                                                <ul className="mp-sim-country-dropdown">
                                                    {COUNTRIES.map((c) => (
                                                        <li
                                                            key={`${c.country}-${c.code}`}
                                                            className={`mp-sim-country-option ${c.country === simCountry.country ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setSimCountry(c);
                                                                setIsSimCountryOpen(false);
                                                            }}
                                                        >
                                                            <span>{c.flag}</span>
                                                            <span style={{ flex: 1 }}>{c.name}</span>
                                                            <span style={{ color: '#94a3b8' }}>{c.code}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <input
                                            type="tel"
                                            className="mp-sim-phone-text-input"
                                            placeholder="771234567"
                                            maxLength={9}
                                            value={simForm.phone}
                                            onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Service Type Dropdown (Connected to MongoDB service options) */}
                                <div className="mp-sim-form-group">
                                    <label className="mp-sim-form-label">Service Type*</label>
                                    <div className="mp-sim-service-wrap" ref={simServiceRef}>
                                        <button
                                            type="button"
                                            className={`mp-sim-service-btn ${isSimServiceOpen ? 'active' : ''}`}
                                            onClick={() => setIsSimServiceOpen((prev) => !prev)}
                                        >
                                            <div className="mp-sim-service-val">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="mp-sim-service-icon"
                                                >
                                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                    <polyline points="2 17 12 22 22 17" />
                                                    <polyline points="2 12 12 17 22 12" />
                                                </svg>
                                                <span className="mp-sim-service-name-text">
                                                    {simService || (serviceOptions[0]?.name) || 'Edit Video'}
                                                </span>
                                            </div>
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                className={`mp-sim-service-chevron ${isSimServiceOpen ? 'open' : ''}`}
                                            >
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </button>

                                        {isSimServiceOpen && (
                                            <ul className="mp-sim-service-dropdown-list">
                                                {serviceOptions.map((svc) => {
                                                    const isSelected = (simService || serviceOptions[0]?.name) === svc.name;
                                                    return (
                                                        <li
                                                            key={svc._id || svc.name}
                                                            className={`mp-sim-service-option ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setSimService(svc.name);
                                                                setIsSimServiceOpen(false);
                                                            }}
                                                        >
                                                            <span>{svc.name}</span>
                                                            {isSelected && (
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#a78bfa' }}>
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Row 5: Message */}
                                <div className="mp-sim-form-group">
                                    <label className="mp-sim-form-label">Message*</label>
                                    <textarea
                                        rows={4}
                                        className="mp-sim-form-textarea"
                                        placeholder="Enter a question, feedback, or suggestions..."
                                        value={simForm.message}
                                        onChange={(e) => setSimForm({ ...simForm, message: e.target.value })}
                                    />
                                </div>

                                {/* Status Feedback */}
                                {simSubmitted && (
                                    <div className="mp-sim-status-alert">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span>Interactive Simulation: Form validation succeeded! In live mode, this sends inquiries directly to your backend.</span>
                                    </div>
                                )}

                                <button type="submit" className="mp-sim-submit-btn">
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
