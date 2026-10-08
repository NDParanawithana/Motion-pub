import { useState, useEffect, useMemo, useCallback } from 'react';
import './messages.css';

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
    name: serviceType || 'General / Unspecified',
    icon: '✨',
    tagColor: '#fbbf24',
    tagBg: 'rgba(251, 191, 36, 0.15)',
    tagBorder: 'rgba(251, 191, 36, 0.35)'
  };
}

export default function MessagesDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [selectedService, setSelectedService] = useState('all');
  const [availableServices, setAvailableServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Fetch service options from backend
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
        console.warn('Could not load services for drawer:', err.message);
      }
    };
    fetchServices();
  }, []);

  // Fetch messages from backend
  const fetchMessages = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/contact/messages');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        const unread = data.data.filter(m => !m.read && m.status !== 'read').length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      } else {
        throw new Error(data.message || 'Failed to parse message list');
      }
    } catch (err) {
      console.error('Error fetching contact messages:', err);
      setError(err.message || 'Could not connect to messages endpoint');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onUnreadCountChange]);

  // Initial load and periodic poll
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Sync unread count whenever messages change
  useEffect(() => {
    const unread = messages.filter(m => !m.read && m.status !== 'read').length;
    if (onUnreadCountChange) onUnreadCountChange(unread);
  }, [messages, onUnreadCountChange]);

  // Close or exit fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullScreen) {
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
  }, [isOpen, isFullScreen, onClose]);

  // Toggle mark as read
  const handleToggleRead = async (message, e, forceRead = false) => {
    e?.stopPropagation();
    const isCurrentlyRead = Boolean(message.read || message.status === 'read');
    if (forceRead && isCurrentlyRead) return;

    const newRead = forceRead ? true : !isCurrentlyRead;

    // Optimistic update
    setMessages(prev =>
      prev.map(m => m._id === message._id ? { ...m, read: newRead, status: newRead ? 'read' : 'unread' } : m)
    );

    try {
      const res = await fetch(`/api/contact/messages/${message._id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: newRead })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      console.error('Error updating read status:', err);
      setMessages(prev =>
        prev.map(m => m._id === message._id ? { ...m, read: isCurrentlyRead, status: isCurrentlyRead ? 'read' : 'unread' } : m)
      );
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const prevMessages = [...messages];
    setMessages(prev =>
      prev.map(m => ({ ...m, read: true, status: 'read' }))
    );

    try {
      const res = await fetch('/api/contact/messages/read-all', {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
    } catch (err) {
      console.error('Error marking all read:', err);
      setMessages(prevMessages);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/contact/messages/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete message');
      setMessages(prev => prev.filter(m => m._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Could not delete message. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, label, e) => {
    e?.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Handle card click: toggle expansion and auto-mark as read
  const handleCardClick = (msg) => {
    const isCurrentlyExpanded = expandedId === msg._id;
    setExpandedId(isCurrentlyExpanded ? null : msg._id);
    if (!isCurrentlyExpanded && !msg.read && msg.status !== 'read') {
      handleToggleRead(msg, null, true);
    }
  };

  // Distinct service types list
  const allServiceTypes = useMemo(() => {
    const set = new Set();
    availableServices.forEach(s => s && set.add(s.trim()));
    messages.forEach(m => {
      const st = (m.serviceType || '').trim();
      if (st) set.add(st);
    });
    return Array.from(set);
  }, [availableServices, messages]);

  // Service count map
  const serviceCounts = useMemo(() => {
    const counts = {};
    messages.forEach(m => {
      const s = (m.serviceType || 'General / Unspecified').trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [messages]);

  // Filter & Search
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const isRead = Boolean(m.read || m.status === 'read');
      if (filter === 'unread' && isRead) return false;
      if (filter === 'read' && !isRead) return false;

      // Service filter
      if (selectedService !== 'all') {
        const mSvc = (m.serviceType || 'General / Unspecified').trim();
        if (mSvc !== selectedService) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (m.name || `${m.firstName || ''} ${m.lastName || ''}`).toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const service = (m.serviceType || '').toLowerCase();
      const msg = (m.message || '').toLowerCase();

      return name.includes(q) || email.includes(q) || phone.includes(q) || service.includes(q) || msg.includes(q);
    });
  }, [messages, filter, selectedService, searchQuery]);

  // Group filtered messages by service type
  const groupedByService = useMemo(() => {
    const groups = {};
    filteredMessages.forEach(msg => {
      const svc = (msg.serviceType || 'General / Unspecified').trim();
      if (!groups[svc]) groups[svc] = [];
      groups[svc].push(msg);
    });
    return groups;
  }, [filteredMessages]);

  const unreadCount = useMemo(() => {
    return messages.filter(m => !m.read && m.status !== 'read').length;
  }, [messages]);

  const toggleSectionCollapse = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (!isOpen) return null;

  // Render a single message card
  const renderMessageCard = (msg) => {
    const isRead = Boolean(msg.read || msg.status === 'read');
    const isExpanded = expandedId === msg._id;
    const senderName = msg.name || `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || 'Visitor';
    const avatarLetter = (senderName[0] || 'V').toUpperCase();
    const avatarStyle = getAvatarStyle(senderName);
    const serviceMeta = getServiceMeta(msg.serviceType);

    return (
      <article
        key={msg._id}
        className={`mp-msg-card ${!isRead ? 'unread' : 'read'} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => handleCardClick(msg)}
        title={isExpanded ? 'Click to collapse message' : 'Click to view full message'}
      >
        {/* Expanded Top Badge */}
        {isExpanded && (
          <div className="mp-msg-expanded-banner">
            <span className="mp-msg-expanded-tag">
              <span className="mp-msg-pulse-dot" />
              Full Message View
            </span>
            <span className="mp-msg-click-collapse-hint">
              Click anywhere to collapse ▲
            </span>
          </div>
        )}

        {/* Top Row: Sender Info & Status */}
        <div className="mp-msg-card-header">
          <div className="mp-msg-sender-group">
            <div
              className="mp-msg-avatar"
              style={{
                background: avatarStyle.bg,
                borderColor: avatarStyle.border,
                color: avatarStyle.text
              }}
            >
              {avatarLetter}
            </div>
            <div className="mp-msg-sender-meta">
              <div className="mp-msg-sender-name-row">
                <h4 className="mp-msg-sender-name">{senderName}</h4>
                {!isRead && (
                  <span className="mp-msg-new-badge">NEW</span>
                )}
                <span
                  className="mp-msg-service-tag"
                  style={{
                    color: serviceMeta.tagColor,
                    background: serviceMeta.tagBg,
                    borderColor: serviceMeta.tagBorder
                  }}
                  title={`Requested Service: ${serviceMeta.name}`}
                >
                  <span className="mp-msg-service-icon">{serviceMeta.icon}</span>
                  <span>{serviceMeta.name}</span>
                </span>
              </div>
              <span className="mp-msg-time" title={formatFullDateTime(msg.createdAt)}>
                {formatRelativeTime(msg.createdAt)}
              </span>
            </div>
          </div>

          <div className="mp-msg-card-header-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`mp-msg-status-toggle ${isRead ? 'is-read' : 'is-unread'}`}
              onClick={(e) => handleToggleRead(msg, e)}
              title={isRead ? 'Mark inquiry as unread' : 'Mark inquiry as read'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {isRead ? (
                  <circle cx="12" cy="12" r="10"></circle>
                ) : (
                  <polyline points="20 6 9 17 4 12"></polyline>
                )}
              </svg>
              <span>{isRead ? 'Mark Unread' : 'Mark Read'}</span>
            </button>

            <button
              type="button"
              className="mp-msg-btn-delete"
              onClick={(e) => handleDeleteMessage(msg._id, e)}
              disabled={deletingId === msg._id}
              title="Delete inquiry"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Sender Contact Info Chips */}
        <div className="mp-msg-contact-chips" onClick={(e) => e.stopPropagation()}>
          {msg.email && (
            <div className="mp-msg-chip chip-email">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <a
                href={`mailto:${msg.email}?subject=Regarding your inquiry for ${msg.serviceType || 'Motion Pub'}`}
                className="mp-msg-chip-link"
                title="Send email reply"
              >
                {msg.email}
              </a>
              <button
                type="button"
                className="mp-msg-chip-copy"
                onClick={(e) => handleCopy(msg.email, 'email', e)}
                title="Copy email address"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          )}

          {msg.phone && (
            <div className="mp-msg-chip chip-phone">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <a
                href={`tel:${msg.phone}`}
                className="mp-msg-chip-link"
                title="Call phone number"
              >
                {msg.phone}
              </a>
              <button
                type="button"
                className="mp-msg-chip-copy"
                onClick={(e) => handleCopy(msg.phone, 'phone', e)}
                title="Copy phone number"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Message Body: Full View or Collapsed Preview */}
        {isExpanded ? (
          /* FULL MESSAGE EXPANDED READER */
          <div className="mp-msg-full-reader">
            <div className="mp-msg-full-reader-header" onClick={(e) => e.stopPropagation()}>
              <div className="mp-msg-full-label-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="mp-msg-full-label">Full Message</span>
                <span className="mp-msg-full-char-count">
                  ({(msg.message || '').length} chars)
                </span>
              </div>
              <button
                type="button"
                className="mp-msg-btn-copy-full"
                onClick={(e) => handleCopy(msg.message, 'message text', e)}
                title="Copy entire message to clipboard"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Text</span>
              </button>
            </div>

            <div className="mp-msg-full-text-content">
              {msg.message || <span className="empty-italic">(No message content)</span>}
            </div>

            {/* Expanded Detailed Metadata Breakdown */}
            <div className="mp-msg-full-specs-grid" onClick={(e) => e.stopPropagation()}>
              <div className="mp-spec-item">
                <span className="spec-label">Service Type:</span>
                <span className="spec-val service">
                  {serviceMeta.icon} {serviceMeta.name}
                </span>
              </div>
              <div className="mp-spec-item">
                <span className="spec-label">Received At:</span>
                <span className="spec-val date">{formatFullDateTime(msg.createdAt)}</span>
              </div>
              {msg.phone && (
                <div className="mp-spec-item">
                  <span className="spec-label">Phone Contact:</span>
                  <span className="spec-val">{msg.phone}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* COLLAPSED MESSAGE PREVIEW */
          <div className="mp-msg-body">
            <p className="mp-msg-text clamped">
              {msg.message || '(Empty message)'}
            </p>
            <div className="mp-msg-click-hint">
              <span>Click to view full message</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>
          </div>
        )}

        {/* Bottom Metadata & Reply Bar */}
        <div className="mp-msg-footer" onClick={(e) => e.stopPropagation()}>
          <span className="mp-msg-footer-date">
            {formatFullDateTime(msg.createdAt)}
          </span>
          <div className="mp-msg-footer-actions">
            {isExpanded && (
              <button
                type="button"
                className="mp-msg-btn-collapse-footer"
                onClick={() => setExpandedId(null)}
                title="Collapse message"
              >
                <span>▲ Collapse</span>
              </button>
            )}
            {msg.email && (
              <a
                href={`mailto:${msg.email}?subject=Regarding your inquiry at Motion Pub`}
                className="mp-msg-reply-btn"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="9 17 4 12 9 7"></polyline>
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
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
    <div className={`mp-msg-drawer-overlay ${isFullScreen ? 'is-fullscreen' : ''}`} onClick={onClose}>
      <aside
        className={`mp-msg-drawer-panel ${isFullScreen ? 'full-screen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Contact Messages"
      >
        {/* Drawer Header */}
        <div className="mp-msg-drawer-header">
          <div className="mp-msg-header-title-wrap">
            <div className="mp-msg-header-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <div className="mp-msg-title-row">
                <h2 className="mp-msg-drawer-title">Customer Inquiries</h2>
                {unreadCount > 0 ? (
                  <span className="mp-msg-unread-pill">{unreadCount} Unread</span>
                ) : (
                  <span className="mp-msg-all-read-pill">All Read</span>
                )}
                {isFullScreen && (
                  <span className="mp-msg-fullscreen-indicator">Full Browser View</span>
                )}
              </div>
              <p className="mp-msg-drawer-subtitle">
                Inquiries organized by requested service type
              </p>
            </div>
          </div>

          <div className="mp-msg-header-actions">
            {/* Full Browser Size Toggle Icon Button */}
            <button
              type="button"
              className={`mp-msg-btn-action-icon ${isFullScreen ? 'active-fullscreen' : ''}`}
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
              className={`mp-msg-btn-action-icon ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchMessages(false)}
              title="Refresh messages"
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
              className="mp-msg-btn-close"
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

        {/* Toolbar: Search, Read Filter, & Service Filter Pills */}
        <div className="mp-msg-drawer-toolbar">
          <div className="mp-msg-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search sender, service type, email, phone, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mp-msg-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="mp-msg-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mp-msg-toolbar-bottom">
            <div className="mp-msg-filter-tabs">
              <button
                type="button"
                className={`mp-msg-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Status <span className="tab-count">{messages.length}</span>
              </button>
              <button
                type="button"
                className={`mp-msg-tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread {unreadCount > 0 && <span className="tab-count alert">{unreadCount}</span>}
              </button>
              <button
                type="button"
                className={`mp-msg-tab ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read <span className="tab-count">{messages.length - unreadCount}</span>
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mp-msg-mark-all-btn"
                onClick={handleMarkAllRead}
                title="Mark all messages as read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Service Types Filter Pills Bar */}
          <div className="mp-msg-service-filter-bar">
            <span className="mp-msg-service-bar-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Filter by Service:
            </span>
            <div className="mp-msg-service-pills-scroll">
              <button
                type="button"
                className={`mp-msg-service-pill ${selectedService === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedService('all')}
              >
                <span>All Services</span>
                <span className="pill-count">{messages.length}</span>
              </button>
              {allServiceTypes.map((svcName) => {
                const count = serviceCounts[svcName] || 0;
                const meta = getServiceMeta(svcName);
                return (
                  <button
                    key={svcName}
                    type="button"
                    className={`mp-msg-service-pill ${selectedService === svcName ? 'active' : ''}`}
                    onClick={() => setSelectedService(svcName)}
                  >
                    <span className="pill-icon">{meta.icon}</span>
                    <span>{svcName}</span>
                    <span className="pill-count">{count}</span>
                  </button>
                );
              })}
              {serviceCounts['General / Unspecified'] > 0 && !allServiceTypes.includes('General / Unspecified') && (
                <button
                  type="button"
                  className={`mp-msg-service-pill ${selectedService === 'General / Unspecified' ? 'active' : ''}`}
                  onClick={() => setSelectedService('General / Unspecified')}
                >
                  <span className="pill-icon">✨</span>
                  <span>General</span>
                  <span className="pill-count">{serviceCounts['General / Unspecified']}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Copy Toast feedback */}
        {copyFeedback && (
          <div className="mp-msg-copy-toast">
            <span>✓ Copied {copyFeedback} to clipboard</span>
          </div>
        )}

        {/* Message Content List / Grid */}
        <div className={`mp-msg-list-container ${isFullScreen ? 'is-grid' : ''}`}>
          {loading ? (
            <div className="mp-msg-loading-state">
              <div className="mp-msg-spinner" />
              <p>Loading inquiries from MongoDB...</p>
            </div>
          ) : error ? (
            <div className="mp-msg-error-state">
              <span className="mp-msg-error-icon">⚠️</span>
              <h4>Unable to load messages</h4>
              <p>{error}</p>
              <button
                type="button"
                className="mp-msg-btn-retry"
                onClick={() => fetchMessages(false)}
              >
                Retry
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="mp-msg-empty-state">
              <div className="mp-msg-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>No messages found</h3>
              <p>
                {searchQuery
                  ? `No messages matched "${searchQuery}".`
                  : selectedService !== 'all'
                  ? `No inquiries found for "${selectedService}".`
                  : filter === 'unread'
                  ? 'All inquiries have been marked as read!'
                  : 'Visitors who submit the Contact form will appear here.'}
              </p>
              {(searchQuery || selectedService !== 'all' || filter !== 'all') && (
                <button
                  type="button"
                  className="mp-msg-btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedService('all');
                    setFilter('all');
                  }}
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : selectedService === 'all' ? (
            /* GROUPED BY SERVICE TYPES VIEW */
            <div className="mp-msg-service-groups-wrap">
              {Object.entries(groupedByService).map(([svcName, svcMsgs]) => {
                const meta = getServiceMeta(svcName);
                const isSectionCollapsed = Boolean(collapsedSections[svcName]);
                return (
                  <section key={svcName} className="mp-msg-service-section">
                    <div
                      className="mp-msg-service-section-header"
                      onClick={() => toggleSectionCollapse(svcName)}
                      title="Click to toggle section"
                    >
                      <div className="mp-msg-service-section-left">
                        <span className="mp-msg-service-section-icon">{meta.icon}</span>
                        <h3 className="mp-msg-service-section-title">{svcName}</h3>
                        <span className="mp-msg-service-section-badge">
                          {svcMsgs.length} {svcMsgs.length === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mp-msg-service-section-toggle-btn"
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
                      <div className={`mp-msg-cards ${isFullScreen ? 'grid-layout' : ''}`}>
                        {svcMsgs.map((msg) => renderMessageCard(msg))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            /* SINGLE SERVICE FILTER VIEW */
            <div className="mp-msg-service-single-wrap">
              <div className="mp-msg-service-single-banner">
                <div className="mp-msg-service-single-left">
                  <span className="mp-single-svc-icon">{getServiceMeta(selectedService).icon}</span>
                  <div>
                    <h3 className="mp-single-svc-title">{selectedService}</h3>
                    <span className="mp-single-svc-sub">
                      Showing {filteredMessages.length} {filteredMessages.length === 1 ? 'inquiry' : 'inquiries'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mp-btn-view-all-services"
                  onClick={() => setSelectedService('all')}
                >
                  View All Services
                </button>
              </div>

              <div className={`mp-msg-cards ${isFullScreen ? 'grid-layout' : ''}`}>
                {filteredMessages.map((msg) => renderMessageCard(msg))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
