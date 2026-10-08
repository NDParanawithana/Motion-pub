import { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/pageHeader/pageHeader';
import './contact.css';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

// Determine if currently within working hours (Mon–Sat, 10:00 AM – 10:00 PM in Sri Lanka time)
function getIsOpenNow() {
    try {
        const now = new Date();
        const slDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
        const slDate = new Date(slDateStr);
        const day = slDate.getDay(); // 0 = Sun, 1-6 = Mon-Sat
        const hours = slDate.getHours();
        const minutes = slDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // Mon–Sat (1–6) between 10:00 AM (600 mins) and 10:00 PM (1320 mins)
        return day >= 1 && day <= 6 && totalMinutes >= 600 && totalMinutes < 1320;
    } catch {
        return true;
    }
}

const DEFAULT_CONTACT_SETTINGS = {
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

const DEFAULT_SERVICE_OPTIONS = [
    { _id: '1', name: 'Edit Video' },
    { _id: '2', name: 'Video Production' },
    { _id: '3', name: 'Reel' },
];

export default function Contact() {
    const [serviceOptions, setServiceOptions] = useState(DEFAULT_SERVICE_OPTIONS);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceType: 'Edit Video',
        message: '',
    });

    const [contactSettings, setContactSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('mp_contact_settings');
            return saved ? { ...DEFAULT_CONTACT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_CONTACT_SETTINGS;
        } catch {
            return DEFAULT_CONTACT_SETTINGS;
        }
    });

    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [status, setStatus] = useState({ state: 'idle', message: '' }); // 'idle' | 'loading' | 'success' | 'error'
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isOpenNow, setIsOpenNow] = useState(getIsOpenNow);

    const dropdownRef = useRef(null);

    // Fetch dynamic service options from backend (with live updates listener)
    useEffect(() => {
        let isMounted = true;
        const fetchServices = async () => {
            try {
                const res = await fetch('/api/contact/services');
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                        if (isMounted) {
                            setServiceOptions(json.data);
                            setFormData((prev) => ({
                                ...prev,
                                serviceType: prev.serviceType || json.data[0].name
                            }));
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not load service options from backend, using defaults:', err.message);
            }
        };

        fetchServices();

        const handleServiceUpdate = () => {
            fetchServices();
        };
        window.addEventListener('mp_services_updated', handleServiceUpdate);

        return () => {
            isMounted = false;
            window.removeEventListener('mp_services_updated', handleServiceUpdate);
        };
    }, []);

    // Close service dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
                setIsServiceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync contact settings when updated from Admin Dashboard
    useEffect(() => {
        const handleStorage = () => {
            try {
                const saved = localStorage.getItem('mp_contact_settings');
                if (saved) {
                    setContactSettings({ ...DEFAULT_CONTACT_SETTINGS, ...JSON.parse(saved) });
                }
            } catch {}
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Update open status periodically
    useEffect(() => {
        const timer = setInterval(() => {
            setIsOpenNow(getIsOpenNow());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Close country dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsCountryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dismiss popup on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowSuccessPopup(false);
            }
        };
        if (showSuccessPopup) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSuccessPopup]);

    // Auto-remove status alert banner after a 5-second delay
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => {
                setStatus({ state: 'idle', message: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status.message]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            // Keep only digits
            let digits = value.replace(/\D/g, '');
            // If user enters leading 0 (e.g. 0771234567), strip it for country code prefix
            if (digits.startsWith('0')) {
                digits = digits.slice(1);
            }
            // Enforce max 9 digits
            digits = digits.slice(0, 9);
            setFormData((prev) => ({ ...prev, phone: digits }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        if (status.state === 'error') {
            setStatus({ state: 'idle', message: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName.trim() || !formData.email.trim() || !formData.message.trim()) {
            setStatus({
                state: 'error',
                message: 'Please fill in all required fields (First name, Email, and Message).',
            });
            return;
        }

        if (!formData.serviceType || !formData.serviceType.trim()) {
            setStatus({
                state: 'error',
                message: 'Please select a service type.',
            });
            return;
        }

        const trimmedEmail = formData.email.trim();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setStatus({
                state: 'error',
                message: 'Please enter a valid email address (e.g. name@example.com).',
            });
            return;
        }

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!phoneDigits) {
            setStatus({
                state: 'error',
                message: 'Please enter your phone number.',
            });
            return;
        }

        if (phoneDigits.length !== 9) {
            setStatus({
                state: 'error',
                message: 'Phone number must be exactly 9 digits (e.g. 771234567).',
            });
            return;
        }

        setStatus({ state: 'loading', message: '' });

        const payload = {
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            countryCode: selectedCountry.code,
            rawPhone: phoneDigits,
            phone: `${selectedCountry.code} ${phoneDigits}`,
            serviceType: formData.serviceType.trim(),
            message: formData.message.trim(),
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to submit form. Please try again.');
            }

            const successMessage = data.message || 'your message sent  we will contact you soon';

            setStatus({
                state: 'success',
                message: successMessage,
            });

            // Trigger success popup
            setShowSuccessPopup(true);

            // Reset form fields
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                serviceType: serviceOptions[0]?.name || 'Edit Video',
                message: '',
            });
        } catch (err) {
            setStatus({
                state: 'error',
                message: err.message || 'Something went wrong. Please check your connection and try again.',
            });
        }
    };

    return (
        <section className="mp-contact-section" id="contact">
            {/* Ambient background glow matching Motion Pub aesthetic */}
            <div className="mp-contact-glow-orb top-left" />
            <div className="mp-contact-glow-orb bottom-right" />

            {/* Sticky Page Heading in Pin Container with matching icon and changeable props */}
            <PageHeader
                text="CONTACT US"
                textColor="#1091b1ff"
                containerColor="#8888881f"
                icon="contact"
            />

            <div className="mp-contact-container">
                {/* Left Column: Information & Branding */}
                <div className="mp-contact-left">
                    {/* Headline */}
                    <h2 className="mp-contact-headline">
                        How can we help<br />
                        you today?
                    </h2>

                    {/* Subtext */}
                    <p className="mp-contact-subtext">
                        Our dedicated customer support team is just a message or call away.
                    </p>

                    {/* Contact Details List */}
                    <div className="mp-contact-info-list">
                        {/* Email item */}
                        <div className="mp-contact-info-item">
                            <div className="mp-info-icon-box">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                            <div className="mp-info-text-col">
                                <span className="mp-info-label">Email:</span>
                                <a href={`mailto:${contactSettings.email}`} className="mp-info-val">
                                    {contactSettings.email}
                                </a>
                            </div>
                        </div>

                        {/* Phone item */}
                        <div className="mp-contact-info-item">
                            <div className="mp-info-icon-box">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            <div className="mp-info-text-col">
                                <span className="mp-info-label">Phone:</span>
                                <a href={`tel:${(contactSettings.phone || '').replace(/\s+/g, '')}`} className="mp-info-val">
                                    {contactSettings.phone}
                                </a>
                            </div>
                        </div>

                        {/* Location item */}
                        <div className="mp-contact-info-item">
                            <div className="mp-info-icon-box">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div className="mp-info-text-col">
                                <span className="mp-info-label">Location:</span>
                                <span className="mp-info-val">
                                    {contactSettings.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Business Hours & Live Availability Card */}
                    <div className="mp-hours-card">
                        <div className="mp-hours-header">
                            <div className="mp-hours-title-wrap">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mp-hours-icon"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span className="mp-hours-title">Working Hours</span>
                            </div>
                            <span className={`mp-status-pill ${isOpenNow ? 'open' : 'closed'}`}>
                                <span className="mp-status-dot" />
                                {isOpenNow ? 'Open Now' : 'Closed Now'}
                            </span>
                        </div>

                        <div className="mp-hours-grid">
                            <div className="mp-hours-row active-days">
                                <span className="mp-days-tag">{contactSettings.workingDays}</span>
                                <span className="mp-time-tag">{contactSettings.workingHours}</span>
                            </div>
                            <div className="mp-hours-row closed-days">
                                <span className="mp-days-tag">{contactSettings.offDays}</span>
                                <span className="mp-time-tag closed">Closed</span>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="mp-contact-socials-wrap">
                        <span className="mp-socials-label">Connect with us</span>
                        <div className="mp-social-links-row">
                            {/* Facebook */}
                            {contactSettings.facebookUrl && (
                                <a
                                    href={contactSettings.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mp-social-link-btn facebook"
                                    aria-label="Motion Pub on Facebook"
                                    title="Facebook"
                                >
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                            )}

                            {/* YouTube */}
                            {contactSettings.youtubeUrl && (
                                <a
                                    href={contactSettings.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mp-social-link-btn youtube"
                                    aria-label="Motion Pub on YouTube"
                                    title="YouTube"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            )}

                            {/* Instagram */}
                            {contactSettings.instagramUrl && (
                                <a
                                    href={contactSettings.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mp-social-link-btn instagram"
                                    aria-label="Motion Pub on Instagram"
                                    title="Instagram"
                                >
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                    </svg>
                                </a>
                            )}

                            {/* LinkedIn */}
                            {contactSettings.linkedinUrl && (
                                <a
                                    href={contactSettings.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mp-social-link-btn linkedin"
                                    aria-label="Motion Pub on LinkedIn"
                                    title="LinkedIn"
                                >
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact Form Card */}
                <div className="mp-contact-card-wrap">
                    <div className="mp-contact-card">
                        <form onSubmit={handleSubmit} className="mp-contact-form" noValidate>
                            {/* Row 1: First name & Last name */}
                            <div className="mp-form-row two-cols">
                                <div className="mp-form-group">
                                    <label htmlFor="firstName" className="mp-form-label">
                                        First name*
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        required
                                        className="mp-form-input"
                                    />
                                </div>

                                <div className="mp-form-group">
                                    <label htmlFor="lastName" className="mp-form-label">
                                        Last name*
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        required
                                        className="mp-form-input"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Work email */}
                            <div className="mp-form-group">
                                <label htmlFor="email" className="mp-form-label">
                                    Work email*
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                    className="mp-form-input"
                                />
                            </div>

                            {/* Row 3: Phone number with Country selector */}
                            <div className="mp-form-group">
                                <label htmlFor="phone" className="mp-form-label">
                                    Phone number*
                                </label>
                                <div className="mp-phone-input-wrap">
                                    {/* Country Selector Dropdown */}
                                    <div className="mp-country-select-box" ref={dropdownRef}>
                                        <button
                                            type="button"
                                            className="mp-country-btn"
                                            onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                                            aria-label="Select Country Code"
                                            aria-expanded={isCountryDropdownOpen}
                                        >
                                            <span className="mp-country-flag">
                                                <img
                                                    src={`https://flagcdn.com/24x18/${selectedCountry.country.toLowerCase()}.png`}
                                                    alt=""
                                                    className="mp-country-flag-img"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling;
                                                        if (fallback) fallback.style.display = 'inline';
                                                    }}
                                                />
                                                <span className="mp-country-flag-emoji" style={{ display: 'none' }}>
                                                    {selectedCountry.flag}
                                                </span>
                                            </span>
                                            <span className="mp-country-code">{selectedCountry.code}</span>
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`mp-country-chevron ${isCountryDropdownOpen ? 'open' : ''}`}
                                            >
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </button>

                                        {isCountryDropdownOpen && (
                                            <ul className="mp-country-dropdown-list">
                                                {COUNTRIES.map((c) => (
                                                    <li
                                                        key={`${c.country}-${c.code}`}
                                                        className={`mp-country-option ${c.country === selectedCountry.country ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedCountry(c);
                                                            setIsCountryDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="mp-option-flag">
                                                            <img
                                                                src={`https://flagcdn.com/24x18/${c.country.toLowerCase()}.png`}
                                                                alt=""
                                                                className="mp-country-flag-img"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const fallback = e.currentTarget.nextElementSibling;
                                                                    if (fallback) fallback.style.display = 'inline';
                                                                }}
                                                            />
                                                            <span className="mp-option-flag-emoji" style={{ display: 'none' }}>
                                                                {c.flag}
                                                            </span>
                                                        </span>
                                                        <span className="mp-option-name">{c.name}</span>
                                                        <span className="mp-option-code">{c.code}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Phone input */}
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="771234567"
                                        maxLength={9}
                                        inputMode="numeric"
                                        pattern="[0-9]{9}"
                                        required
                                        className="mp-phone-text-input"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Service Type Dropdown */}
                            <div className="mp-form-group">
                                <label htmlFor="serviceTypeBtn" className="mp-form-label">
                                    Service Type*
                                </label>
                                <div className="mp-service-select-wrap" ref={serviceDropdownRef}>
                                    <button
                                        type="button"
                                        id="serviceTypeBtn"
                                        className={`mp-service-select-btn ${isServiceDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                                        aria-haspopup="listbox"
                                        aria-expanded={isServiceDropdownOpen}
                                    >
                                        <div className="mp-service-select-val">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="mp-service-icon"
                                            >
                                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                <polyline points="2 17 12 22 22 17" />
                                                <polyline points="2 12 12 17 22 12" />
                                            </svg>
                                            <span className="mp-service-name-text">
                                                {formData.serviceType || 'Select a service'}
                                            </span>
                                        </div>
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`mp-service-chevron ${isServiceDropdownOpen ? 'open' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>

                                    {isServiceDropdownOpen && (
                                        <ul className="mp-service-dropdown-list" role="listbox">
                                            {serviceOptions.map((svc) => {
                                                const isSelected = formData.serviceType === svc.name;
                                                return (
                                                    <li
                                                        key={svc._id || svc.name}
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        className={`mp-service-option ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setFormData((prev) => ({ ...prev, serviceType: svc.name }));
                                                            setIsServiceDropdownOpen(false);
                                                            if (status.state === 'error') {
                                                                setStatus({ state: 'idle', message: '' });
                                                            }
                                                        }}
                                                    >
                                                        <span className="mp-service-option-name">{svc.name}</span>
                                                        {isSelected && (
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mp-service-check-icon">
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
                            <div className="mp-form-group">
                                <label htmlFor="message" className="mp-form-label">
                                    Message*
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Enter a question, feedback, or suggestions..."
                                    required
                                    className="mp-form-textarea"
                                />
                            </div>

                            {/* Status Alert Banner */}
                            {status.message && (
                                <div className={`mp-form-status-alert ${status.state}`}>
                                    {status.state === 'success' ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    )}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="mp-form-action-row">
                                <button
                                    type="submit"
                                    disabled={status.state === 'loading'}
                                    className="mp-contact-submit-btn"
                                >
                                    {status.state === 'loading' ? (
                                        <span className="mp-btn-loading-content">
                                            <span className="mp-btn-spinner" />
                                            <span>Sending...</span>
                                        </span>
                                    ) : (
                                        <span>Submit</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Success Popup Modal */}
            {showSuccessPopup && (
                <div
                    className="mp-contact-popup-backdrop"
                    onClick={() => setShowSuccessPopup(false)}
                >
                    <div
                        className="mp-contact-popup-card"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="mp-popup-close-btn"
                            onClick={() => setShowSuccessPopup(false)}
                            aria-label="Close message"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="mp-popup-icon-ring">
                            <svg
                                width="34"
                                height="34"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mp-popup-check-icon"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h3 className="mp-popup-title">Message Sent!</h3>
                        <p className="mp-popup-message">
                            your message sent  we will contact you soon
                        </p>

                        <button
                            type="button"
                            className="mp-popup-confirm-btn"
                            onClick={() => setShowSuccessPopup(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
