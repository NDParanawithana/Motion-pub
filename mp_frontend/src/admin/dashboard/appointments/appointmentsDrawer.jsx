import { useState, useEffect, useMemo, useCallback } from 'react';
import './appointments.css';

// Curated avatar palettes for visual diversity
const AVATAR_PALETTES = [
  { bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.38)', text: '#38bdf8' }, // Sky Blue
  { bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.38)', text: '#c084fc' }, // Violet / Purple
  { bg: 'rgba(249, 115, 22, 0.16)', border: 'rgba(249, 115, 22, 0.38)', text: '#fb923c' }, // Warm Orange
  { bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.38)', text: '#34d399' }, // Emerald
  { bg: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.38)', text: '#fb7185' },  // Rose / Coral
  { bg: 'rgba(20, 184, 166, 0.16)', border: 'rgba(20, 184, 166, 0.38)', text: '#2dd4bf' }, // Teal
  { bg: 'rgba(234, 179, 8, 0.16)', border: 'rgba(234, 179, 8, 0.38)', text: '#facc15' },   // Amber / Gold
  { bg: 'rgba(99, 102, 241, 0.16)', border: 'rgba(99, 102, 241, 0.38)', text: '#818cf8' }, // Indigo
];

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
];

const MEETING_PLATFORMS = ['Google Meet', 'Zoom Meeting', 'Microsoft Teams', 'WhatsApp Video'];

function getAvatarStyle(name) {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatFullDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatMeetingDate(dateStr) {
  if (!dateStr) return 'Unscheduled Date';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch {}
  return dateStr;
}

function getServiceMeta(serviceType) {
  const norm = (serviceType || '').toLowerCase().trim();
  if (norm.includes('edit')) {
    return {
      name: serviceType || 'Edit Video',
      icon: '🎬',
      tagColor: '#38bdf8',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      tagBorder: 'rgba(56, 189, 248, 0.35)'
    };
  }
  if (norm.includes('production')) {
    return {
      name: serviceType || 'Video Production',
      icon: '📹',
      tagColor: '#c084fc',
      tagBg: 'rgba(192, 132, 252, 0.15)',
      tagBorder: 'rgba(192, 132, 252, 0.35)'
    };
  }
  if (norm.includes('reel')) {
    return {
      name: serviceType || 'Reel',
      icon: '📱',
      tagColor: '#fb7185',
      tagBg: 'rgba(251, 113, 133, 0.15)',
      tagBorder: 'rgba(251, 113, 133, 0.35)'
    };
  }
  return {
    name: serviceType || 'General Consultation',
    icon: '✨',
    tagColor: '#fbbf24',
    tagBg: 'rgba(251, 191, 36, 0.15)',
    tagBorder: 'rgba(251, 191, 36, 0.35)'
  };
}

function cleanNotes(notes) {
  if (!notes) return '';
  // Strip any [Scheduled Online Meeting: ...] prefix if present from legacy
  return notes.replace(/^\[Scheduled Online Meeting:[^\]]+\]\s*/i, '').trim();
}

