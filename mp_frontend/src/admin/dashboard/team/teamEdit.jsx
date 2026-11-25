import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import TeamImageCard from '../../../components/teamImageCard/teamImageCard';
import ConfirmMessage from '../../../components/confirmMessage/confirmMessage';
import './teamEdit.css';

const EMPTY_FORM = {
    name: '',
    role: '',
    image: '',
    imagePublicId: null,
    socials: {
        facebook: '',
        linkedin: '',
        x: '',
        instagram: '',
    },
};

const syncTeamCache = (members) => {
    try {
        localStorage.setItem('mp_team_members', JSON.stringify(members));
    } catch {
        // ignore storage quota issues
    }
    window.dispatchEvent(
        new CustomEvent('mp-team-updated', { detail: { members } })
    );
};

export default function TeamEdit() {
    const fileInputRef = useRef(null);

    const [members, setMembers] = useState(() => {
        try {
            const cached = localStorage.getItem('mp_team_members');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // null = add mode, string = edit mode
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [pendingDeleteMember, setPendingDeleteMember] = useState(null);
    const [alert, setAlert] = useState(null);
    const [modalAlert, setModalAlert] = useState(null);

    // Fetch team members from MongoDB backend
    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/content/team');
            const data = await res.json();
            if (res.ok && data?.success && Array.isArray(data.data)) {
                setMembers(data.data);
                syncTeamCache(data.data);
            }
        } catch (err) {
            console.warn('Could not load team members:', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Close full-screen modal on Escape & lock background scroll
    useEffect(() => {
        if (!isModalOpen) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSaving && !isUploadingImage) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, isSaving, isUploadingImage]);

    // Open full-screen modal to add a new member
    const handleOpenAddModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalAlert(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsModalOpen(true);
    };

    // Open full-screen modal to edit an existing member
    const handleOpenEditModal = (member) => {
        setEditingId(member.id || member._id);
        setForm({
            name: member.name || '',
            role: member.role || '',
            image: member.image || '',
            imagePublicId: member.imagePublicId || null,
            socials: {
                facebook: member.socials?.facebook || '',
                linkedin: member.socials?.linkedin || '',
                x: member.socials?.x || '',
                instagram: member.socials?.instagram || '',
            },
        });
        setModalAlert(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving || isUploadingImage) return;
        setIsModalOpen(false);
        setModalAlert(null);
    };

    const handleFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (platform, value) => {
        setForm((prev) => ({
            ...prev,
            socials: {
                ...prev.socials,
                [platform]: value,
            },
        }));
    };

    // Upload portrait image to Cloudinary
    const uploadPortraitFile = async (file) => {
        if (!file) return;

        const isImage =
            file.type?.startsWith('image/') ||
            /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name);

        if (!isImage) {
            setModalAlert({
                type: 'error',
                message: 'Invalid file format. Please select a JPG, PNG, WebP, or AVIF image.',
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setModalAlert({
                type: 'error',
                message: 'Portrait image exceeds the 10MB limit. Please choose a smaller image.',
            });
            return;
        }

        setIsUploadingImage(true);
        setModalAlert(null);

        try {
            const fd = new FormData();
            fd.append('image', file);

            const res = await fetch('/api/content/team/upload-image', {
                method: 'POST',
                body: fd,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to upload image.');
            }

            setForm((prev) => ({
                ...prev,
                image: data.imageUrl,
                imagePublicId: data.imagePublicId || null,
            }));

            setModalAlert({
                type: 'success',
                message: 'Portrait uploaded! Click Save to publish changes.',
            });
        } catch (err) {
            console.error('Team portrait upload error:', err);
            setModalAlert({
                type: 'error',
                message: err.message || 'Failed to upload portrait image.',
            });
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) uploadPortraitFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadPortraitFile(file);
    };

    const handleRemoveImage = () => {
        setForm((prev) => ({
            ...prev,
            image: '',
            imagePublicId: null,
        }));
    };

    // Save (Create or Update) Team Member
    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedName = form.name.trim();
        const trimmedRole = form.role.trim();

        if (!trimmedName) {
            setModalAlert({ type: 'error', message: 'Please enter the team member’s name.' });
            return;
        }
        if (!trimmedRole) {
            setModalAlert({ type: 'error', message: 'Please enter the team member’s role.' });
            return;
        }

        setIsSaving(true);
        setModalAlert(null);

        const payload = {
            name: trimmedName,
            role: trimmedRole,
            image: form.image.trim(),
            imagePublicId: form.imagePublicId || null,
            socials: {
                facebook: form.socials.facebook.trim(),
                linkedin: form.socials.linkedin.trim(),
                x: form.socials.x.trim(),
                instagram: form.socials.instagram.trim(),
            },
        };

        try {
            const isEditing = Boolean(editingId);
            const url = isEditing
                ? `/api/content/team/${editingId}`
                : '/api/content/team';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to save team member.');
            }

            const savedMember = data.data;
            const updatedList = isEditing
                ? members.map((m) => ((m.id || m._id) === editingId ? savedMember : m))
                : [...members, savedMember];

            setMembers(updatedList);
            syncTeamCache(updatedList);

            setIsModalOpen(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            setModalAlert(null);

            setAlert({
                type: 'success',
                message:
                    data.message ||
                    (isEditing
                        ? `${savedMember.name} updated successfully!`
                        : `${savedMember.name} added to the team!`),
            });
        } catch (err) {
            console.error('Save team member error:', err);
            setModalAlert({
                type: 'error',
                message: err.message || 'Could not save team member.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Prompt custom confirmation modal before deleting a team member
    const handleDeleteMember = (member) => {
        setPendingDeleteMember(member);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDeleteMember) return;
        const member = pendingDeleteMember;
        const id = member.id || member._id;

        setDeletingId(id);
        setAlert(null);

        try {
            const res = await fetch(`/api/content/team/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to remove team member.');
            }

            const updatedList = members.filter((m) => (m.id || m._id) !== id);
            setMembers(updatedList);
            syncTeamCache(updatedList);
            setPendingDeleteMember(null);

            setAlert({
                type: 'success',
                message: `${member.name} has been removed from the team.`,
            });
        } catch (err) {
            setPendingDeleteMember(null);
            setAlert({
                type: 'error',
                message: err.message || 'Failed to delete team member.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    // Move member up or down in display order
    const handleMoveMember = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= members.length) return;

        const nextList = [...members];
        const [moved] = nextList.splice(index, 1);
        nextList.splice(targetIndex, 0, moved);

        setMembers(nextList);
        syncTeamCache(nextList);

        try {
            const orderedIds = nextList.map((m) => m.id || m._id);
            const res = await fetch('/api/content/team/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds }),
            });
            const data = await res.json();
            if (res.ok && data?.success && Array.isArray(data.data)) {
                setMembers(data.data);
                syncTeamCache(data.data);
            }
        } catch (err) {
            console.warn('Reorder sync notice:', err.message);
        }
    };

    const countActiveSocials = (socials = {}) =>
        Object.values(socials).filter((val) => typeof val === 'string' && val.trim().length > 0).length;

    return (
        <div className="mp-team-edit-page">
            {/* Page Alert Banner */}
            {alert && (
                <div className={`mp-alert-banner ${alert.type}`}>
                    <div className="mp-alert-left">
                        {alert.type === 'success' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                        <span>{alert.message}</span>
                    </div>
                    <button
                        type="button"
                        className="mp-alert-close"
                        onClick={() => setAlert(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="mp-team-edit-header">
                <div>
                    <h2 className="mp-page-title">Team Members</h2>
                    <p className="mp-page-desc">
                        Manage team members, portraits, display order, and social media links shown on the Team page.
                    </p>
                </div>

                <div className="mp-team-header-actions">
                    <span className="mp-team-count-pill">
                        <span className="mp-team-count-dot" />
                        {members.length} {members.length === 1 ? 'Member' : 'Members'}
                    </span>
                    <button
                        type="button"
                        className="mp-btn-add-member"
                        onClick={handleOpenAddModal}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>Add New Member</span>
                    </button>
                </div>
            </div>

            {/* Full-Width Member Roster List */}
            <div className="mp-card mp-team-roster-card">
                <div className="mp-card-header">
                    <div className="mp-card-title-group">
                        <span className="mp-card-title">Current Team Roster</span>
                    </div>
                    <span className="mp-team-roster-hint">
                        Use arrows to reorder, or press Edit to open the full-screen editor
                    </span>
                </div>

                {isLoading && members.length === 0 ? (
                    <div className="mp-team-empty-state">
                        <span className="mp-team-loader" />
                        <p>Loading team members...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="mp-team-empty-state">
                        <p>No team members yet.</p>
                        <span>Click &ldquo;Add New Member&rdquo; above to create your first profile.</span>
                    </div>
                ) : (
                    <div className="mp-team-member-list">
                        {members.map((member, index) => {
                            const id = member.id || member._id;
                            const socialCount = countActiveSocials(member.socials);
                            const initials = (member.name || '?')
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p) => p[0].toUpperCase())
                                .join('');

                            return (
                                <div key={id} className="mp-team-member-row">
                                    <div className="mp-team-row-left">
                                        <span className="mp-team-order-num">#{index + 1}</span>

                                        <div className="mp-team-row-avatar">
                                            {member.image ? (
                                                <img src={member.image} alt={member.name} />
                                            ) : (
                                                <span>{initials}</span>
                                            )}
                                        </div>

                                        <div className="mp-team-row-info">
                                            <h4 className="mp-team-row-name">{member.name}</h4>
                                            <p className="mp-team-row-role">{member.role}</p>
                                            <div className="mp-team-row-socials">
                                                {member.socials?.facebook && <span className="mp-social-chip">Facebook</span>}
                                                {member.socials?.linkedin && <span className="mp-social-chip">LinkedIn</span>}
                                                {member.socials?.x && <span className="mp-social-chip">X</span>}
                                                {member.socials?.instagram && <span className="mp-social-chip">Instagram</span>}
                                                {socialCount === 0 && (
                                                    <span className="mp-social-chip muted">No socials</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mp-team-row-actions">
                                        <button
                                            type="button"
                                            className="mp-team-icon-action"
                                            onClick={() => handleMoveMember(index, -1)}
                                            disabled={index === 0}
                                            title="Move up"
                                            aria-label={`Move ${member.name} up`}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            className="mp-team-icon-action"
                                            onClick={() => handleMoveMember(index, 1)}
                                            disabled={index === members.length - 1}
                                            title="Move down"
                                            aria-label={`Move ${member.name} down`}
                                        >
                                            ↓
                                        </button>
                                        <button
                                            type="button"
                                            className="mp-team-edit-btn"
                                            onClick={() => handleOpenEditModal(member)}
                                            title={`Edit ${member.name}`}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="mp-team-icon-action delete"
                                            onClick={() => handleDeleteMember(member)}
                                            disabled={deletingId === id}
                                            title="Delete member"
                                            aria-label={`Delete ${member.name}`}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reusable Custom Delete Confirmation Modal */}
            <ConfirmMessage
                isOpen={Boolean(pendingDeleteMember)}
                variant="danger"
                title="Remove Team Member?"
                message="This will permanently delete their profile and portrait from your live Team page."
                highlightItem={
                    pendingDeleteMember
                        ? {
                            name: pendingDeleteMember.name,
                            subtitle: pendingDeleteMember.role,
                            image: pendingDeleteMember.image,
                        }
                        : null
                }
                confirmText="Yes, Remove"
                cancelText="Keep Member"
                isLoading={Boolean(deletingId)}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!deletingId) setPendingDeleteMember(null);
                }}
            />

            {/* FULL-SCREEN POPUP MODAL (Portaled to document.body to stay above sidebar) */}
            {isModalOpen && createPortal(
                <div
                    className="mp-team-fullscreen-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingId ? 'Edit Team Member' : 'Add New Team Member'}
                >
                    <div className="mp-team-fullscreen-shell">
                        {/* Sticky Modal Top Bar */}
                        <div className="mp-team-modal-topbar">
                            <div className="mp-team-modal-title-wrap">
                                <span className="mp-team-modal-accent-bar" aria-hidden="true" />
                                <div className="mp-team-modal-title-stack">
                                    <span className="mp-team-modal-kicker">
                                        {editingId ? 'Editing Member' : 'Team Roster'}
                                    </span>
                                    <h3 className="mp-team-modal-heading">
                                        {editingId ? (
                                            <>
                                                <span>{form.name.trim() || 'Untitled Member'}</span>
                                                {form.role.trim() && (
                                                    <span className="mp-team-modal-role-inline">
                                                        {form.role.trim()}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                Add New{' '}
                                                <span className="mp-team-modal-heading-accent">
                                                    Team Member
                                                </span>
                                            </>
                                        )}
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mp-team-modal-close-btn"
                                onClick={handleCloseModal}
                                disabled={isSaving || isUploadingImage}
                                aria-label="Close editor"
                            >
                                <span>Close</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <div className="mp-team-modal-body">
                            {modalAlert && (
                                <div className={`mp-alert-banner ${modalAlert.type} mp-team-modal-alert`}>
                                    <div className="mp-alert-left">
                                        <span>{modalAlert.message}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="mp-alert-close"
                                        onClick={() => setModalAlert(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <div className="mp-team-modal-grid">
                                {/* Left Column: Live Spotlight Card Preview */}
                                <div className="mp-team-modal-preview-col">
                                    <div className="mp-team-live-preview-box">
                                        <span className="mp-team-preview-label">Live Spotlight Card Preview</span>
                                        <div className="mp-team-preview-stage">
                                            <TeamImageCard
                                                name={form.name.trim() || 'Member Name'}
                                                role={form.role.trim() || 'Role / Position'}
                                                image={form.image}
                                                socials={form.socials}
                                                isActive={true}
                                                position={0}
                                            />
                                        </div>
                                        <p className="mp-team-preview-caption">
                                            Preview updates in real time as you change the portrait, name, role, or social links.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Form */}
                                <div className="mp-team-modal-form-col">
                                    <form onSubmit={handleSubmit} className="mp-team-form">
                                        {/* Portrait Upload & URL */}
                                        <div className="mp-field-group">
                                            <div className="mp-field-label-row">
                                                <label className="mp-field-label">Portrait Image</label>
                                                {form.image && (
                                                    <button
                                                        type="button"
                                                        className="mp-team-remove-img-btn"
                                                        onClick={handleRemoveImage}
                                                    >
                                                        Remove Image
                                                    </button>
                                                )}
                                            </div>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                                                style={{ display: 'none' }}
                                                onChange={handleFileChange}
                                            />

                                            <div
                                                className={`mp-team-dropzone ${isDragging ? 'dragging' : ''}`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                }}
                                                onDrop={handleDrop}
                                                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                                            >
                                                {isUploadingImage ? (
                                                    <div className="mp-team-dropzone-uploading">
                                                        <span className="mp-team-loader small" />
                                                        <span>Uploading portrait...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="17 8 12 3 7 8"></polyline>
                                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                                        </svg>
                                                        <div>
                                                            <strong>{form.image ? 'Change Portrait Photo' : 'Upload Portrait Photo'}</strong>
                                                            <span>Drag &amp; drop or click • JPG, PNG, WebP (max 10MB)</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <input
                                                type="url"
                                                className="mp-team-input mp-team-url-input"
                                                value={form.image}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        image: e.target.value,
                                                        imagePublicId: null,
                                                    }))
                                                }
                                                placeholder="Or paste direct image URL (https://...)"
                                            />
                                        </div>

                                        {/* Name & Role */}
                                        <div className="mp-team-two-col">
                                            <div className="mp-field-group">
                                                <label htmlFor="team-member-name" className="mp-field-label">
                                                    Full Name *
                                                </label>
                                                <input
                                                    id="team-member-name"
                                                    type="text"
                                                    className="mp-team-input"
                                                    value={form.name}
                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                    placeholder="e.g. Taylor Jones"
                                                    required
                                                />
                                            </div>

                                            <div className="mp-field-group">
                                                <label htmlFor="team-member-role" className="mp-field-label">
                                                    Role / Title *
                                                </label>
                                                <input
                                                    id="team-member-role"
                                                    type="text"
                                                    className="mp-team-input"
                                                    value={form.role}
                                                    onChange={(e) => handleFieldChange('role', e.target.value)}
                                                    placeholder="e.g. Founder of Motion Pub"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Social Media Links */}
                                        <div className="mp-team-socials-section">
                                            <div className="mp-field-label-row">
                                                <span className="mp-field-label">Social Media Links</span>
                                                <span className="mp-char-count">Leave blank to hide icon</span>
                                            </div>

                                            <div className="mp-team-socials-grid">
                                                <div className="mp-team-social-input-wrap">
                                                    <span className="mp-social-prefix" title="Facebook">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="mp-team-social-input"
                                                        value={form.socials.facebook}
                                                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                                        placeholder="Facebook URL"
                                                    />
                                                </div>

                                                <div className="mp-team-social-input-wrap">
                                                    <span className="mp-social-prefix" title="LinkedIn">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="mp-team-social-input"
                                                        value={form.socials.linkedin}
                                                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                                        placeholder="LinkedIn URL"
                                                    />
                                                </div>

                                                <div className="mp-team-social-input-wrap">
                                                    <span className="mp-social-prefix" title="X (Twitter)">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="mp-team-social-input"
                                                        value={form.socials.x}
                                                        onChange={(e) => handleSocialChange('x', e.target.value)}
                                                        placeholder="X (Twitter) URL"
                                                    />
                                                </div>

                                                <div className="mp-team-social-input-wrap">
                                                    <span className="mp-social-prefix" title="Instagram">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="mp-team-social-input"
                                                        value={form.socials.instagram}
                                                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                                        placeholder="Instagram URL"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Actions */}
                                        <div className="mp-team-form-actions">
                                            <button
                                                type="submit"
                                                className="mp-btn-save-member"
                                                disabled={isSaving || isUploadingImage}
                                            >
                                                {isSaving
                                                    ? 'Saving...'
                                                    : editingId
                                                        ? 'Save Member Changes'
                                                        : 'Add Team Member'}
                                            </button>

                                            <button
                                                type="button"
                                                className="mp-btn-reset-member"
                                                onClick={handleCloseModal}
                                                disabled={isSaving || isUploadingImage}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
