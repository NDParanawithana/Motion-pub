import { useState, useEffect, useMemo } from 'react';
import './mpCalender.css';

const DEFAULT_TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
];

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', badgeClass: 'confirmed' },
  { value: 'pending', label: 'Pending', badgeClass: 'pending' },
  { value: 'completed', label: 'Completed', badgeClass: 'completed' },
  { value: 'cancelled', label: 'Cancelled', badgeClass: 'cancelled' },
];

export default function MpCalenderAdmin() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [serviceOptions, setServiceOptions] = useState([
    'Edit Video',
    'Video Production',
    'Reel',
    'Motion Graphics',
    'Consultation'
  ]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null); // appointment object when editing
  const [deletingAppt, setDeletingAppt] = useState(null); // appointment object when deleting

  // Notification Banner
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', message: string }

  // Calendar View month & year
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [filterDate, setFilterDate] = useState(''); // filter list to specific date

  const ONLINE_MEETING_OPTIONS = ['Google Meet', 'Zoom Meeting', 'WhatsApp Video', 'Microsoft Teams'];

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: 'Edit Video',
    meetingMethod: 'Google Meet',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '11:00 AM',
    status: 'confirmed',
    notes: '',
  });

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contact/appointments');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAppointments(data.data);
          localStorage.setItem('mp_client_appointments', JSON.stringify(data.data));
          return;
        }
      }
      throw new Error('Could not fetch from server');
    } catch {
      // Local storage fallback
      try {
        const saved = localStorage.getItem('mp_client_appointments');
        if (saved) {
          setAppointments(JSON.parse(saved));
        } else {
          setAppointments([]);
        }
      } catch {
        setAppointments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch service dropdown options
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/contact/services');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setServiceOptions(json.data.map((s) => s.name));
          }
        }
      } catch {}
    };
    fetchServices();
    fetchAppointments();

    const handleSync = () => fetchAppointments();
    window.addEventListener('mp_appointments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mp_appointments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (filterDate && item.date !== filterDate) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (item.clientName || '').toLowerCase().includes(q);
      const matchEmail = (item.clientEmail || '').toLowerCase().includes(q);
      const matchPhone = (item.clientPhone || '').toLowerCase().includes(q);
      const matchService = (item.serviceType || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchService || matchNotes;
    });
  }, [appointments, statusFilter, filterDate, searchQuery]);

  // Metric KPIs
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const todayCount = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled').length;
    return { total, confirmed, pending, todayCount };
  }, [appointments]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceType: serviceOptions[0] || 'Edit Video',
      meetingMethod: 'Google Meet',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: DEFAULT_TIME_SLOTS[0],
      status: 'confirmed',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (appt) => {
    setEditingAppt(appt);
    setFormData({
      clientName: appt.clientName || '',
      clientEmail: appt.clientEmail || '',
      clientPhone: appt.clientPhone || '',
      serviceType: appt.serviceType || serviceOptions[0] || 'Edit Video',
      meetingMethod: appt.meetingMethod || 'Google Meet',
      date: appt.date || new Date().toISOString().slice(0, 10),
      timeSlot: appt.timeSlot || DEFAULT_TIME_SLOTS[0],
      status: appt.status || 'confirmed',
      notes: appt.notes || '',
    });
  };

  // Submit Add Appointment
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.date || !formData.timeSlot) {
      showBanner('error', 'Please fill in Client Name, Email, Date and Time slot.');
      return;
    }

    try {
      const payload = {
        ...formData,
        source: 'admin',
      };

      const res = await fetch('/api/contact/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create appointment');
      }

      showBanner('success', `Appointment for ${formData.clientName} successfully scheduled!`);
      setIsAddModalOpen(false);

      // Local sync & event
      const updatedList = [json.data, ...appointments];
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
    } catch (err) {
      // Fallback local addition if offline
      const mockDoc = {
        _id: `local-${Date.now()}`,
        ...formData,
        source: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedList = [mockDoc, ...appointments];
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
      showBanner('success', `Appointment added locally: ${err.message}`);
      setIsAddModalOpen(false);
    }
  };

  // Submit Edit Appointment
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;

    try {
      const res = await fetch(`/api/contact/appointments/${editingAppt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update appointment');
      }

      showBanner('success', `Appointment updated successfully!`);
      setEditingAppt(null);

      // Refresh list
      const updatedList = appointments.map((a) =>
        String(a._id) === String(editingAppt._id) ? json.data : a
      );
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
    } catch (err) {
      // Fallback local update
      const updatedList = appointments.map((a) =>
        String(a._id) === String(editingAppt._id) ? { ...a, ...formData, updatedAt: new Date() } : a
      );
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
      showBanner('success', `Updated locally: ${err.message}`);
      setEditingAppt(null);
    }
  };

  // Delete Appointment
  const handleConfirmDelete = async () => {
    if (!deletingAppt) return;
    try {
      const res = await fetch(`/api/contact/appointments/${deletingAppt._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete appointment');
      }

      showBanner('success', `Appointment deleted successfully.`);
      const updatedList = appointments.filter((a) => String(a._id) !== String(deletingAppt._id));
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
      setDeletingAppt(null);
    } catch (err) {
      const updatedList = appointments.filter((a) => String(a._id) !== String(deletingAppt._id));
      setAppointments(updatedList);
      localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mp_appointments_updated'));
      showBanner('success', `Deleted locally: ${err.message}`);
      setDeletingAppt(null);
    }
  };

  // Quick Status Change directly from list
  const handleQuickStatusChange = async (apptId, nextStatus) => {
    try {
      await fetch(`/api/contact/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {}

    const updatedList = appointments.map((a) =>
      String(a._id) === String(apptId) ? { ...a, status: nextStatus } : a
    );
    setAppointments(updatedList);
    localStorage.setItem('mp_client_appointments', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('mp_appointments_updated'));
  };

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const totalDays = lastDay.getDate();

    let startDayIdx = firstDay.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;

    const days = [];
    for (let i = 0; i < startDayIdx; i++) {
      days.push({ dayNum: null, dateKey: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${calYear}-${mStr}-${dStr}`;
      const dayAppts = appointments.filter((a) => a.date === dateKey && a.status !== 'cancelled');
      days.push({ dayNum: d, dateKey, appts: dayAppts });
    }
    return days;
  }, [calYear, calMonth, appointments]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="mp-admin-cal-root">
      {/* Top Banner Alert */}
      {banner && (
        <div className={`mp-admin-banner ${banner.type}`}>
          <span>{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)} className="mp-admin-banner-close">
            &times;
          </button>
        </div>
      )}

      {/* Header with Title & Main Actions */}
      <div className="mp-admin-cal-header">
        <div>
          <h2 className="mp-admin-cal-title">
            <span className="mp-cal-badge-pill">CMS</span>
            Client Meeting Appointments
          </h2>
          <p className="mp-admin-cal-subtitle">
            Manage scheduled video editing client meetings, manual appointments, and calendar availability.
          </p>
        </div>

        <div className="mp-admin-cal-actions">
          <button
            type="button"
            className="mp-admin-btn secondary"
            onClick={fetchAppointments}
            disabled={isLoading}
            title="Refresh appointments"
          >
            <svg
              className={`mp-spin-icon ${isLoading ? 'spinning' : ''}`}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="mp-admin-btn primary"
            onClick={handleOpenAdd}
            title="Schedule a new appointment"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="mp-admin-kpi-grid">
        <div className="mp-admin-kpi-card">
          <div className="mp-kpi-info">
            <span className="mp-kpi-label">Total Scheduled</span>
            <span className="mp-kpi-value">{kpis.total}</span>
          </div>
          <div className="mp-kpi-icon total">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>

        <div className="mp-admin-kpi-card">
          <div className="mp-kpi-info">
            <span className="mp-kpi-label">Today's Meetings</span>
            <span className="mp-kpi-value">{kpis.todayCount}</span>
          </div>
          <div className="mp-kpi-icon today">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="mp-admin-kpi-card">
          <div className="mp-kpi-info">
            <span className="mp-kpi-label">Confirmed</span>
            <span className="mp-kpi-value">{kpis.confirmed}</span>
          </div>
          <div className="mp-kpi-icon confirmed">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div className="mp-admin-kpi-card">
          <div className="mp-kpi-info">
            <span className="mp-kpi-label">Pending Inquiries</span>
            <span className="mp-kpi-value">{kpis.pending}</span>
          </div>
          <div className="mp-kpi-icon pending">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and View Mode Toggle */}
      <div className="mp-admin-control-bar">
        {/* Search Input */}
        <div className="mp-admin-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by client name, email, phone, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mp-admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="mp-admin-search-clear"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mp-admin-filter-group">
          <span className="mp-filter-label">Status:</span>
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              className={`mp-filter-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>

        {/* View Switcher: List vs Calendar */}
        <div className="mp-admin-view-toggle">
          <button
            type="button"
            className={`mp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('list');
              setFilterDate('');
            }}
            title="Table List View"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>List</span>
          </button>
          <button
            type="button"
            className={`mp-view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Monthly Calendar View"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {filterDate && (
        <div className="mp-active-date-filter-pill">
          <span>Filtered by Date: <strong>{filterDate}</strong></span>
          <button type="button" onClick={() => setFilterDate('')}>
            Show All Dates &times;
          </button>
        </div>
      )}

      {/* Main Content: List View or Calendar View */}
      {viewMode === 'list' ? (
        <div className="mp-admin-table-card">
          {isLoading && appointments.length === 0 ? (
            <div className="mp-admin-empty-state">
              <span className="mp-btn-spinner" />
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="mp-admin-empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>No appointments found</h3>
              <p>
                {searchQuery || statusFilter !== 'all' || filterDate
                  ? 'Try clearing your filters or search terms.'
                  : 'No client appointments scheduled yet.'}
              </p>
              <button type="button" className="mp-admin-btn primary" onClick={handleOpenAdd}>
                Schedule Appointment
              </button>
            </div>
          ) : (
            <div className="mp-table-responsive">
              <table className="mp-admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => {
                    const statusObj = STATUS_OPTIONS.find((s) => s.value === appt.status) || STATUS_OPTIONS[0];

                    return (
                      <tr key={appt._id}>
                        <td>
                          <div className="mp-client-cell">
                            <div className="mp-client-avatar">
                              {(appt.clientName || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="mp-client-name">{appt.clientName}</div>
                              <span className="mp-client-source-badge">
                                {appt.source === 'admin' ? 'Manual (Admin)' : 'Client Booking'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="mp-contact-cell">
                            <a href={`mailto:${appt.clientEmail}`} className="mp-contact-link email" title="Send Email">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                              <span>{appt.clientEmail}</span>
                            </a>
                            {appt.clientPhone && (
                              <a href={`tel:${appt.clientPhone.replace(/\s+/g, '')}`} className="mp-contact-link phone" title="Call Client">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <span>{appt.clientPhone}</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span className="mp-service-tag">{appt.serviceType || 'Edit Video'}</span>
                            <span className="mp-method-tag" style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#00f2fe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe' }} />
                              {appt.meetingMethod || 'Google Meet'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="mp-datetime-cell">
                            <span className="mp-date-val">{appt.date}</span>
                            <span className="mp-time-val">{appt.timeSlot}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            className={`mp-status-select ${statusObj.badgeClass}`}
                            value={appt.status}
                            onChange={(e) => handleQuickStatusChange(appt._id, e.target.value)}
                            title="Change appointment status"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="mp-notes-cell" title={appt.notes || 'No extra notes'}>
                            {appt.notes ? appt.notes : <span className="mp-dim-text">—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="mp-action-btn-group">
                            <button
                              type="button"
                              className="mp-row-action-btn edit"
                              onClick={() => handleOpenEdit(appt)}
                              title="Edit appointment details"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="mp-row-action-btn delete"
                              onClick={() => setDeletingAppt(appt)}
                              title="Delete appointment"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Monthly Calendar Visualizer */
        <div className="mp-admin-monthly-cal-card">
          <div className="mp-admin-month-nav">
            <div className="mp-month-title-wrap">
              <h3>{monthNames[calMonth]} {calYear}</h3>
              <span className="mp-month-count-tag">
                {appointments.filter((a) => a.date?.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`)).length} appointments this month
              </span>
            </div>

            <div className="mp-month-btn-group">
              <button
                type="button"
                className="mp-month-nav-btn"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
              >
                &larr; Prev
              </button>
              <button
                type="button"
                className="mp-month-nav-btn"
                onClick={() => {
                  setCalMonth(new Date().getMonth());
                  setCalYear(new Date().getFullYear());
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="mp-month-nav-btn"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>

          <div className="mp-admin-cal-weekdays-row">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="mp-admin-cal-th">
                {d}
              </div>
            ))}
          </div>

          <div className="mp-admin-cal-month-grid">
            {calendarDays.map((c, idx) => {
              if (!c.dayNum) {
                return <div key={`empty-${idx}`} className="mp-admin-cal-cell empty" />;
              }

              const hasAppts = c.appts && c.appts.length > 0;
              const isToday = c.dateKey === new Date().toISOString().slice(0, 10);
              const isFiltered = filterDate === c.dateKey;

              return (
                <div
                  key={c.dateKey}
                  className={`mp-admin-cal-cell ${hasAppts ? 'has-appts' : ''} ${isToday ? 'today' : ''} ${isFiltered ? 'active-filter' : ''}`}
                  onClick={() => {
                    if (hasAppts) {
                      setFilterDate(c.dateKey);
                      setViewMode('list');
                    }
                  }}
                  title={hasAppts ? `Click to view ${c.appts.length} appointments` : c.dateKey}
                >
                  <div className="mp-cal-day-header">
                    <span className="mp-cal-num">{c.dayNum}</span>
                    {hasAppts && (
                      <span className="mp-cal-badge-count">{c.appts.length}</span>
                    )}
                  </div>

                  {hasAppts && (
                    <div className="mp-cal-appts-list">
                      {c.appts.slice(0, 3).map((a) => (
                        <div key={a._id} className={`mp-cal-mini-chip ${a.status}`}>
                          <span className="mp-chip-time">{a.timeSlot}</span>
                          <span className="mp-chip-name">{a.clientName}</span>
                        </div>
                      ))}
                      {c.appts.length > 3 && (
                        <span className="mp-chip-more">+{c.appts.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
         Add / Edit Appointment Modal
         ========================================================================= */}
      {(isAddModalOpen || editingAppt) && (
        <div className="mp-modal-backdrop" onClick={() => { setIsAddModalOpen(false); setEditingAppt(null); }}>
          <div className="mp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <div>
                <h3 className="mp-modal-title">
                  {editingAppt ? 'Edit Appointment' : 'Schedule New Client Meeting'}
                </h3>
                <p className="mp-modal-subtitle">
                  {editingAppt ? 'Update date, time slot, client credentials or meeting status.' : 'Manually book an appointment in the schedule.'}
                </p>
              </div>
              <button
                type="button"
                className="mp-modal-close-btn"
                onClick={() => { setIsAddModalOpen(false); setEditingAppt(null); }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={editingAppt ? handleSubmitEdit : handleSubmitAdd} className="mp-modal-form">
              <div className="mp-form-row two-cols">
                <div className="mp-modal-field">
                  <label className="mp-modal-label">Client Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="mp-modal-input"
                  />
                </div>
                <div className="mp-modal-field">
                  <label className="mp-modal-label">Client Email*</label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="mp-modal-input"
                  />
                </div>
              </div>

              <div className="mp-form-row two-cols">
                <div className="mp-modal-field">
                  <label className="mp-modal-label">Client Phone</label>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="mp-modal-input"
                  />
                </div>
                <div className="mp-modal-field">
                  <label className="mp-modal-label">Service Type*</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="mp-modal-select"
                  >
                    {serviceOptions.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mp-form-row">
                <div className="mp-modal-field" style={{ width: '100%' }}>
                  <label className="mp-modal-label">Online Meeting Method* (Online Only)</label>
                  <select
                    value={formData.meetingMethod}
                    onChange={(e) => setFormData({ ...formData, meetingMethod: e.target.value })}
                    className="mp-modal-select"
                  >
                    {ONLINE_MEETING_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} (Online Video)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mp-form-row three-cols">
                <div className="mp-modal-field">
                  <label className="mp-modal-label">Meeting Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mp-modal-input"
                  />
                </div>

                <div className="mp-modal-field">
                  <label className="mp-modal-label">Time Slot*</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="mp-modal-select"
                  >
                    {DEFAULT_TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mp-modal-field">
                  <label className="mp-modal-label">Status*</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mp-modal-select"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mp-modal-field">
                <label className="mp-modal-label">Notes / Project Scope</label>
                <textarea
                  rows={3}
                  placeholder="Additional notes about video requirements, footage details, or meeting agenda..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mp-modal-textarea"
                />
              </div>

              <div className="mp-modal-actions">
                <button
                  type="button"
                  className="mp-admin-btn secondary"
                  onClick={() => { setIsAddModalOpen(false); setEditingAppt(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="mp-admin-btn primary">
                  {editingAppt ? 'Save Changes' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         Delete Confirmation Modal
         ========================================================================= */}
      {deletingAppt && (
        <div className="mp-modal-backdrop" onClick={() => setDeletingAppt(null)}>
          <div className="mp-modal-card sm" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <div className="mp-delete-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="mp-modal-title">Delete Appointment?</h3>
                <p className="mp-modal-subtitle">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mp-delete-confirm-body">
              <p>
                Are you sure you want to delete the meeting for <strong>{deletingAppt.clientName}</strong> on{' '}
                <strong>{deletingAppt.date}</strong> at <strong>{deletingAppt.timeSlot}</strong>?
              </p>
            </div>

            <div className="mp-modal-actions">
              <button
                type="button"
                className="mp-admin-btn secondary"
                onClick={() => setDeletingAppt(null)}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                className="mp-admin-btn danger"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
