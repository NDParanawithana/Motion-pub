import { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/pageHeader/pageHeader';
import './contact.css';
import { detectPlatform, PLATFORM_META, renderSocialIcon } from '../../utils/socialIcons';
import MpCalender from '../../components/mpCalender/mpCalender';

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

// Determine if currently within working hours (Sri Lanka time) or manually closed
function getIsOpenNow(settings) {
    if (settings?.isForceClosed) {
        return false;
    }
    try {
        const now = new Date();
        const slDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
        const slDate = new Date(slDateStr);
        const day = slDate.getDay(); // 0 = Sun, 1-6 = Mon-Sat
        const hours = slDate.getHours();
        const minutes = slDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // Custom hours parsing if defined
        if (settings?.workingHours && settings.workingHours.includes('–')) {
            const [startStr, endStr] = settings.workingHours.split('–').map((s) => s.trim());
            const parseTimeStr = (tStr) => {
                const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return null;
                let h = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const isPM = match[3].toUpperCase() === 'PM';
                if (isPM && h < 12) h += 12;
                if (!isPM && h === 12) h = 0;
                return h * 60 + m;
            };
            const startMins = parseTimeStr(startStr);
            const endMins = parseTimeStr(endStr);
            if (startMins !== null && endMins !== null) {
                const isSunday = day === 0;
                const isOffSunday = (settings.offDays || '').toLowerCase().includes('sunday');
                if (isSunday && isOffSunday) return false;
                return totalMinutes >= startMins && totalMinutes < endMins;
            }
        }

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
    isForceClosed: false,
    closedNotice: '',
    facebookUrl: 'https://facebook.com',
    youtubeUrl: 'https://youtube.com',
    instagramUrl: 'https://instagram.com',
    linkedinUrl: 'https://linkedin.com',
    customSocials: [],
};

const DEFAULT_SERVICE_OPTIONS = [
    { _id: '1', name: 'Edit Video' },
    { _id: '2', name: 'Video Production' },
    { _id: '3', name: 'Reel' },
];

const ONLINE_MEETING_METHODS = [
    {
        id: 'google_meet',
        name: 'Google Meet',
        icon: (
            <svg width="24" height="24" viewBox="0 0 87.5 72" fill="none">
                <path d="M49.5 36L58 44.5V60C58 64.4183 54.4183 68 50 68H12C7.58172 68 4 64.4183 4 60V36L16 26L31 36L49.5 36Z" fill="#00832D" />
                <path d="M4 20C4 15.5817 7.58172 12 12 12H31L36 24L31 36H4V20Z" fill="#0066DA" />
                <path d="M4 36H31V54H4V36Z" fill="#E53935" />
                <path d="M58 20V36L49.5 44.5L31 36V12H50C54.4183 12 58 15.5817 58 20Z" fill="#FFBA00" />
                <path d="M58 28.5L83.5 10V62L58 43.5V28.5Z" fill="#00AC47" />
            </svg>
        ),
        desc: 'Direct web link sent to your email'
    },
    {
        id: 'zoom',
        name: 'Zoom Meeting',
        icon: (
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="11" fill="#2D8CFF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M11 17.5C11 15.567 12.567 14 14.5 14H24.5C26.433 14 28 15.567 28 17.5V26.5C28 28.433 26.433 30 24.5 30H14.5C12.567 30 11 28.433 11 26.5V17.5ZM30 20.2L36 16.5V31.5L30 27.8V20.2Z" fill="white" />
            </svg>
        ),
        desc: 'Zoom link & meeting passcode'
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp Video',
        icon: (
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="11" fill="#25D366" />
                <path fillRule="evenodd" clipRule="evenodd" d="M24 10C16.268 10 10 16.268 10 24C10 26.68 10.756 29.232 12.188 31.428L10.5 37.5L16.8 35.864C18.928 37.168 21.392 37.9 24 37.9C31.732 37.9 38 31.632 38 23.9C38 16.168 31.732 10 24 10ZM20.852 16.48C20.5 15.7 20.088 15.684 19.5 15.684C19.04 15.684 18.5 15.7 18.04 16.16C17.58 16.62 16.3 17.82 16.3 20.24C16.3 22.66 18.06 25 18.3 25.32C18.54 25.64 21.72 30.72 26.74 32.72C30.92 34.38 31.78 33.94 32.7 33.84C33.62 33.74 35.68 32.6 36.14 31.32C36.6 30.04 36.6 28.94 36.46 28.72C36.32 28.5 35.96 28.36 35.42 28.1C34.88 27.84 32.22 26.54 31.72 26.36C31.22 26.18 30.86 26.1 30.5 26.64C30.14 27.18 29.1 28.48 28.8 28.82C28.5 29.16 28.2 29.2 27.66 28.94C27.12 28.68 25.388 28.112 23.332 26.28C21.732 24.856 20.652 23.092 20.34 22.56C20.028 22.028 20.308 21.74 20.58 21.472C20.82 21.232 21.12 20.84 21.38 20.54C21.64 20.24 21.74 20.02 21.92 19.66C22.1 19.3 22 19 21.86 18.74C22 18.48 20.62 15.82 20.852 16.48Z" fill="white" />
            </svg>
        ),
        desc: 'Video call straight to your phone'
    },
    {
        id: 'teams',
        name: 'Microsoft Teams',
        icon: (
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect x="22" y="12" width="20" height="22" rx="4" fill="#505AC9" />
                <circle cx="32" cy="8" r="4" fill="#505AC9" />
                <rect x="6" y="8" width="22" height="28" rx="5" fill="#7B83EB" />
                <circle cx="17" cy="4" r="4.5" fill="#7B83EB" />
                <path d="M12 18H22V21.5H18.5V30H15.5V21.5H12V18Z" fill="white" />
            </svg>
        ),
        desc: 'Microsoft Teams invite link'
    }
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
        meetingMethod: 'Google Meet',
        message: '',
    });

    const [contactSettings, setContactSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('mp_contact_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...DEFAULT_CONTACT_SETTINGS,
                    ...parsed,
                    customSocials: Array.isArray(parsed.customSocials) ? parsed.customSocials : []
                };
            }
            return DEFAULT_CONTACT_SETTINGS;
        } catch {
            return DEFAULT_CONTACT_SETTINGS;
        }
    });

    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [status, setStatus] = useState({ state: 'idle', message: '' }); // 'idle' | 'loading' | 'success' | 'error'
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isOpenNow, setIsOpenNow] = useState(() => getIsOpenNow(contactSettings));

    // Client Meeting Appointment State
    const [activeMode, setActiveMode] = useState('appointment'); // 'appointment' | 'message'
    const [selectedMeetingDate, setSelectedMeetingDate] = useState('');
    const [selectedMeetingTime, setSelectedMeetingTime] = useState('');
    const [bookedAppointmentInfo, setBookedAppointmentInfo] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [activeBookingSection, setActiveBookingSection] = useState('details'); // 'details' | 'datetime'

    const dropdownRef = useRef(null);
    const modalCardRef = useRef(null);

    const handleSectionChange = (section) => {
        setActiveBookingSection(section);
        if (modalCardRef.current) {
            modalCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
                    const parsed = JSON.parse(saved);
                    const merged = {
                        ...DEFAULT_CONTACT_SETTINGS,
                        ...parsed,
                        customSocials: Array.isArray(parsed.customSocials) ? parsed.customSocials : []
                    };
                    setContactSettings(merged);
                    setIsOpenNow(getIsOpenNow(merged));
                }
            } catch {}
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Update open status periodically and on settings change
    useEffect(() => {
        setIsOpenNow(getIsOpenNow(contactSettings));
        const timer = setInterval(() => {
            setIsOpenNow(getIsOpenNow(contactSettings));
        }, 60000);
        return () => clearInterval(timer);
    }, [contactSettings]);

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

        if (!formData.firstName.trim() || !formData.email.trim()) {
            setStatus({
                state: 'error',
                message: 'Please fill in your name and email address.',
            });
            handleSectionChange('details');
            return;
        }

        if (activeMode === 'message' && !formData.message.trim()) {
            setStatus({
                state: 'error',
                message: 'Please provide a message for your inquiry.',
            });
            return;
        }

        if (!formData.serviceType || !formData.serviceType.trim()) {
            setStatus({
                state: 'error',
                message: 'Please select a service type.',
            });
            handleSectionChange('details');
            return;
        }

        const trimmedEmail = formData.email.trim();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setStatus({
                state: 'error',
                message: 'Please enter a valid email address (e.g. name@example.com).',
            });
            handleSectionChange('details');
            return;
        }

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!phoneDigits) {
            setStatus({
                state: 'error',
                message: 'Please enter your phone number.',
            });
            handleSectionChange('details');
            return;
        }

        if (phoneDigits.length !== 9) {
            setStatus({
                state: 'error',
                message: 'Phone number must be exactly 9 digits (e.g. 771234567).',
            });
            handleSectionChange('details');
            return;
        }

        if (activeMode === 'appointment') {
            if (!selectedMeetingDate) {
                setStatus({
                    state: 'error',
                    message: 'Please select an available meeting date on the calendar.',
                });
                handleSectionChange('datetime');
                return;
            }
            if (!selectedMeetingTime) {
                setStatus({
                    state: 'error',
                    message: 'Please choose an available meeting time slot on the calendar.',
                });
                handleSectionChange('datetime');
                return;
            }
        }

        setStatus({ state: 'loading', message: '' });

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
        const formattedPhone = `${selectedCountry.code} ${phoneDigits}`;

        // 1. Appointment Booking Mode
        if (activeMode === 'appointment') {
            const apptPayload = {
                clientName: fullName,
                clientEmail: trimmedEmail,
                clientPhone: formattedPhone,
                serviceType: formData.serviceType.trim(),
                meetingMethod: formData.meetingMethod || 'Google Meet',
                date: selectedMeetingDate,
                timeSlot: selectedMeetingTime,
                notes: formData.message.trim(),
                source: 'client',
                status: 'confirmed',
            };

            try {
                const res = await fetch('/api/contact/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apptPayload),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to schedule appointment. Please choose another slot.');
                }

                // Also optionally record inquiry in messages
                fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fullName,
                        firstName: formData.firstName.trim(),
                        lastName: formData.lastName.trim(),
                        email: trimmedEmail,
                        phone: formattedPhone,
                        serviceType: formData.serviceType.trim(),
                        message: `[Scheduled Online Meeting: ${selectedMeetingDate} at ${selectedMeetingTime} via ${formData.meetingMethod || 'Google Meet'}] ${formData.message.trim()}`.trim(),
                    }),
                }).catch(() => {});

                // Local storage sync fallback
                try {
                    const saved = localStorage.getItem('mp_client_appointments');
                    const existingList = saved ? JSON.parse(saved) : [];
                    const updatedList = [data.data || { _id: `local-${Date.now()}`, ...apptPayload }, ...existingList];
                    localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
                } catch {}

                // Trigger real-time cross-tab sync
                window.dispatchEvent(new Event('mp_appointments_updated'));

                setBookedAppointmentInfo({
                    name: fullName,
                    date: selectedMeetingDate,
                    time: selectedMeetingTime,
                    service: formData.serviceType.trim(),
                    method: formData.meetingMethod || 'Google Meet',
                });

                setStatus({
                    state: 'success',
                    message: `Meeting confirmed for ${selectedMeetingDate} at ${selectedMeetingTime} via ${formData.meetingMethod || 'Google Meet'}!`,
                });

                setIsBookingModalOpen(false);
                setShowSuccessPopup(true);

                // Reset form
                setSelectedMeetingDate('');
                setSelectedMeetingTime('');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    serviceType: serviceOptions[0]?.name || 'Edit Video',
                    meetingMethod: 'Google Meet',
                    message: '',
                });
            } catch (err) {
                setStatus({
                    state: 'error',
                    message: err.message || 'Something went wrong scheduling your appointment. Please try again.',
                });
            }
            return;
        }

        // 2. Standard Inquiry Message Mode
        const payload = {
            name: fullName,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: trimmedEmail,
            countryCode: selectedCountry.code,
            rawPhone: phoneDigits,
            phone: formattedPhone,
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

            setBookedAppointmentInfo(null);
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
        <section className={`mp-contact-section ${activeMode === 'appointment' ? 'is-booking-mode' : ''}`} id="contact">
            {/* Ambient background glow matching Motion Pub aesthetic */}
            <div className="mp-contact-glow-orb top-left" />
            <div className="mp-contact-glow-orb bottom-right" />

            {/* Sticky Page Heading in Pin Container with matching icon and changeable props */}
            <PageHeader
                text="CONTACT US"
                textColor="#1091b1ff"
                containerColor="#8888881f"
                icon="contact"
                offset={0}
            />

            <div className={`mp-contact-container ${activeMode === 'appointment' ? 'is-booking-mode' : ''}`}>
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
                            <div className="mp-hours-status-wrap">
                                <span className={`mp-status-pill ${isOpenNow ? 'open' : 'closed'}`}>
                                    <span className="mp-status-dot" />
                                    {isOpenNow ? 'Open Now' : 'Closed Now'}
                                </span>
                                {!isOpenNow && contactSettings.closedNotice && (
                                    <span className="mp-status-notice-tag">
                                        {contactSettings.closedNotice}
                                    </span>
                                )}
                            </div>
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

                            {/* Additional Custom Social Links */}
                            {(contactSettings.customSocials || []).map((link) => {
                                if (!link.url) return null;
                                const platform = detectPlatform(link.title, link.url);
                                const meta = PLATFORM_META[platform] || PLATFORM_META.generic;
                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`mp-social-link-btn ${meta.cssClass}`}
                                        aria-label={link.title || `Motion Pub on ${meta.name}`}
                                        title={link.title || meta.name}
                                    >
                                        {renderSocialIcon(platform, 19)}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact Form Card */}
                <div className="mp-contact-card-wrap">
                    <div className="mp-contact-card">
                        <div className="mp-appointment-hero-card">
                                <div className="mp-appt-card-top">
                                    <div className="mp-appt-icon-box">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="mp-appt-card-body">
                                    <h3 className="mp-appt-card-title">Schedule a 1-on-1 Client Meeting</h3>
                                    <p className="mp-appt-card-desc">
                                        Book a direct video meeting with our production team. Pick a date, choose a time slot, and tell us about your project vision.
                                    </p>

                                    <div className="mp-appt-highlights-grid">
                                        <div className="mp-appt-feature-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Real-Time Calendar Availability</span>
                                        </div>
                                        <div className="mp-appt-feature-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Google Meet Video Link</span>
                                        </div>
                                        <div className="mp-appt-feature-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Tailored Creative Scope & Pricing</span>
                                        </div>
                                    </div>

                                    {selectedMeetingDate && selectedMeetingTime && (
                                        <div className="mp-appt-selected-bar">
                                            <span className="mp-appt-selected-icon">✓</span>
                                            <span>Reserved Slot: <strong>{selectedMeetingDate}</strong> at <strong>{selectedMeetingTime}</strong></span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="mp-appt-primary-btn"
                                    onClick={() => {
                                        setStatus({ state: 'idle', message: '' });
                                        setActiveBookingSection('details');
                                        setIsBookingModalOpen(true);
                                    }}
                                >
                                    <span>{selectedMeetingDate && selectedMeetingTime ? 'Change Slot / Continue' : 'Book a Meeting'}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </button>
                            </div>
                    </div>
                </div>
            </div>

            {/* Appointment Booking Form Modal Popup */}
            {isBookingModalOpen && (
                <div
                    className="mp-booking-modal-backdrop"
                    onClick={() => setIsBookingModalOpen(false)}
                >
                    <div
                        className="mp-booking-modal-card"
                        role="dialog"
                        aria-modal="true"
                        ref={modalCardRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="mp-popup-close-btn"
                            onClick={() => setIsBookingModalOpen(false)}
                            aria-label="Close modal"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="mp-booking-modal-header">
                            <div className="mp-booking-modal-header-top">
                                <h3 className="mp-booking-modal-title">Schedule Client Meeting</h3>
                                <div className="mp-header-swapping-menu" role="tablist" aria-label="Booking steps">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeBookingSection === 'details'}
                                        className={`mp-swap-tab-btn ${activeBookingSection === 'details' ? 'active' : ''}`}
                                        onClick={() => handleSectionChange('details')}
                                    >
                                        <span className="mp-swap-tab-icon">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </span>
                                        <span className="mp-swap-tab-label">Client &amp; Project Details</span>
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeBookingSection === 'datetime'}
                                        className={`mp-swap-tab-btn ${activeBookingSection === 'datetime' ? 'active' : ''}`}
                                        onClick={() => handleSectionChange('datetime')}
                                    >
                                        <span className="mp-swap-tab-icon">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </span>
                                        <span className="mp-swap-tab-label">Meeting Details</span>
                                        {selectedMeetingDate && selectedMeetingTime && (
                                            <span className="mp-swap-tab-dot" title="Slot selected" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <p className="mp-booking-modal-subtext">
                                {activeBookingSection === 'details'
                                    ? 'Step 1: Enter your contact & project info to prepare your scheduled meeting.'
                                    : 'Step 2: Pick an available date, time slot, and your preferred online meeting platform.'}
                            </p>
                        </div>

                        <div className="mp-booking-modal-swap-body mp-modal-slider-viewport">
                            <form onSubmit={handleSubmit} className="mp-contact-form" noValidate>
                                <div className={`mp-modal-slider-track ${activeBookingSection === 'datetime' ? 'slide-right' : 'slide-left'}`}>
                                    {/* Slide 1 (LEFT): Client & Project Details */}
                                    <div
                                        className="mp-modal-slide mp-swap-view mp-swap-view-details"
                                        inert={activeBookingSection !== 'details' ? '' : undefined}
                                    >
                                        <div className="mp-cal-section-header">
                                            <span className="mp-cal-section-title">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                Step 1: Client &amp; Project Details
                                            </span>
                                            <span className={`mp-cal-section-badge ${formData.firstName && formData.email && formData.phone ? 'active' : ''}`}>
                                                {formData.firstName && formData.email && formData.phone ? 'Details Added ✓' : 'Required'}
                                            </span>
                                        </div>

                                        {selectedMeetingDate && selectedMeetingTime && (
                                            <div
                                                className="mp-details-slot-bar"
                                                onClick={() => handleSectionChange('datetime')}
                                                title="Click to view/change meeting slot"
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="mp-details-slot-left">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    <span>Meeting Reserved: <strong>{selectedMeetingDate}</strong> at <strong>{selectedMeetingTime}</strong> &bull; via <strong>{formData.meetingMethod || 'Google Meet'}</strong></span>
                                                </div>
                                                <span className="mp-details-slot-change">Change Meeting Details ↗</span>
                                            </div>
                                        )}

                                        <div className="mp-booking-divider">
                                            <span>Client Contact &amp; Project Information</span>
                                        </div>

                                        {/* Row 1: First name & Last name */}
                                        <div className="mp-form-row two-cols">
                                            <div className="mp-form-group">
                                                <label htmlFor="modal_firstName" className="mp-form-label">
                                                    First name*
                                                </label>
                                                <input
                                                    type="text"
                                                    id="modal_firstName"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder="John"
                                                    required
                                                    className="mp-form-input"
                                                />
                                            </div>

                                            <div className="mp-form-group">
                                                <label htmlFor="modal_lastName" className="mp-form-label">
                                                    Last name*
                                                </label>
                                                <input
                                                    type="text"
                                                    id="modal_lastName"
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
                                            <label htmlFor="modal_email" className="mp-form-label">
                                                Work email*
                                            </label>
                                            <input
                                                type="email"
                                                id="modal_email"
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
                                            <label htmlFor="modal_phone" className="mp-form-label">
                                                Phone number*
                                            </label>
                                            <div className="mp-phone-input-wrap">
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
                                                                    key={`modal-${c.country}-${c.code}`}
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

                                                <input
                                                    type="tel"
                                                    id="modal_phone"
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
                                            <label htmlFor="modal_serviceTypeBtn" className="mp-form-label">
                                                Service Type*
                                            </label>
                                            <div className="mp-service-select-wrap" ref={serviceDropdownRef}>
                                                <button
                                                    type="button"
                                                    id="modal_serviceTypeBtn"
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
                                                                    key={`modal-${svc._id || svc.name}`}
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

                                        {/* Row 5: Meeting Agenda / Notes */}
                                        <div className="mp-form-group">
                                            <label htmlFor="modal_message" className="mp-form-label">
                                                Meeting Agenda / Notes
                                            </label>
                                            <textarea
                                                id="modal_message"
                                                name="message"
                                                rows={3}
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Briefly describe your video editing requirements, footage details, or questions for our consultation..."
                                                className="mp-form-textarea"
                                            />
                                        </div>

                                        <div className="mp-swap-action-footer">
                                            <button
                                                type="button"
                                                className="mp-swap-next-btn"
                                                onClick={() => handleSectionChange('datetime')}
                                            >
                                                <span>Continue to Meeting Details</span>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slide 2 (RIGHT): Meeting Details */}
                                    <div
                                        className="mp-modal-slide mp-swap-view mp-swap-view-calendar"
                                        inert={activeBookingSection !== 'datetime' ? '' : undefined}
                                    >
                                        <div className="mp-cal-section-header">
                                            <span className="mp-cal-section-title">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                Step 2: Meeting Details
                                            </span>
                                            <span className={`mp-cal-section-badge ${selectedMeetingDate && selectedMeetingTime ? 'active' : ''}`}>
                                                {selectedMeetingDate && selectedMeetingTime ? 'Slot Picked ✓' : 'Required'}
                                            </span>
                                        </div>

                                        <div className="mp-modal-cal-wrap">
                                            <MpCalender
                                                selectedDate={selectedMeetingDate}
                                                selectedTime={selectedMeetingTime}
                                                onSelectDateTime={({ date, timeSlot }) => {
                                                    setSelectedMeetingDate(date);
                                                    setSelectedMeetingTime(timeSlot);
                                                    if (status.state === 'error') {
                                                        setStatus({ state: 'idle', message: '' });
                                                    }
                                                }}
                                                offDays={contactSettings.offDays}
                                            />
                                        </div>

                                        {selectedMeetingDate && selectedMeetingTime && (
                                            <div className="mp-modal-slot-chip-bar">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                <span>Meeting Reserved For: <strong>{selectedMeetingDate}</strong> at <strong>{selectedMeetingTime}</strong></span>
                                            </div>
                                        )}

                                        {/* Online Meeting Platform Selection */}
                                        <div className="mp-meeting-method-section">
                                            <div className="mp-field-label-row">
                                                <label className="mp-form-label">
                                                    Online Meeting Method*
                                                </label>
                                            </div>
                                            <p className="mp-field-helper-hint">
                                                All client meetings are held online. Choose your preferred video platform:
                                            </p>

                                            <div className="mp-meeting-methods-grid" role="radiogroup" aria-label="Online Meeting Method">
                                                {ONLINE_MEETING_METHODS.map((m) => {
                                                    const isSelected = (formData.meetingMethod || 'Google Meet') === m.name;
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isSelected}
                                                            className={`mp-meeting-method-card method-${m.id} ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setFormData((prev) => ({ ...prev, meetingMethod: m.name }));
                                                                if (status.state === 'error') {
                                                                    setStatus({ state: 'idle', message: '' });
                                                                }
                                                            }}
                                                        >
                                                            <div className="mp-method-top-bar">
                                                                <span className="mp-method-icon-box">{m.icon}</span>
                                                                <div className="mp-method-radio-ind">
                                                                    <span className="mp-method-radio-dot" />
                                                                </div>
                                                            </div>
                                                            <div className="mp-method-body">
                                                                <span className="mp-method-name">{m.name}</span>
                                                                <span className="mp-method-desc">{m.desc}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {status.message && (
                                            <div className={`mp-form-status-alert ${status.state}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                                <span>{status.message}</span>
                                            </div>
                                        )}

                                        <div className="mp-booking-modal-actions">
                                            <button
                                                type="button"
                                                className="mp-booking-modal-back-btn"
                                                onClick={() => handleSectionChange('details')}
                                            >
                                                ← Back to Client Details
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={status.state === 'loading'}
                                                className="mp-contact-submit-btn modal-submit"
                                            >
                                                {status.state === 'loading' ? (
                                                    <span className="mp-btn-loading-content">
                                                        <span className="mp-btn-spinner" />
                                                        <span>Scheduling...</span>
                                                    </span>
                                                ) : (
                                                    <span>Confirm & Schedule Meeting</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
        </div>
    </div>
)}

            {/* Success Popup Modal */}
            {showSuccessPopup && (
                <div
                    className="mp-contact-popup-backdrop"
                    onClick={() => {
                        setShowSuccessPopup(false);
                        setBookedAppointmentInfo(null);
                    }}
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
                            onClick={() => {
                                setShowSuccessPopup(false);
                                setBookedAppointmentInfo(null);
                            }}
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

                        {bookedAppointmentInfo ? (
                            <>
                                <h3 className="mp-popup-title">Meeting Scheduled!</h3>
                                <div className="mp-popup-appt-box">
                                    <div className="mp-popup-appt-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    <div className="mp-popup-appt-details">
                                        <span className="mp-popup-appt-label">Scheduled Online Consultation</span>
                                        <span className="mp-popup-appt-val">
                                            {bookedAppointmentInfo.date} &bull; {bookedAppointmentInfo.time}
                                        </span>
                                        <span className="mp-popup-appt-method">
                                            Platform: <strong>{bookedAppointmentInfo.method || 'Google Meet'} (Online)</strong>
                                        </span>
                                    </div>
                                </div>
                                <p className="mp-popup-message">
                                    Thank you {bookedAppointmentInfo.name}! Your consultation has been locked in. We will reach out to you soon with details.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="mp-popup-title">Message Sent!</h3>
                                <p className="mp-popup-message">
                                    your message sent  we will contact you soon
                                </p>
                            </>
                        )}

                        <button
                            type="button"
                            className="mp-popup-confirm-btn"
                            onClick={() => {
                                setShowSuccessPopup(false);
                                setBookedAppointmentInfo(null);
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