export default function AppointmentsDrawer({
  isOpen,
  onClose,
  onOpenCalendarView,
  onPendingCountChange
}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'past'
  const [selectedService, setSelectedService] = useState('all');
  const [availableServices, setAvailableServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Add / Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [modalForm, setModalForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: 'Edit Video',
    meetingMethod: 'Google Meet',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '11:00 AM',
    status: 'pending',
    notes: '',
  });

  // Fetch service dropdown options
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/contact/services');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setAvailableServices(json.data.map(s => s.name));
          }
        }
      } catch (err) {
        console.warn('Could not load services for appointments drawer:', err.message);
      }
    };
    fetchServices();
  }, []);

  // Fetch appointments from MongoDB API
  const fetchAppointments = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/contact/appointments');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAppointments(json.data);
        localStorage.setItem('mp_client_appointments', JSON.stringify(json.data));
        const pending = json.data.filter(a => a.status === 'pending').length;
        if (onPendingCountChange) onPendingCountChange(pending);
      } else {
        throw new Error(json.message || 'Failed to parse appointment list');
      }
    } catch (err) {
      console.warn('Error fetching appointments, checking local storage:', err);
      try {
        const saved = localStorage.getItem('mp_client_appointments');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAppointments(parsed);
          const pending = parsed.filter(a => a.status === 'pending').length;
          if (onPendingCountChange) onPendingCountChange(pending);
          return;
        }
      } catch {}
      setError(err.message || 'Could not connect to appointments endpoint');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onPendingCountChange]);

  // Initial fetch and auto-polling
  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(() => {
      fetchAppointments(true);
    }, 25000);

    const handleSync = () => fetchAppointments(true);
    window.addEventListener('mp_appointments_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mp_appointments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchAppointments]);

  // Sync count whenever appointments change
  useEffect(() => {
    const pending = appointments.filter(a => a.status === 'pending').length;
    if (onPendingCountChange) onPendingCountChange(pending);
  }, [appointments, onPendingCountChange]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isAddModalOpen || editingAppt) {
          setIsAddModalOpen(false);
          setEditingAppt(null);
        } else if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, isAddModalOpen, editingAppt, onClose]);

  // Quick Status Change directly from card
  const handleQuickStatus = async (appt, newStatus, e) => {
    e?.stopPropagation();
    const apptId = appt._id;

    // Optimistic update
    setAppointments(prev =>
      prev.map(a => a._id === apptId ? { ...a, status: newStatus, isActive: newStatus !== 'cancelled' } : a)
    );

    try {
      const res = await fetch(`/api/contact/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      window.dispatchEvent(new Event('mp_appointments_updated'));
      const statusLabel = newStatus === 'confirmed' ? 'Accepted' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      setCopyFeedback(`Status changed to ${statusLabel}`);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (err) {
      console.error('Error updating status:', err);
      // Revert if error
      fetchAppointments(true);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appt, e) => {
    e?.stopPropagation();
    const name = appt.clientName || 'this client';
    if (!window.confirm(`Are you sure you want to delete the appointment for ${name} on ${appt.date} at ${appt.timeSlot}?`)) {
      return;
    }

    setDeletingId(appt._id);
    try {
      const res = await fetch(`/api/contact/appointments/${appt._id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete appointment');

      setAppointments(prev => prev.filter(a => a._id !== appt._id));
      window.dispatchEvent(new Event('mp_appointments_updated'));
      setCopyFeedback('Appointment deleted');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Could not delete appointment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy helper
  const handleCopy = (text, label, e) => {
    e?.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Open Edit Modal
  const handleOpenEdit = (appt, e) => {
    e?.stopPropagation();
    setEditingAppt(appt);
    setModalForm({
      clientName: appt.clientName || '',
      clientEmail: appt.clientEmail || '',
      clientPhone: appt.clientPhone || '',
      serviceType: appt.serviceType || availableServices[0] || 'Edit Video',
      meetingMethod: appt.meetingMethod || 'Google Meet',
      date: appt.date || new Date().toISOString().slice(0, 10),
      timeSlot: appt.timeSlot || '11:00 AM',
      status: appt.status || 'pending',
      notes: cleanNotes(appt.notes),
    });
  };

  // Save Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;

    try {
      const res = await fetch(`/api/contact/appointments/${editingAppt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalForm)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update');

      setAppointments(prev =>
        prev.map(a => a._id === editingAppt._id ? json.data : a)
      );
      window.dispatchEvent(new Event('mp_appointments_updated'));
      setEditingAppt(null);
      setCopyFeedback('Appointment updated successfully');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (err) {
      alert(`Update error: ${err.message}`);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceType: availableServices[0] || 'Edit Video',
      meetingMethod: 'Google Meet',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '11:00 AM',
      status: 'pending',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Save Add Modal
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...modalForm, source: 'admin' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create');

      setAppointments(prev => [json.data, ...prev]);
      window.dispatchEvent(new Event('mp_appointments_updated'));
      setIsAddModalOpen(false);
      setCopyFeedback('New appointment added');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (err) {
      alert(`Booking error: ${err.message}`);
    }
  };

  // Distinct service types
  const allServiceTypes = useMemo(() => {
    const set = new Set();
    availableServices.forEach(s => s && set.add(s.trim()));
    appointments.forEach(a => {
      const st = (a.serviceType || '').trim();
      if (st) set.add(st);
    });
    return Array.from(set);
  }, [availableServices, appointments]);

  // Service count map
  const serviceCounts = useMemo(() => {
    const counts = {};
    appointments.forEach(a => {
      const s = (a.serviceType || 'General Consultation').trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  // Status counts
  const statusCounts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach(a => {
      const st = a.status || 'pending';
      if (c[st] !== undefined) c[st]++;
    });
    return c;
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return appointments.filter(a => {
      // Status filter
      if (statusFilter !== 'all' && (a.status || 'pending') !== statusFilter) return false;

      // Date filter
      if (dateFilter === 'today' && a.date !== todayStr) return false;
      if (dateFilter === 'upcoming' && (a.date < todayStr || a.status === 'cancelled')) return false;
      if (dateFilter === 'past' && a.date >= todayStr) return false;

      // Service filter
      if (selectedService !== 'all') {
        const aSvc = (a.serviceType || 'General Consultation').trim();
        if (aSvc !== selectedService) return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (a.clientName || '').toLowerCase();
      const email = (a.clientEmail || '').toLowerCase();
      const phone = (a.clientPhone || '').toLowerCase();
      const service = (a.serviceType || '').toLowerCase();
      const notes = (a.notes || '').toLowerCase();
      const date = (a.date || '').toLowerCase();
      const time = (a.timeSlot || '').toLowerCase();
      const method = (a.meetingMethod || '').toLowerCase();

      return name.includes(q) || email.includes(q) || phone.includes(q) ||
             service.includes(q) || notes.includes(q) || date.includes(q) ||
             time.includes(q) || method.includes(q);
    });
  }, [appointments, statusFilter, dateFilter, selectedService, searchQuery]);

  // Group filtered by service
  const groupedByService = useMemo(() => {
    const groups = {};
    filteredAppointments.forEach(appt => {
      const svc = (appt.serviceType || 'General Consultation').trim();
      if (!groups[svc]) groups[svc] = [];
      groups[svc].push(appt);
    });
    return groups;
  }, [filteredAppointments]);

  const toggleSectionCollapse = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (!isOpen) return null;

  // Render Single Appointment Card
  const renderAppointmentCard = (appt) => {
    const isExpanded = expandedId === appt._id;
    const clientName = appt.clientName || 'Client Visitor';
    const avatarLetter = (clientName[0] || 'C').toUpperCase();
    const avatarStyle = getAvatarStyle(clientName);
    const serviceMeta = getServiceMeta(appt.serviceType);
    const currentStatus = appt.status || 'pending';
    const notesClean = cleanNotes(appt.notes);

    const platformMethod = (appt.meetingMethod || 'Google Meet').trim();
    const platformClass = platformMethod.toLowerCase().includes('zoom')
      ? 'zoom'
      : platformMethod.toLowerCase().includes('teams')
      ? 'teams'
      : platformMethod.toLowerCase().includes('whatsapp')
      ? 'whatsapp'
      : 'google-meet';

    return (
      <article
        key={appt._id}
        className={`mp-appt-card is-${currentStatus} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setExpandedId(isExpanded ? null : appt._id)}
        title={isExpanded ? 'Click to collapse card' : 'Click to expand appointment details'}
      >
        {/* Top Row: Client Info & Actions */}
        <div className="mp-appt-card-top">
          <div className="mp-appt-client-group">
            <div
              className="mp-appt-avatar"
              style={{
                background: avatarStyle.bg,
                borderColor: avatarStyle.border,
                color: avatarStyle.text
              }}
            >
              {avatarLetter}
            </div>
            <div className="mp-appt-client-meta">
              <div className="mp-appt-client-name-row">
                <h4 className="mp-appt-client-name">{clientName}</h4>
                <div className="mp-appt-status-select-wrap" onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`mp-appt-status-select ${currentStatus === 'accepted' ? 'confirmed' : currentStatus}`}
                    value={currentStatus === 'accepted' ? 'confirmed' : currentStatus}
                    onChange={(e) => handleQuickStatus(appt, e.target.value, e)}
                    title="Click to change appointment status"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="confirmed">✓ Accepted</option>
                    <option value="completed">✔ Completed</option>
                    <option value="cancelled">✕ Cancelled</option>
                  </select>
                </div>
                <span
                  className="mp-appt-service-tag"
                  style={{
                    color: serviceMeta.tagColor,
                    background: serviceMeta.tagBg,
                    borderColor: serviceMeta.tagBorder
                  }}
                >
                  <span>{serviceMeta.icon}</span>
                  <span>{serviceMeta.name}</span>
                </span>
              </div>
              <span className="mp-appt-time-relative" title={formatFullDateTime(appt.createdAt)}>
                Booked {formatRelativeTime(appt.createdAt)}
              </span>
            </div>
          </div>

          <div className="mp-appt-card-top-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mp-appt-btn-edit"
              onClick={(e) => handleOpenEdit(appt, e)}
              title="Edit appointment details"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button
              type="button"
              className="mp-appt-btn-delete"
              onClick={(e) => handleDeleteAppointment(appt, e)}
              disabled={deletingId === appt._id}
              title="Delete appointment"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* HERO MEETING HIGHLIGHT BOX (Date, Time Slot, and Video Platform) */}
        <div className="mp-appt-schedule-box">
          <div className="mp-appt-schedule-left">
            <div className="mp-appt-schedule-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Date: <strong>{formatMeetingDate(appt.date)}</strong></span>
            </div>

            <div className="mp-appt-schedule-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Time: <strong>{appt.timeSlot || '11:00 AM'}</strong></span>
            </div>
          </div>

          <div className={`mp-appt-method-pill ${platformClass}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>{platformMethod}</span>
          </div>
        </div>

        {/* Contact Chips */}
        <div className="mp-appt-contact-chips" onClick={(e) => e.stopPropagation()}>
          {appt.clientEmail && (
            <div className="mp-appt-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a
                href={`mailto:${appt.clientEmail}?subject=Regarding your Motion Pub appointment on ${appt.date} at ${appt.timeSlot}`}
                className="mp-appt-chip-link"
                title="Send email reply"
              >
                {appt.clientEmail}
              </a>
              <button
                type="button"
                className="mp-appt-chip-copy"
                onClick={(e) => handleCopy(appt.clientEmail, 'email', e)}
                title="Copy email"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          )}

          {appt.clientPhone && (
            <div className="mp-appt-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href={`tel:${appt.clientPhone}`} className="mp-appt-chip-link" title="Call client">
                {appt.clientPhone}
              </a>
              <button
                type="button"
                className="mp-appt-chip-copy"
                onClick={(e) => handleCopy(appt.clientPhone, 'phone', e)}
                title="Copy phone"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Project Brief / Notes Preview */}
        {notesClean ? (
          <p className={`mp-appt-notes-preview ${isExpanded ? 'expanded' : ''}`}>
            <strong>Brief:</strong> {notesClean}
          </p>
        ) : (
          <span className="mp-appt-empty-notes">No additional project notes provided.</span>
        )}

        {/* Card Footer: Timestamps & Quick Actions */}
        <div className="mp-appt-card-footer" onClick={(e) => e.stopPropagation()}>
          <span>Scheduled for: {appt.date} ({appt.timeSlot})</span>

          <div className="mp-appt-footer-actions">
            {currentStatus === 'pending' && (
              <button
                type="button"
                className="mp-appt-btn-confirm"
                onClick={(e) => handleQuickStatus(appt, 'confirmed', e)}
                title="Confirm appointment"
              >
                <span>✓ Confirm</span>
              </button>
            )}

            {currentStatus === 'confirmed' && (
              <button
                type="button"
                className="mp-appt-btn-complete"
                onClick={(e) => handleQuickStatus(appt, 'completed', e)}
                title="Mark meeting as completed"
              >
                <span>Mark Completed</span>
              </button>
            )}

            {appt.clientEmail && (
              <a
                href={`mailto:${appt.clientEmail}?subject=Regarding your appointment at Motion Pub on ${appt.date}&body=Hello ${clientName},%0D%0A%0D%0ARegarding our scheduled ${appt.serviceType} consultation on ${appt.date} at ${appt.timeSlot} via ${platformMethod}:%0D%0A%0D%0A`}
                className="mp-appt-btn-reply"
                title="Reply via Email"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                <span>Reply via Email</span>
              </a>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className={`mp-appt-drawer-overlay ${isFullScreen ? 'is-fullscreen' : ''}`} onClick={onClose}>
      <aside
        className={`mp-appt-drawer-panel ${isFullScreen ? 'full-screen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Client Appointments"
      >
        {/* Header */}
        <div className="mp-appt-drawer-header">
          <div className="mp-appt-header-title-wrap">
            <div className="mp-appt-header-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="mp-appt-title-row">
                <h2 className="mp-appt-drawer-title">Client Appointments</h2>
                {statusCounts.pending > 0 && (
                  <span className="mp-appt-pending-pill" title="Appointments awaiting confirmation">
                    ● {statusCounts.pending} Pending
                  </span>
                )}
                {statusCounts.confirmed > 0 && (
                  <span className="mp-appt-confirmed-pill">
                    {statusCounts.confirmed} Accepted
                  </span>
                )}
                {isFullScreen && (
                  <span className="mp-appt-fullscreen-indicator">Full Browser View</span>
                )}
              </div>
              <p className="mp-appt-drawer-subtitle">
                Scheduled consultations & video editing client meetings
              </p>
            </div>
          </div>

          <div className="mp-appt-header-actions">
            {/* Add Appointment Button */}
            <button
              type="button"
              className="mp-appt-btn-primary"
              onClick={handleOpenAdd}
              title="Schedule a new appointment"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Add</span>
            </button>

            {/* Jump to Full Calendar Button */}
            {onOpenCalendarView && (
              <button
                type="button"
                className="mp-appt-btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenCalendarView();
                }}
                title="Switch to full calendar management view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                </svg>
                <span>Calendar View</span>
              </button>
            )}

            {/* Fullscreen Expand/Compress Icon Button */}
            <button
              type="button"
              className={`mp-appt-btn-action-icon ${isFullScreen ? 'active-fullscreen' : ''}`}
              onClick={() => setIsFullScreen(prev => !prev)}
              title={isFullScreen ? 'Restore normal drawer view (Esc)' : 'Expand to full browser size'}
              aria-label={isFullScreen ? 'Restore normal view' : 'Expand to full browser size'}
            >
              {isFullScreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              )}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              className={`mp-appt-btn-action-icon ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchAppointments(false)}
              title="Refresh appointments"
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="mp-appt-btn-close"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Status Filter Tabs, Date Filter, & Service Pills */}
        <div className="mp-appt-drawer-toolbar">
          <div className="mp-appt-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search client, service, email, phone, date, notes, platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mp-appt-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="mp-appt-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mp-appt-toolbar-bottom">
            {/* Status Tabs */}
            <div className="mp-appt-filter-tabs">
              <button
                type="button"
                className={`mp-appt-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Status <span className="mp-appt-tab-count">{appointments.length}</span>
              </button>
              <button
                type="button"
                className={`mp-appt-tab ${statusFilter === 'pending' ? 'active pending' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending {statusCounts.pending > 0 && <span className="mp-appt-tab-count alert">{statusCounts.pending}</span>}
              </button>
              <button
                type="button"
                className={`mp-appt-tab ${statusFilter === 'confirmed' ? 'active confirmed' : ''}`}
                onClick={() => setStatusFilter('confirmed')}
              >
                Accepted <span className="mp-appt-tab-count">{statusCounts.confirmed}</span>
              </button>
              <button
                type="button"
                className={`mp-appt-tab ${statusFilter === 'completed' ? 'active completed' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Completed <span className="mp-appt-tab-count">{statusCounts.completed}</span>
              </button>
              <button
                type="button"
                className={`mp-appt-tab ${statusFilter === 'cancelled' ? 'active cancelled' : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled <span className="mp-appt-tab-count">{statusCounts.cancelled}</span>
              </button>
            </div>

            {/* Quick Date Scope Pills */}
            <div className="mp-appt-date-pills">
              {['all', 'upcoming', 'today', 'past'].map(df => (
                <button
                  key={df}
                  type="button"
                  className={`mp-appt-date-pill ${dateFilter === df ? 'active' : ''}`}
                  onClick={() => setDateFilter(df)}
                >
                  {df === 'all' ? 'All Dates' : df.charAt(0).toUpperCase() + df.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Service Types Filter Pills Bar */}
          <div className="mp-appt-service-filter-bar">
            <span className="mp-appt-service-bar-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Filter by Service:
            </span>
            <div className="mp-appt-service-pills-scroll">
              <button
                type="button"
                className={`mp-appt-service-pill ${selectedService === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedService('all')}
              >
                <span>All Services</span>
                <span className="mp-appt-pill-count">{appointments.length}</span>
              </button>
              {allServiceTypes.map((svcName) => {
                const count = serviceCounts[svcName] || 0;
                const meta = getServiceMeta(svcName);
                return (
                  <button
                    key={svcName}
                    type="button"
                    className={`mp-appt-service-pill ${selectedService === svcName ? 'active' : ''}`}
                    onClick={() => setSelectedService(svcName)}
                  >
                    <span>{meta.icon}</span>
                    <span>{svcName}</span>
                    <span className="mp-appt-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toast feedback */}
        {copyFeedback && (
          <div className="mp-appt-toast">
            <span>✓ {copyFeedback}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="mp-appt-list-container">
          {loading ? (
            <div className="mp-appt-loading-state">
              <div className="mp-appt-spinner" />
              <p>Loading appointments from MongoDB...</p>
            </div>
          ) : error && appointments.length === 0 ? (
            <div className="mp-appt-error-state">
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</span>
              <h4>Unable to load appointments</h4>
              <p>{error}</p>
              <button
                type="button"
                className="mp-appt-btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => fetchAppointments(false)}
              >
                Retry
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="mp-appt-empty-state">
              <div className="mp-appt-empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>No appointments found</h3>
              <p>
                {searchQuery
                  ? `No appointments matched "${searchQuery}".`
                  : statusFilter !== 'all'
                  ? `No appointments with status "${statusFilter}".`
                  : dateFilter !== 'all'
                  ? `No appointments for date filter "${dateFilter}".`
                  : 'Client meetings scheduled on the website will appear here.'}
              </p>
              <button
                type="button"
                className="mp-appt-btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={handleOpenAdd}
              >
                + Schedule New Appointment
              </button>
            </div>
          ) : selectedService === 'all' ? (
            /* GROUPED BY SERVICE VIEW (Identical section layout as screenshot) */
            <div className="mp-appt-service-groups-wrap">
              {Object.entries(groupedByService).map(([svcName, svcAppts]) => {
                const meta = getServiceMeta(svcName);
                const isSectionCollapsed = Boolean(collapsedSections[svcName]);
                return (
                  <section key={svcName} className="mp-appt-service-section">
                    <div
                      className="mp-appt-service-section-header"
                      onClick={() => toggleSectionCollapse(svcName)}
                      title="Click to toggle service section"
                    >
                      <div className="mp-appt-service-section-left">
                        <span className="mp-appt-service-section-icon">{meta.icon}</span>
                        <h3 className="mp-appt-service-section-title">{svcName}</h3>
                        <span className="mp-appt-service-section-badge">
                          {svcAppts.length} {svcAppts.length === 1 ? 'appointment' : 'appointments'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mp-appt-service-section-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionCollapse(svcName);
                        }}
                      >
                        {isSectionCollapsed ? (
                          <>
                            <span>Show</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Hide</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="m18 15-6-6-6 6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                    {!isSectionCollapsed && (
                      <div className={`mp-appt-cards ${isFullScreen ? 'grid-layout' : ''}`}>
                        {svcAppts.map((appt) => renderAppointmentCard(appt))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            /* SINGLE SERVICE VIEW */
            <div className={`mp-appt-cards ${isFullScreen ? 'grid-layout' : ''}`}>
              {filteredAppointments.map((appt) => renderAppointmentCard(appt))}
            </div>
          )}
        </div>

        {/* ADD APPOINTMENT MODAL */}
        {isAddModalOpen && (
          <div className="mp-appt-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
            <div className="mp-appt-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="mp-appt-modal-header">
                <h3>Schedule New Appointment</h3>
                <button
                  type="button"
                  className="mp-appt-btn-close"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="mp-appt-modal-form">
                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Client Full Name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Narada Paranawithana"
                      value={modalForm.clientName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Client Email*</label>
                    <input
                      type="email"
                      required
                      placeholder="client@gmail.com"
                      value={modalForm.clientEmail}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Client Phone</label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={modalForm.clientPhone}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Service Type</label>
                    <select
                      value={modalForm.serviceType}
                      onChange={(e) => setModalForm(prev => ({ ...prev, serviceType: e.target.value }))}
                    >
                      {allServiceTypes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Appointment Date*</label>
                    <input
                      type="date"
                      required
                      value={modalForm.date}
                      onChange={(e) => setModalForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Time Slot*</label>
                    <select
                      value={modalForm.timeSlot}
                      onChange={(e) => setModalForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Online Meeting Method</label>
                    <select
                      value={modalForm.meetingMethod}
                      onChange={(e) => setModalForm(prev => ({ ...prev, meetingMethod: e.target.value }))}
                    >
                      {MEETING_PLATFORMS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Initial Status</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Accepted</option>
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-group">
                  <label>Project Notes / Vision Brief</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of video editing requirements, footage details, goals..."
                    value={modalForm.notes}
                    onChange={(e) => setModalForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="mp-appt-modal-footer">
                  <button
                    type="button"
                    className="mp-appt-btn-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mp-appt-btn-primary"
                  >
                    Save Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT APPOINTMENT MODAL */}
        {editingAppt && (
          <div className="mp-appt-modal-backdrop" onClick={() => setEditingAppt(null)}>
            <div className="mp-appt-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="mp-appt-modal-header">
                <h3>Edit Appointment: {editingAppt.clientName}</h3>
                <button
                  type="button"
                  className="mp-appt-btn-close"
                  onClick={() => setEditingAppt(null)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mp-appt-modal-form">
                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Client Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.clientName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      required
                      value={modalForm.clientEmail}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={modalForm.clientPhone}
                      onChange={(e) => setModalForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Service Type</label>
                    <select
                      value={modalForm.serviceType}
                      onChange={(e) => setModalForm(prev => ({ ...prev, serviceType: e.target.value }))}
                    >
                      {allServiceTypes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Meeting Date</label>
                    <input
                      type="date"
                      required
                      value={modalForm.date}
                      onChange={(e) => setModalForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Time Slot</label>
                    <select
                      value={modalForm.timeSlot}
                      onChange={(e) => setModalForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-grid-2">
                  <div className="mp-appt-form-group">
                    <label>Meeting Method</label>
                    <select
                      value={modalForm.meetingMethod}
                      onChange={(e) => setModalForm(prev => ({ ...prev, meetingMethod: e.target.value }))}
                    >
                      {MEETING_PLATFORMS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-appt-form-group">
                    <label>Status</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Accepted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="mp-appt-form-group">
                  <label>Notes / Brief</label>
                  <textarea
                    rows={3}
                    value={modalForm.notes}
                    onChange={(e) => setModalForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="mp-appt-modal-footer">
                  <button
                    type="button"
                    className="mp-appt-btn-secondary"
                    onClick={() => setEditingAppt(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mp-appt-btn-primary"
                  >
                    Update Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
