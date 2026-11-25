import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './contactEdit.css';
import { detectPlatform, PLATFORM_META, renderSocialIcon } from '../../../utils/socialIcons';
import ConfirmMessage from '../../../components/confirmMessage/confirmMessage';
import MpCalenderAdmin from './mpCalenderAdmin/mpCalenderAdmin';

const DEFAULT_CONTACT_INFO = {
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

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const WORKING_DAYS_PRESETS = [
  'Monday – Saturday',
  'Monday – Friday',
  'Monday – Sunday',
  'Tuesday – Saturday',
  'Tuesday – Sunday',
  'Wednesday – Sunday',
  'Thursday – Sunday',
  'Friday – Sunday',
  'Saturday – Sunday',
];

const OFF_DAYS_PRESETS = [
  'Sunday',
  'Saturday – Sunday',
  'Saturday & Sunday',
  'Friday – Saturday',
  'Friday',
  'Saturday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'None (Open 7 Days)',
  'Public Holidays Only',
  'Sunday & Public Holidays',
];

const TIME_SLOTS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
  '12:00 AM',
];

const HOURS_PRESETS = [
  '10:00 AM – 10:00 PM',
  '09:00 AM – 06:00 PM',
  '09:00 AM – 05:00 PM',
  '09:00 AM – 08:00 PM',
  '09:00 AM – 10:00 PM',
  '08:00 AM – 08:00 PM',
  '08:00 AM – 05:00 PM',
  '10:00 AM – 08:00 PM',
  '10:00 AM – 06:00 PM',
  '11:00 AM – 11:00 PM',
  '12:00 PM – 10:00 PM',
  '24 Hours (Open 24/7)',
];

const QUICK_SOCIAL_PRESETS = [
  { key: 'tiktok', label: '+ TikTok', title: 'Add TikTok Link', size: 14 },
  { key: 'twitter', label: '+ X (Twitter)', title: 'Add X (Twitter) Link', size: 13 },
  { key: 'discord', label: '+ Discord', title: 'Add Discord Link', size: 14 },
  { key: 'whatsapp', label: '+ WhatsApp', title: 'Add WhatsApp Link', size: 14 },
  { key: 'threads', label: '+ Threads', title: 'Add Threads Link', size: 14 },
  { key: 'telegram', label: '+ Telegram', title: 'Add Telegram Link', size: 14 },
];

function parseDaysRange(val) {
  const parts = (val || '').split(/\s*[–-]\s*/);
  const from = DAYS_OF_WEEK.includes(parts[0]) ? parts[0] : 'Monday';
  const to = DAYS_OF_WEEK.includes(parts[1]) ? parts[1] : 'Saturday';
  return { from, to };
}

function getIsOpenNow(settings) {
  if (settings?.isForceClosed) return false;

  try {
    const now = new Date();
    const slDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
    const slDate = new Date(slDateStr);
    const day = slDate.getDay();
    const totalMinutes = slDate.getHours() * 60 + slDate.getMinutes();

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

    return day >= 1 && day <= 6 && totalMinutes >= 600 && totalMinutes < 1320;
  } catch {
    return true;
  }
}

