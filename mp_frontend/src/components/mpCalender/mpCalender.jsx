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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper to format date as YYYY-MM-DD in local time
export function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(keyStr) {
  if (!keyStr) return null;
  const [y, m, d] = keyStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function MpCalender({
  selectedDate,
  selectedTime,
  onSelectDateTime,
  appointments = null, // Can be passed in, or fetched automatically
  timeSlots = DEFAULT_TIME_SLOTS,
  offDays = 'Sunday',
  className = '',
  compact = false,
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  // Current view month & year (initialized to selectedDate or today)
  const initialViewDate = useMemo(() => {
    if (selectedDate) {
      const parsed = parseDateKey(selectedDate);
      if (parsed && !isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState(() => initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialViewDate.getMonth()); // 0-11
  const [internalAppointments, setInternalAppointments] = useState([]);
  const [isLoadingAppts, setIsLoadingAppts] = useState(false);

  // Fetch appointments if not provided as prop
  useEffect(() => {
    if (appointments !== null && Array.isArray(appointments)) {
      setInternalAppointments(appointments);
      return;
    }

    let isMounted = true;
    const fetchAppts = async () => {
      setIsLoadingAppts(true);
      try {
        const res = await fetch('/api/contact/appointments');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && isMounted) {
            setInternalAppointments(data.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch appointments from server, checking local sync:', err.message);
        try {
          const saved = localStorage.getItem('mp_client_appointments');
          if (saved && isMounted) {
            setInternalAppointments(JSON.parse(saved));
          }
        } catch {}
      } finally {
        if (isMounted) setIsLoadingAppts(false);
      }
    };

    fetchAppts();

    const handleSync = () => fetchAppts();
    window.addEventListener('mp_appointments_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('mp_appointments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [appointments]);

  // Build map of booked slots per date key: { 'YYYY-MM-DD': Set(['10:00 AM', ...]) }
  const bookedSlotsByDate = useMemo(() => {
    const map = {};
    (internalAppointments || []).forEach((appt) => {
      if (appt.status === 'cancelled') return;
      if (!appt.date) return;
      if (!map[appt.date]) {
        map[appt.date] = new Set();
      }
      if (appt.timeSlot) {
        map[appt.date].add(appt.timeSlot);
      }
    });
    return map;
  }, [internalAppointments]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    if (!selectedDate) {
      onSelectDateTime?.({ date: todayKey, timeSlot: selectedTime || '' });
    }
  };

  // Generate calendar grid matrix for viewYear & viewMonth
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Day of week: 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday-first index: 0=Mon, 1=Tue, ..., 6=Sun
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;

    const cells = [];

    // Prev month padding cells
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevDateObj = new Date(viewYear, viewMonth - 1, d);
      cells.push({
        date: d,
        dateKey: formatDateKey(prevDateObj),
        isCurrentMonth: false,
        isPast: prevDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      });
    }

    // Current month cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const key = formatDateKey(dateObj);
      const isPast = key < todayKey;
      const dayOfWeek = dateObj.getDay(); // 0 is Sunday

      // Check if day is an off-day (e.g. Sunday)
      const isOffDay = (offDays || '').toLowerCase().includes('sunday') && dayOfWeek === 0;

      // Check booked appointments for this date
      const bookedSet = bookedSlotsByDate[key] || new Set();
      const bookedCount = bookedSet.size;
      const isFullyBooked = timeSlots.length > 0 && bookedCount >= timeSlots.length;
      const hasBookings = bookedCount > 0;

      cells.push({
        date: d,
        dateKey: key,
        isCurrentMonth: true,
        isPast,
        isToday: key === todayKey,
        isSelected: key === selectedDate,
        isOffDay,
        hasBookings,
        bookedCount,
        isFullyBooked,
      });
    }

    // Next month padding cells to complete 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDateObj = new Date(viewYear, viewMonth + 1, d);
      cells.push({
        date: d,
        dateKey: formatDateKey(nextDateObj),
        isCurrentMonth: false,
        isPast: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, todayKey, selectedDate, offDays, bookedSlotsByDate, timeSlots]);

  // Handle day click
  const handleDayClick = (cell) => {
    if (!cell.isCurrentMonth || cell.isPast || cell.isOffDay || cell.isFullyBooked) {
      return;
    }
    // Retain selected time or reset if the slot is already taken on new date
    const bookedOnThisDay = bookedSlotsByDate[cell.dateKey] || new Set();
    let nextTime = selectedTime;
    if (selectedTime && bookedOnThisDay.has(selectedTime)) {
      nextTime = ''; // Slot occupied on this day
    }
    onSelectDateTime?.({ date: cell.dateKey, timeSlot: nextTime, source: 'date' });
  };

  // Time slots for currently selected date
  const selectedDateBookedSlots = useMemo(() => {
    if (!selectedDate) return new Set();
    return bookedSlotsByDate[selectedDate] || new Set();
  }, [selectedDate, bookedSlotsByDate]);

  const handleTimeClick = (slot) => {
    if (!selectedDate) return;
    if (selectedDateBookedSlots.has(slot)) return; // Appointed slot is disabled
    onSelectDateTime?.({ date: selectedDate, timeSlot: slot, source: 'time' });
  };

  // Formatted human-readable date display
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return null;
    const parsed = parseDateKey(selectedDate);
    if (!parsed) return selectedDate;
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate]);

  return (
    <div className={`mp-cal-container ${compact ? 'compact' : ''} ${className}`}>
      {/* Calendar Glow Ambient */}
      <div className="mp-cal-glow" />

      {/* Main Grid Card */}
      <div className="mp-cal-card">
        {/* Header: Month / Year + Navigation */}
        <div className="mp-cal-header">
          <div className="mp-cal-title-wrap">
            <span className="mp-cal-month-name">{MONTH_NAMES[viewMonth]}</span>
            <span className="mp-cal-year-num">{viewYear}</span>
            {isLoadingAppts && (
              <span className="mp-cal-sync-pill" title="Syncing schedule...">
                <span className="mp-cal-sync-dot" />
              </span>
            )}
          </div>

          <div className="mp-cal-nav-btns">
            <button
              type="button"
              className="mp-cal-today-btn"
              onClick={handleJumpToday}
              title="Jump to today"
            >
              Today
            </button>
            <button
              type="button"
              className="mp-cal-arrow-btn"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              title="Previous Month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="mp-cal-arrow-btn"
              onClick={handleNextMonth}
              aria-label="Next Month"
              title="Next Month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Weekdays Row */}
        <div className="mp-cal-weekdays">
          {WEEKDAY_NAMES.map((name) => (
            <div key={name} className="mp-cal-weekday">
              {name}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="mp-cal-grid">
          {calendarCells.map((cell, idx) => {
            const isDisabled =
              !cell.isCurrentMonth ||
              cell.isPast ||
              cell.isOffDay ||
              cell.isFullyBooked;

            let cellClass = 'mp-cal-day-cell';
            if (!cell.isCurrentMonth) cellClass += ' other-month';
            if (cell.isPast) cellClass += ' past';
            if (cell.isToday) cellClass += ' today';
            if (cell.isSelected) cellClass += ' selected';
            if (cell.isOffDay) cellClass += ' off-day';
            if (cell.isFullyBooked) cellClass += ' fully-booked';
            else if (cell.hasBookings) cellClass += ' has-bookings';

            return (
              <button
                key={`${cell.dateKey}-${idx}`}
                type="button"
                className={cellClass}
                disabled={isDisabled}
                onClick={() => handleDayClick(cell)}
                title={
                  cell.isPast
                    ? 'Past date cannot be selected'
                    : cell.isOffDay
                    ? `Closed on ${offDays}`
                    : cell.isFullyBooked
                    ? 'Fully booked date - Please pick another day'
                    : cell.hasBookings
                    ? `${cell.bookedCount} appointment(s) booked`
                    : `Available - ${cell.dateKey}`
                }
              >
                <span className="mp-cal-day-num">{cell.date}</span>

                {/* Status indicator badges */}
                {cell.isCurrentMonth && !cell.isPast && (
                  <div className="mp-cal-cell-indicators">
                    {cell.isFullyBooked ? (
                      <span className="mp-cal-indicator-booked" title="Booked">
                        Booked
                      </span>
                    ) : cell.isOffDay ? (
                      <span className="mp-cal-indicator-closed" title="Closed">
                        Closed
                      </span>
                    ) : cell.hasBookings ? (
                      <span className="mp-cal-indicator-busy-dot" title={`${cell.bookedCount} booked`} />
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mp-cal-legend">
          <div className="mp-cal-legend-item">
            <span className="mp-cal-legend-dot available" />
            <span>Available</span>
          </div>
          <div className="mp-cal-legend-item">
            <span className="mp-cal-legend-dot booked" />
            <span>Appointed / Booked</span>
          </div>
          <div className="mp-cal-legend-item">
            <span className="mp-cal-legend-dot selected" />
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Time Slots Selection Panel */}
      <div className="mp-cal-times-card">
        <div className="mp-cal-times-header">
          <div className="mp-cal-times-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="mp-cal-times-title">Select Meeting Time</span>
          </div>
          {selectedDate && (
            <span className="mp-cal-selected-date-badge">
              {selectedDateFormatted}
            </span>
          )}
        </div>

        {!selectedDate ? (
          <div className="mp-cal-no-date-hint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>Please select a date on the calendar to see available meeting slots.</p>
          </div>
        ) : (
          <div className="mp-cal-slots-wrapper">
            <span className="mp-cal-slots-subhead">
              Available 1-Hour Slots (Sri Lanka Standard Time)
            </span>

            <div className="mp-cal-slots-grid">
              {timeSlots.map((slot) => {
                const isBooked = selectedDateBookedSlots.has(slot);
                const isSlotSelected = selectedTime === slot;

                let slotClass = 'mp-cal-slot-btn';
                if (isBooked) slotClass += ' is-booked';
                if (isSlotSelected) slotClass += ' is-selected';

                return (
                  <button
                    key={slot}
                    type="button"
                    className={slotClass}
                    disabled={isBooked}
                    onClick={() => handleTimeClick(slot)}
                    title={
                      isBooked
                        ? `This slot (${slot}) is already booked by another client.`
                        : `Select ${slot} for meeting`
                    }
                  >
                    <span className="mp-cal-slot-time">{slot}</span>
                    {isBooked ? (
                      <span className="mp-cal-slot-status booked">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Booked</span>
                      </span>
                    ) : isSlotSelected ? (
                      <span className="mp-cal-slot-status selected">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Picked</span>
                      </span>
                    ) : (
                      <span className="mp-cal-slot-status open">Open</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Summary Card */}
            {selectedDate && selectedTime ? (
              <div className="mp-cal-summary-card">
                <div className="mp-cal-summary-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="mp-cal-summary-info">
                  <span className="mp-cal-summary-label">Selected Appointment</span>
                  <span className="mp-cal-summary-val">
                    {selectedDateFormatted} &bull; {selectedTime}
                  </span>
                </div>
              </div>
            ) : selectedDate && !selectedTime ? (
              <div className="mp-cal-pick-time-alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Please pick an available time slot above to confirm your meeting time.</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