export default function ContactEdit({
  activeSection = 'all',
  onSelectSection,
}) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [info, setInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('mp_contact_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONTACT_INFO,
          ...parsed,
          customSocials: Array.isArray(parsed.customSocials) ? parsed.customSocials : [],
        };
      }
      return DEFAULT_CONTACT_INFO;
    } catch {
      return DEFAULT_CONTACT_INFO;
    }
  });

  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(info));
  const [alert, setAlert] = useState(null);

  // Confirm modal state (replaces native window.confirm)
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    highlightItem: null,
    isLoading: false,
    onConfirm: null,
  });

  // Scroll & Timer Refs
  const scrollBodyRef = useRef(null);
  const alertTimerRef = useRef(null);
  const serviceFeedbackTimerRef = useRef(null);
  const simTimerRef = useRef(null);

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
    message: '',
  });
  const [simSubmitted, setSimSubmitted] = useState(false);
  const simCountryRef = useRef(null);
  const simServiceRef = useRef(null);

  // Working Days / Off Days custom toggle flags
  const [isWorkingDaysCustomText, setIsWorkingDaysCustomText] = useState(() => {
    if (!info.workingDays) return false;
    const parts = info.workingDays.split(/\s*[–-]\s*/);
    return !(parts.length === 2 && DAYS_OF_WEEK.includes(parts[0]) && DAYS_OF_WEEK.includes(parts[1]));
  });
  const [isCustomOffDays, setIsCustomOffDays] = useState(() => !OFF_DAYS_PRESETS.includes(info.offDays));

  // Dropdown Service Options State (MongoDB)
  const [serviceOptions, setServiceOptions] = useState([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [newServiceName, setNewServiceName] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingServiceName, setEditingServiceName] = useState('');
  const [isUpdatingService, setIsUpdatingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [serviceFeedback, setServiceFeedback] = useState(null);

  // Derived values (no redundant state or double-render effects)
  const { from: workingDaysFrom, to: workingDaysTo } = useMemo(
    () => parseDaysRange(info.workingDays),
    [info.workingDays]
  );

  const { currentStartTime, currentEndTime } = useMemo(() => {
    const parts = (info.workingHours || '10:00 AM – 10:00 PM').split(/\s*[–-]\s*/);
    return {
      currentStartTime: parts[0] || '10:00 AM',
      currentEndTime: parts[1] || '10:00 PM',
    };
  }, [info.workingHours]);

  const hasChanges = useMemo(() => JSON.stringify(info) !== savedSnapshot, [info, savedSnapshot]);
  const simIsOpen = useMemo(
    () => getIsOpenNow(info),
    [info.isForceClosed, info.workingHours, info.offDays]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (serviceFeedbackTimerRef.current) clearTimeout(serviceFeedbackTimerRef.current);
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, []);

  const showAlert = useCallback((type, message, duration = 4000) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert({ type, message });
    alertTimerRef.current = setTimeout(() => setAlert(null), duration);
  }, []);

  const showServiceFeedback = useCallback((type, message, duration = 3500) => {
    if (serviceFeedbackTimerRef.current) clearTimeout(serviceFeedbackTimerRef.current);
    setServiceFeedback({ type, message });
    serviceFeedbackTimerRef.current = setTimeout(() => setServiceFeedback(null), duration);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  // Default simulation service to first MongoDB option if available
  useEffect(() => {
    if (serviceOptions.length > 0 && !simService) {
      setSimService(serviceOptions[0].name);
    }
  }, [serviceOptions, simService]);

  // Close simulation dropdowns on outside click
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

  // Scroll internal body to top when switching sections or view tabs
  useEffect(() => {
    if (activeSection && activeSection !== 'all') {
      setActiveTab('editor');
    }
    scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Fetch service dropdown options from MongoDB backend
  const fetchServiceOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchServiceOptions();
  }, [fetchServiceOptions]);

  // Field Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFromDayChange = (e) => {
    const newFrom = e.target.value;
    setInfo((prev) => ({ ...prev, workingDays: `${newFrom} – ${workingDaysTo}` }));
    setIsWorkingDaysCustomText(false);
  };

  const handleToDayChange = (e) => {
    const newTo = e.target.value;
    setInfo((prev) => ({ ...prev, workingDays: `${workingDaysFrom} – ${newTo}` }));
    setIsWorkingDaysCustomText(false);
  };

  const handleWorkingDaysPresetChange = (e) => {
    const preset = e.target.value;
    if (preset) {
      setInfo((prev) => ({ ...prev, workingDays: preset }));
      setIsWorkingDaysCustomText(false);
    }
  };

  const handleStartTimeChange = (e) => {
    const newStart = e.target.value;
    setInfo((prev) => ({ ...prev, workingHours: `${newStart} – ${currentEndTime}` }));
  };

  const handleEndTimeChange = (e) => {
    const newEnd = e.target.value;
    setInfo((prev) => ({ ...prev, workingHours: `${currentStartTime} – ${newEnd}` }));
  };

  const handleHoursPresetChange = (e) => {
    const preset = e.target.value;
    if (preset) {
      setInfo((prev) => ({ ...prev, workingHours: preset }));
    }
  };

  const handleOffDaysSelect = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomOffDays(true);
    } else {
      setIsCustomOffDays(false);
      setInfo((prev) => ({ ...prev, offDays: val }));
    }
  };

  const handleToggleForceClosed = (e) => {
    const isClosed = e.target.checked;
    setInfo((prev) => ({ ...prev, isForceClosed: isClosed }));
  };

  // Service Option CRUD Handlers
  const handleAddService = async (e) => {
    e?.preventDefault?.();
    const trimmed = newServiceName.trim();
    if (!trimmed) return;

    setIsAddingService(true);
    try {
      const res = await fetch('/api/contact/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add service option.');
      }
      setServiceOptions((prev) => [...prev, data.data]);
      setNewServiceName('');
      showServiceFeedback('success', `Added "${data.data.name}" to dropdown!`);
      window.dispatchEvent(new Event('mp_services_updated'));
    } catch (err) {
      showServiceFeedback('error', err.message, 4000);
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
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update service option.');
      }
      setServiceOptions((prev) => prev.map((s) => (s._id === id ? data.data : s)));
      setEditingServiceId(null);
      setEditingServiceName('');
      showServiceFeedback('success', `Option updated to "${data.data.name}"!`);
      window.dispatchEvent(new Event('mp_services_updated'));
    } catch (err) {
      showServiceFeedback('error', err.message, 4000);
    } finally {
      setIsUpdatingService(false);
    }
  };

  const requestDeleteService = (id, name) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Service Option?',
      message: 'Visitors will no longer see this option in the Contact form dropdown.',
      confirmText: 'Delete Option',
      variant: 'danger',
      highlightItem: { name, subtitle: 'Contact Form Service Dropdown' },
      isLoading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isLoading: true }));
        setDeletingServiceId(id);
        try {
          const res = await fetch(`/api/contact/services/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to delete service option.');
          }
          setServiceOptions((prev) => prev.filter((s) => s._id !== id));
          showServiceFeedback('success', `Deleted "${name}" from dropdown options!`);
          window.dispatchEvent(new Event('mp_services_updated'));
          closeConfirm();
        } catch (err) {
          showServiceFeedback('error', err.message, 4000);
          closeConfirm();
        } finally {
          setDeletingServiceId(null);
        }
      },
    });
  };

  const requestResetServices = () => {
    setConfirmState({
      isOpen: true,
      title: 'Restore Default Options?',
      message: 'This resets the service dropdown back to the 3 default items: Edit Video, Video Production, and Reel.',
      confirmText: 'Restore Defaults',
      variant: 'warning',
      highlightItem: null,
      isLoading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch('/api/contact/services/reset', { method: 'POST' });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Reset failed');
          setServiceOptions(data.data);
          showServiceFeedback('success', 'Dropdown options restored to defaults!');
          window.dispatchEvent(new Event('mp_services_updated'));
        } catch (err) {
          showServiceFeedback('error', err.message, 4000);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // Custom Social Handlers
  const handleAddCustomSocial = (presetPlatform = '') => {
    const meta = presetPlatform ? PLATFORM_META[presetPlatform] : null;
    const newLink = {
      id: `social_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: meta ? meta.name : '',
      url: '',
    };
    setInfo((prev) => ({
      ...prev,
      customSocials: [...(prev.customSocials || []), newLink],
    }));
  };

  const handleUpdateCustomSocial = (id, field, value) => {
    setInfo((prev) => ({
      ...prev,
      customSocials: (prev.customSocials || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleDeleteCustomSocial = (id) => {
    setInfo((prev) => ({
      ...prev,
      customSocials: (prev.customSocials || []).filter((item) => item.id !== id),
    }));
  };

  const requestResetContact = () => {
    setConfirmState({
      isOpen: true,
      title: 'Reset to Default Template?',
      message: 'This will restore default contact details, working hours, and social profiles in the editor. Click Save & Apply afterward to publish.',
      confirmText: 'Reset Template',
      variant: 'warning',
      highlightItem: null,
      isLoading: false,
      onConfirm: () => {
        setInfo(DEFAULT_CONTACT_INFO);
        setIsWorkingDaysCustomText(false);
        setIsCustomOffDays(false);
        closeConfirm();
      },
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const serialized = JSON.stringify(info);
      localStorage.setItem('mp_contact_settings', serialized);
      setSavedSnapshot(serialized);
      showAlert('success', 'Contact details saved and applied to website!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Save failed:', err);
      showAlert('error', 'Failed to save changes. Please try again.');
    }
  };

  const handleSimSubmit = (e) => {
    e.preventDefault();
    setSimSubmitted(true);
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    simTimerRef.current = setTimeout(() => setSimSubmitted(false), 4000);
  };

  const isSingleSection = activeSection && activeSection !== 'all';
  const showChannels = !isSingleSection || activeSection === 'channels';
  const showHours = !isSingleSection || activeSection === 'hours';
  const showSocials = !isSingleSection || activeSection === 'socials';
  const showServices = !isSingleSection || activeSection === 'services';
  const showFooterBar = activeTab === 'editor' && activeSection !== 'calendar' && (showChannels || showHours || showSocials);

  return (
    <div className="mp-contact-edit-root">
      {/* Fixed Sub-Toolbar (never overlaps section content) */}
      <div className="mp-contact-top-bar">
        {activeTab === 'editor' ? (
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
              title="Edit Contact Channels"
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
              title="Edit Working Hours & Availability"
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
              title="Edit Social Media Profiles"
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
              title="Manage Service Dropdown Options"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Services ({serviceOptions.length})</span>
            </button>
            <button
              type="button"
              className={`mp-contact-pill-btn ${activeSection === 'calendar' ? 'active' : ''}`}
              onClick={() => onSelectSection?.('calendar')}
              title="Manage Client Meeting Appointments Calendar"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Appointments</span>
            </button>
          </div>
        ) : (
          <div className="mp-sim-topbar-note">
            <span className="mp-sim-live-dot" />
            <span>Previewing live visitor Contact page with your current edits</span>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
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
        activeSection === 'calendar' ? (
          <div ref={scrollBodyRef} className="mp-contact-scroll-body">
            <MpCalenderAdmin />
          </div>
        ) : (
          <form onSubmit={handleSave} className="mp-contact-form-shell">
            <div ref={scrollBodyRef} className="mp-contact-scroll-body">
              <div className="mp-contact-form-layout">
                {/* Section 1: Direct Contact Information */}
                {showChannels && (
                  <div id="contact-section-channels" className="mp-contact-card">
                    <div className="mp-card-header">
                      <div className="mp-card-icon-wrap blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div className="mp-card-header-text">
                        <h3 className="mp-card-title">Contact Channels</h3>
                        <p className="mp-card-subtitle">Primary email, phone number, and office location displayed to visitors.</p>
                      </div>
                    </div>

                    <div className="mp-card-body">
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

                      <div className="mp-input-group">
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
                  <div id="contact-section-hours" className="mp-contact-card">
                    <div className="mp-card-header">
                      <div className="mp-card-icon-wrap emerald">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="mp-card-header-text">
                        <h3 className="mp-card-title">Working Hours &amp; Availability</h3>
                        <p className="mp-card-subtitle">Displayed operating schedule and live availability status.</p>
                      </div>
                    </div>

                    <div className="mp-card-body">
                      {/* Manual Closed Now Override Card (clean 2-row flex layout) */}
                      <div className={`mp-status-toggle-card ${info.isForceClosed ? 'is-closed' : 'is-normal'}`}>
                        <div className="mp-status-toggle-main">
                          <div className="mp-status-toggle-left">
                            <div className="mp-status-badge-row">
                              <span className={`mp-status-indicator-badge ${info.isForceClosed ? 'closed' : (simIsOpen ? 'open' : 'closed')}`}>
                                <span className="mp-status-indicator-dot" />
                                {info.isForceClosed ? 'Closed Now' : (simIsOpen ? 'Open Now' : 'Closed Now (After Hours)')}
                              </span>
                              <span className={`mp-status-mode-pill ${info.isForceClosed ? 'override' : 'auto'}`}>
                                {info.isForceClosed ? '⚠️ Manual Closed Override Active' : '● Auto Schedule'}
                              </span>
                            </div>
                            <div className="mp-status-toggle-content">
                              <h4 className="mp-status-toggle-heading">Say &ldquo;Closed Now&rdquo; Status Override</h4>
                              <p className="mp-status-toggle-explanation">
                                Toggle this switch to immediately display <strong>&ldquo;Closed Now&rdquo;</strong> on the website for public holidays, maintenance, breaks, or unexpected closures, overriding the schedule.
                              </p>
                            </div>
                          </div>

                          <div className="mp-status-toggle-right">
                            <label className="mp-switch-wrap" htmlFor="isForceClosedToggle">
                              <span className={`mp-switch-text-label ${info.isForceClosed ? 'active-closed' : ''}`}>
                                {info.isForceClosed ? 'CLOSED NOW' : 'NORMAL SCHEDULE'}
                              </span>
                              <span className="mp-switch-container">
                                <input
                                  type="checkbox"
                                  id="isForceClosedToggle"
                                  name="isForceClosed"
                                  checked={Boolean(info.isForceClosed)}
                                  onChange={handleToggleForceClosed}
                                />
                                <span className="mp-switch-slider" />
                              </span>
                            </label>
                          </div>
                        </div>

                        {info.isForceClosed && (
                          <div className="mp-status-notice-row">
                            <label className="mp-status-notice-label" htmlFor="closedNoticeInput">
                              Optional Closure Notice or Date Range (shown to visitors):
                            </label>
                            <input
                              type="text"
                              id="closedNoticeInput"
                              name="closedNotice"
                              value={info.closedNotice || ''}
                              onChange={handleChange}
                              placeholder="e.g. Closed until Monday Oct 15, or Closed for Annual Maintenance"
                              className="mp-status-notice-input"
                            />
                          </div>
                        )}
                      </div>

                      {/* Working Days & Operating Hours Selectors */}
                      <div className="mp-grid-2cols">
                        {/* Active Working Days */}
                        <div className="mp-input-group">
                          <div className="mp-label-with-current">
                            <label htmlFor="workingDaysFrom">Active Working Days</label>
                            <span className="mp-current-preview-pill">{info.workingDays}</span>
                          </div>

                          {!isWorkingDaysCustomText ? (
                            <div className="mp-time-range-picker">
                              <div className="mp-time-col">
                                <span className="mp-time-sublabel">From Day</span>
                                <div className="mp-select-wrapper">
                                  <select
                                    id="workingDaysFrom"
                                    value={workingDaysFrom}
                                    onChange={handleFromDayChange}
                                    className="mp-custom-select"
                                  >
                                    {DAYS_OF_WEEK.map((d) => (
                                      <option key={`from-${d}`} value={d}>{d}</option>
                                    ))}
                                  </select>
                                  <div className="mp-select-chevron-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              <div className="mp-time-separator-badge">
                                <span>TO</span>
                              </div>

                              <div className="mp-time-col">
                                <span className="mp-time-sublabel">To Day</span>
                                <div className="mp-select-wrapper">
                                  <select
                                    id="workingDaysTo"
                                    value={workingDaysTo}
                                    onChange={handleToDayChange}
                                    className="mp-custom-select"
                                  >
                                    {DAYS_OF_WEEK.map((d) => (
                                      <option key={`to-${d}`} value={d}>{d}</option>
                                    ))}
                                  </select>
                                  <div className="mp-select-chevron-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mp-custom-date-mode-wrap">
                              <input
                                type="text"
                                id="workingDays"
                                name="workingDays"
                                value={info.workingDays}
                                onChange={handleChange}
                                placeholder="e.g. Oct 10 – Oct 25, or Mon, Wed, Fri"
                                className="mp-custom-text-input"
                                autoFocus
                              />
                            </div>
                          )}

                          <div className="mp-quick-presets-row">
                            <span className="mp-quick-presets-label">⚡ Presets:</span>
                            <div className="mp-select-wrapper compact">
                              <select
                                value={WORKING_DAYS_PRESETS.includes(info.workingDays) ? info.workingDays : ''}
                                onChange={handleWorkingDaysPresetChange}
                                className="mp-custom-select compact"
                              >
                                <option value="">Choose preset schedule...</option>
                                {WORKING_DAYS_PRESETS.map((p) => (
                                  <option key={`wd-preset-${p}`} value={p}>{p}</option>
                                ))}
                              </select>
                              <div className="mp-select-chevron-icon compact">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={`mp-btn-mode-toggle ${isWorkingDaysCustomText ? 'active' : ''}`}
                              onClick={() => setIsWorkingDaysCustomText((prev) => !prev)}
                              title={isWorkingDaysCustomText ? 'Switch to Day Dropdowns' : 'Switch to Custom Date / Text Range'}
                            >
                              {isWorkingDaysCustomText ? 'Day Dropdowns' : 'Custom Text'}
                            </button>
                          </div>
                        </div>

                        {/* Operating Hours Range */}
                        <div className="mp-input-group">
                          <div className="mp-label-with-current">
                            <label htmlFor="workingHoursStart">Operating Hours Range</label>
                            <span className="mp-current-preview-pill">{info.workingHours}</span>
                          </div>

                          <div className="mp-time-range-picker">
                            <div className="mp-time-col">
                              <span className="mp-time-sublabel">Opening Time</span>
                              <div className="mp-select-wrapper">
                                <select
                                  id="workingHoursStart"
                                  value={currentStartTime}
                                  onChange={handleStartTimeChange}
                                  className="mp-custom-select"
                                >
                                  {!TIME_SLOTS.includes(currentStartTime) && (
                                    <option value={currentStartTime}>{currentStartTime}</option>
                                  )}
                                  {TIME_SLOTS.map((t) => (
                                    <option key={`start-${t}`} value={t}>{t}</option>
                                  ))}
                                </select>
                                <div className="mp-select-chevron-icon">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="mp-time-separator-badge">
                              <span>TO</span>
                            </div>

                            <div className="mp-time-col">
                              <span className="mp-time-sublabel">Closing Time</span>
                              <div className="mp-select-wrapper">
                                <select
                                  id="workingHoursEnd"
                                  value={currentEndTime}
                                  onChange={handleEndTimeChange}
                                  className="mp-custom-select"
                                >
                                  {!TIME_SLOTS.includes(currentEndTime) && (
                                    <option value={currentEndTime}>{currentEndTime}</option>
                                  )}
                                  {TIME_SLOTS.map((t) => (
                                    <option key={`end-${t}`} value={t}>{t}</option>
                                  ))}
                                </select>
                                <div className="mp-select-chevron-icon">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mp-quick-presets-row">
                            <span className="mp-quick-presets-label">⚡ Presets:</span>
                            <div className="mp-select-wrapper compact">
                              <select
                                value={HOURS_PRESETS.includes(info.workingHours) ? info.workingHours : ''}
                                onChange={handleHoursPresetChange}
                                className="mp-custom-select compact"
                              >
                                <option value="">Select standard schedule preset...</option>
                                {HOURS_PRESETS.map((p) => (
                                  <option key={`preset-${p}`} value={p}>{p}</option>
                                ))}
                              </select>
                              <div className="mp-select-chevron-icon compact">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Closed / Off Days Select */}
                      <div className="mp-input-group">
                        <div className="mp-label-with-current">
                          <label htmlFor="offDaysSelect">Closed / Off Days</label>
                          <span className="mp-current-preview-pill">{info.offDays}</span>
                        </div>
                        <div className="mp-select-wrapper">
                          <select
                            id="offDaysSelect"
                            value={isCustomOffDays ? 'custom' : (OFF_DAYS_PRESETS.includes(info.offDays) ? info.offDays : 'custom')}
                            onChange={handleOffDaysSelect}
                            className="mp-custom-select"
                          >
                            <option value="Sunday">Sunday</option>
                            <option value="Saturday – Sunday">Saturday – Sunday (Full Weekend)</option>
                            <option value="Saturday & Sunday">Saturday &amp; Sunday</option>
                            <option value="Friday – Saturday">Friday – Saturday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="None (Open 7 Days)">None (Open 7 Days)</option>
                            <option value="Public Holidays Only">Public Holidays Only</option>
                            <option value="Sunday & Public Holidays">Sunday &amp; Public Holidays</option>
                            <option value="custom">Custom Date Range / Specific Days...</option>
                          </select>
                          <div className="mp-select-chevron-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>

                        {(isCustomOffDays || !OFF_DAYS_PRESETS.includes(info.offDays)) && (
                          <div className="mp-custom-offdays-box">
                            <label className="mp-custom-sublabel" htmlFor="offDaysInput">
                              Custom Closed Days or Date Range:
                            </label>
                            <input
                              type="text"
                              id="offDaysInput"
                              name="offDays"
                              value={info.offDays}
                              onChange={handleChange}
                              placeholder="e.g. Sunday & Poya Days, or Dec 25 – Jan 02"
                              className="mp-custom-text-input"
                              autoFocus
                            />
                            <span className="mp-custom-tip">
                              Custom date ranges or specific days entered here display directly to visitors.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Social Media Links */}
                {showSocials && (
                  <div id="contact-section-socials" className="mp-contact-card">
                    <div className="mp-card-header">
                      <div className="mp-card-icon-wrap violet">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      </div>
                      <div className="mp-card-header-text">
                        <h3 className="mp-card-title">Social Media Profiles</h3>
                        <p className="mp-card-subtitle">Links to your official YouTube, Instagram, Facebook, LinkedIn, and additional channels.</p>
                      </div>
                    </div>

                    <div className="mp-card-body">
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

                      {/* Additional Custom Social Links */}
                      <div className="mp-custom-socials-section">
                        <div className="mp-custom-socials-header">
                          <div>
                            <div className="mp-custom-socials-title-row">
                              <h4 className="mp-custom-socials-title">Additional Social Links &amp; Channels</h4>
                              <span className="mp-auto-detect-pill">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Auto Icon Detection
                              </span>
                            </div>
                            <p className="mp-custom-socials-subtitle">
                              Add TikTok, X, Discord, WhatsApp, Threads, Telegram, or any channel. Official icons load automatically from the name or URL.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="mp-add-social-btn"
                            onClick={() => handleAddCustomSocial()}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add New Link
                          </button>
                        </div>

                        <div className="mp-quick-social-chips">
                          <span className="mp-quick-chips-label">Quick Add:</span>
                          {QUICK_SOCIAL_PRESETS.map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              className={`mp-quick-chip-btn ${preset.key}`}
                              onClick={() => handleAddCustomSocial(preset.key)}
                              title={preset.title}
                            >
                              <span className="mp-chip-icon">{renderSocialIcon(preset.key, preset.size)}</span>
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        {(!info.customSocials || info.customSocials.length === 0) ? (
                          <div className="mp-custom-socials-empty">
                            <div className="mp-empty-icon-wrap">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                            </div>
                            <div className="mp-empty-text-wrap">
                              <p className="mp-empty-title">No additional links added yet</p>
                              <p className="mp-empty-desc">Click &ldquo;Add New Link&rdquo; or pick a quick preset above to add extra profiles.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mp-custom-social-list">
                            {info.customSocials.map((item, idx) => {
                              const detectedPlatform = detectPlatform(item.title, item.url);
                              const meta = PLATFORM_META[detectedPlatform] || PLATFORM_META.generic;
                              return (
                                <div key={item.id || idx} className="mp-custom-social-item">
                                  <div className={`mp-custom-icon-preview ${meta.cssClass}`} title={`Detected: ${meta.name}`}>
                                    <div className="mp-preview-icon-box">
                                      {renderSocialIcon(detectedPlatform, 20)}
                                    </div>
                                    <span className="mp-preview-platform-name">{meta.name}</span>
                                  </div>

                                  <div className="mp-custom-social-field title-field">
                                    <label>Title / Platform Name</label>
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) => handleUpdateCustomSocial(item.id, 'title', e.target.value)}
                                      placeholder="e.g. TikTok, Discord..."
                                    />
                                  </div>

                                  <div className="mp-custom-social-field url-field">
                                    <label>Profile / Channel URL</label>
                                    <input
                                      type="url"
                                      value={item.url}
                                      onChange={(e) => handleUpdateCustomSocial(item.id, 'url', e.target.value)}
                                      placeholder={
                                        detectedPlatform === 'tiktok'
                                          ? 'https://tiktok.com/@motionpub'
                                          : detectedPlatform === 'discord'
                                            ? 'https://discord.gg/...'
                                            : detectedPlatform === 'twitter'
                                              ? 'https://x.com/motionpub'
                                              : 'https://...'
                                      }
                                    />
                                  </div>

                                  <div className="mp-custom-social-actions">
                                    <button
                                      type="button"
                                      className="mp-delete-social-btn"
                                      onClick={() => handleDeleteCustomSocial(item.id)}
                                      title="Remove this link"
                                      aria-label="Remove link"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Contact Form Service Options */}
                {showServices && (
                  <div id="contact-section-services" className="mp-contact-card">
                    <div className="mp-card-header">
                      <div className="mp-card-icon-wrap amber">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      </div>
                      <div className="mp-card-header-text">
                        <div className="mp-services-card-title-row">
                          <h3 className="mp-card-title">Service Type Dropdown Options</h3>
                          <span className="mp-services-count-badge">{serviceOptions.length} Options</span>
                        </div>
                        <p className="mp-card-subtitle">
                          Manage options visitors choose in the Contact form dropdown (saved directly to MongoDB).
                        </p>
                      </div>
                    </div>

                    {serviceFeedback && (
                      <div className={`mp-contact-alert ${serviceFeedback.type}`} style={{ marginBottom: '1rem' }}>
                        <span>{serviceFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                        <span>{serviceFeedback.message}</span>
                      </div>
                    )}

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
                            onClick={requestResetServices}
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
                                    {svc.isDefault && <span className="mp-service-default-pill">Default</span>}
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
                                      onClick={() => requestDeleteService(svc._id, svc.name)}
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

                    <div className="mp-services-footer-row">
                      <span className="mp-services-tip">
                        Changes sync immediately with the live visitor contact form.
                      </span>
                      <button
                        type="button"
                        className="mp-btn-restore-defaults"
                        onClick={requestResetServices}
                      >
                        Restore Default 3 Options
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Docked Bottom Action Bar (never overlaps form fields) */}
            {showFooterBar && (
              <div className="mp-contact-actions-bar">
                {hasChanges ? (
                  <span className="mp-unsaved-badge">
                    <span className="mp-unsaved-dot" />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="mp-saved-hint">All contact settings are up to date</span>
                )}
                <div className="mp-contact-actions-buttons">
                  <button
                    type="button"
                    className="mp-btn-reset-default"
                    onClick={requestResetContact}
                  >
                    Reset Default Template
                  </button>
                  <button
                    type="submit"
                    className="mp-btn-save-contact"
                    disabled={!hasChanges}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Save &amp; Apply Changes</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )
      ) : (
        /* Live Website Simulation */
        <div ref={scrollBodyRef} className="mp-contact-scroll-body">
          <div className="mp-contact-sim-container">
            <div className="mp-sim-badge">Live Website Simulation</div>

            <div className="mp-sim-glow-orb top-left" />
            <div className="mp-sim-glow-orb bottom-right" />

            <div className="mp-sim-header-pill">
              <div className="mp-sim-header-pill-inner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>CONTACT US</span>
              </div>
            </div>

            <div className="mp-sim-frontend-layout">
              {/* Left Column */}
              <div className="mp-sim-left">
                <h2 className="mp-sim-headline">
                  How can we help<br />
                  you today?
                </h2>

                <p className="mp-sim-subtext">
                  Our dedicated customer support team is just a message or call away.
                </p>

                <div className="mp-sim-info-list">
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
                    <div className="mp-sim-status-group">
                      <span className={`mp-sim-status-pill ${simIsOpen ? 'open' : 'closed'}`}>
                        <span className="mp-sim-status-dot" />
                        {simIsOpen ? 'Open Now' : 'Closed Now'}
                      </span>
                      {!simIsOpen && info.closedNotice && (
                        <span className="mp-sim-notice-pill">{info.closedNotice}</span>
                      )}
                    </div>
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
                    {(info.customSocials || []).map((link) => {
                      if (!link.url) return null;
                      const platform = detectPlatform(link.title, link.url);
                      const meta = PLATFORM_META[platform] || PLATFORM_META.generic;
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mp-sim-social-link-btn ${meta.cssClass}`}
                          title={link.title || meta.name}
                        >
                          {renderSocialIcon(platform, 19)}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Client Form Simulation */}
              <div className="mp-sim-form-card">
                <form className="mp-sim-form" onSubmit={handleSimSubmit}>
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

                  <div className="mp-sim-form-group">
                    <label className="mp-sim-form-label">Service Type*</label>
                    <div className="mp-sim-service-wrap" ref={simServiceRef}>
                      <button
                        type="button"
                        className={`mp-sim-service-btn ${isSimServiceOpen ? 'active' : ''}`}
                        onClick={() => setIsSimServiceOpen((prev) => !prev)}
                      >
                        <div className="mp-sim-service-val">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mp-sim-service-icon">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                          <span className="mp-sim-service-name-text">
                            {simService || serviceOptions[0]?.name || 'Edit Video'}
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
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmMessage
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        highlightItem={confirmState.highlightItem}
        isLoading={confirmState.isLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
