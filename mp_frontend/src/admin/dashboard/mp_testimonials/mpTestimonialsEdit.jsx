import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ConfirmMessage from '../../../components/confirmMessage/confirmMessage';
import AvatarCropper from '../../../components/avatarCropper/avatarCropper';
import './mpTestimonialsEdit.css';

const EMPTY_FORM = {
  name: '',
  tagline: '',
  quote: '',
  avatar: '',
  avatarPublicId: null,
  variant: 'tone-lime',
};

const VARIANT_OPTIONS = [
  { value: 'tone-lime', label: 'Soft Bright' },
  { value: 'tone-emerald', label: 'Balanced' },
  { value: 'tone-olive', label: 'Deep Matte' },
];

const MAX_QUOTE_CHARS = 450;

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'MP';
}

function QuoteGlyph({ flipped = false, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={flipped ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M10 7.5C7.6 8.6 6.2 10.6 6.1 13h3.4v6H3v-5.6C3 9.2 5.4 6.2 9.4 5l.6 2.5zm11 0c-2.4 1.1-3.8 3.1-3.9 5.5h3.4v6H14v-5.6c0-4.2 2.4-7.2 6.4-8.4l.6 2.5z" />
    </svg>
  );
}

function buildPreviewBubblePath(w, h, { r = 14, tailX = 48, tailW = 24, tailH = 13 } = {}) {
  const pad = 0.75;
  const left = pad;
  const top = pad;
  const right = Math.max(left + r * 2 + 2, w - pad);
  const bodyBottom = Math.max(top + r * 2 + 2, h - tailH - pad);
  const tipY = h - pad;
  const half = tailW / 2;
  const clampedTailX = Math.max(left + r + half + 4, Math.min(right - r - half - 4, tailX));
  const tLeft = clampedTailX - half;
  const tRight = clampedTailX + half;
  const tipCurve = 2.4;
  const f = (n) => n.toFixed(2);

  return [
    `M ${f(left + r)} ${f(top)}`,
    `L ${f(right - r)} ${f(top)}`,
    `A ${r} ${r} 0 0 1 ${f(right)} ${f(top + r)}`,
    `L ${f(right)} ${f(bodyBottom - r)}`,
    `A ${r} ${r} 0 0 1 ${f(right - r)} ${f(bodyBottom)}`,
    `L ${f(tRight)} ${f(bodyBottom)}`,
    `L ${f(clampedTailX + tipCurve)} ${f(tipY - tipCurve)}`,
    `Q ${f(clampedTailX)} ${f(tipY)} ${f(clampedTailX - tipCurve)} ${f(tipY - tipCurve)}`,
    `L ${f(tLeft)} ${f(bodyBottom)}`,
    `L ${f(left + r)} ${f(bodyBottom)}`,
    `A ${r} ${r} 0 0 1 ${f(left)} ${f(bodyBottom - r)}`,
    `L ${f(left)} ${f(top + r)}`,
    `A ${r} ${r} 0 0 1 ${f(left + r)} ${f(top)}`,
    'Z',
  ].join(' ');
}

function LiveTestimonialPreviewCard({ form }) {
  const bubbleRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [form.avatar]);

  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [form.quote]);

  const pathD = useMemo(() => {
    if (!size.w || !size.h) return '';
    return buildPreviewBubblePath(size.w, size.h, { r: 14, tailX: 46, tailW: 24, tailH: 13 });
  }, [size.w, size.h]);

  const displayName = form.name.trim() || 'Client Name';
  const displayTagline = form.tagline.trim() || 'Role, Company Name';
  const displayQuote =
    form.quote.trim() ||
    'Write the client testimonial quote here to see how it appears live on the Motion Pub Testimonials page.';

  return (
    <div className={`mp-testi-preview-card ${form.variant || 'tone-lime'}`}>
      <div ref={bubbleRef} className="mp-testi-preview-bubble">
        <div
          className="mp-testi-preview-bubble-glass"
          style={pathD ? { clipPath: `path('${pathD}')` } : undefined}
          aria-hidden="true"
        />
        {pathD && (
          <svg
            className="mp-testi-preview-bubble-outline"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            fill="none"
            aria-hidden="true"
          >
            <path d={pathD} stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
          </svg>
        )}

        <span className="mp-testi-preview-quote-badge open" aria-hidden="true">
          <QuoteGlyph size={15} />
        </span>
        <p className="mp-testi-preview-quote-text">{displayQuote}</p>
        <span className="mp-testi-preview-quote-badge close" aria-hidden="true">
          <QuoteGlyph flipped size={15} />
        </span>
      </div>

      <div className="mp-testi-preview-author">
        <div className="mp-testi-preview-avatar-ring">
          {form.avatar && !imgBroken ? (
            <img
              src={form.avatar}
              alt={displayName}
              className="mp-testi-preview-avatar-img"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <span className="mp-testi-preview-avatar-initials">{getInitials(displayName)}</span>
          )}
        </div>
        <div className="mp-testi-preview-author-meta">
          <strong className="mp-testi-preview-author-name">{displayName}</strong>
          <span className="mp-testi-preview-author-tagline">{displayTagline}</span>
        </div>
      </div>
    </div>
  );
}

const syncTestimonialsToClient = (list) => {
  try {
    localStorage.setItem('mp_testimonials', JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent('mp-testimonials-updated', { detail: { testimonials: list } })
    );
  } catch {
    // ignore storage errors
  }
};

export default function MpTestimonialsEdit() {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadThumbBroken, setUploadThumbBroken] = useState(false);
  const [cropSource, setCropSource] = useState(null); // { src, fileName, isObjectUrl }
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [brokenAvatars, setBrokenAvatars] = useState({});
  const [alert, setAlert] = useState(null);

  const fileInputRef = useRef(null);
  const alertTimerRef = useRef(null);

  const showAlert = useCallback((type, message) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert({ type, message });
    alertTimerRef.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  useEffect(() => {
    setUploadThumbBroken(false);
  }, [form.avatar]);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/content/testimonials');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setTestimonials(data.data);
        syncTestimonialsToClient(data.data);
      }
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      showAlert('error', 'Could not reach backend to load testimonials.');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const closeCropper = useCallback(() => {
    setCropSource((prev) => {
      if (prev?.isObjectUrl && prev.src) {
        URL.revokeObjectURL(prev.src);
      }
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const closeModal = useCallback(() => {
    if (isSaving || isUploading || cropSource) return;
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [isSaving, isUploading, cropSource]);

  // Close editor modal on Escape and lock body scroll while open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isModalOpen, closeModal]);

  const openAddModal = () => {
    const nextVariant = VARIANT_OPTIONS[testimonials.length % VARIANT_OPTIONS.length].value;
    setEditingId(null);
    setForm({ ...EMPTY_FORM, variant: nextVariant });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id || item._id);
    setForm({
      name: item.name || '',
      tagline: item.tagline || '',
      quote: item.quote || '',
      avatar: item.avatar || '',
      avatarPublicId: item.avatarPublicId || null,
      variant: item.variant || 'tone-lime',
    });
    setIsModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    if (field === 'quote' && value.length > MAX_QUOTE_CHARS) {
      value = value.slice(0, MAX_QUOTE_CHARS);
    }
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'avatar' ? { avatarPublicId: null } : {}),
    }));
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      showAlert('error', 'Please select a valid image file (JPG, PNG, WebP, or AVIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('error', 'Avatar image must be smaller than 10MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSource((prev) => {
      if (prev?.isObjectUrl && prev.src) URL.revokeObjectURL(prev.src);
      return { src: objectUrl, fileName: file.name, isObjectUrl: true };
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCropExisting = () => {
    if (!form.avatar) return;
    setCropSource({
      src: form.avatar,
      fileName: `${(form.name || 'avatar').toLowerCase().replace(/\s+/g, '-')}.jpg`,
      isObjectUrl: false,
    });
  };

  const uploadCroppedAvatar = async (croppedFile) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', croppedFile);

      const res = await fetch('/api/content/testimonials/upload-image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Avatar upload failed.');
      }

      setForm((prev) => ({
        ...prev,
        avatar: data.imageUrl,
        avatarPublicId: data.imagePublicId || null,
      }));
      closeCropper();
      showAlert('success', 'Cropped client avatar uploaded!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showAlert('error', err.message || 'Failed to upload client avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showAlert('error', 'Client name is required.');
      return;
    }
    if (!form.tagline.trim()) {
      showAlert('error', 'Client role / company tagline is required.');
      return;
    }
    if (!form.quote.trim()) {
      showAlert('error', 'Testimonial quote is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        quote: form.quote.trim(),
        avatar: form.avatar.trim(),
        avatarPublicId: form.avatarPublicId,
        variant: form.variant,
      };

      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `/api/content/testimonials/${editingId}`
        : '/api/content/testimonials';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save testimonial.');
      }

      const updatedList = isEdit
        ? testimonials.map((t) => ((t.id || t._id) === editingId ? data.data : t))
        : [...testimonials, data.data];

      setTestimonials(updatedList);
      syncTestimonialsToClient(updatedList);
      setIsModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      showAlert(
        'success',
        data.message || (isEdit ? 'Testimonial updated!' : 'Testimonial added!')
      );
    } catch (err) {
      console.error('Save testimonial error:', err);
      showAlert('error', err.message || 'Could not save testimonial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    const id = deletingTarget.id || deletingTarget._id;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/content/testimonials/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete testimonial.');
      }

      const updatedList = testimonials.filter((t) => (t.id || t._id) !== id);
      setTestimonials(updatedList);
      syncTestimonialsToClient(updatedList);
      setDeletingTarget(null);
      showAlert('success', `Removed testimonial from ${deletingTarget.name}.`);
    } catch (err) {
      console.error('Delete testimonial error:', err);
      showAlert('error', err.message || 'Could not delete testimonial.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= testimonials.length) return;

    const currentItem = testimonials[index];
    const currentId = currentItem.id || currentItem._id;
    const reordered = [...testimonials];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistic UI update
    setTestimonials(reordered);
    setReorderingId(currentId);

    try {
      const orderedIds = reordered.map((item) => item.id || item._id);
      const res = await fetch('/api/content/testimonials/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reorder testimonials.');
      }
      if (Array.isArray(data.data)) {
        setTestimonials(data.data);
        syncTestimonialsToClient(data.data);
      } else {
        syncTestimonialsToClient(reordered);
      }
    } catch (err) {
      console.error('Reorder error:', err);
      showAlert('error', err.message || 'Could not save testimonial order.');
      fetchTestimonials();
    } finally {
      setReorderingId(null);
    }
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="mp-testi-edit-page">
      {/* Page Header */}
      <div className="mp-testi-edit-header">
        <div className="mp-page-header">
          <h2 className="mp-page-title">Testimonials</h2>
          <p className="mp-page-desc">
            Add, edit, reorder, or remove client testimonials shown on the User Testimonials page.
          </p>
        </div>

        <div className="mp-testi-header-actions">
          <span className="mp-testi-count-pill">
            <span className="mp-testi-count-dot" />
            {testimonials.length} {testimonials.length === 1 ? 'Testimonial' : 'Testimonials'}
          </span>

          <button type="button" className="mp-btn-add-testi" onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {alert && (
        <div className={`mp-alert-banner ${alert.type}`}>
          <div className="mp-alert-left">
            <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            className="mp-alert-close"
            onClick={() => setAlert(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Published Testimonials List Card (Internal Scroll) */}
      <div className="mp-card mp-testi-roster-card">
        <div className="mp-card-header">
          <div className="mp-card-title-group">
            <h3 className="mp-card-title">Published Testimonials</h3>
          </div>
          <span className="mp-testi-roster-hint">
            Use arrows to reorder, or press Edit to open the full-screen editor
          </span>
        </div>

        <div className="mp-testi-edit-list">
          {isLoading ? (
            <div className="mp-testi-empty-state">
              <span className="mp-testi-spinner" />
              <p>Loading client testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="mp-testi-empty-state">
              <p className="mp-testi-empty-title">No testimonials yet</p>
              <p className="mp-testi-empty-desc">
                Click &ldquo;Add Testimonial&rdquo; above to showcase your first client story.
              </p>
              <button type="button" className="mp-btn-add-testi" onClick={openAddModal}>
                + Add First Testimonial
              </button>
            </div>
          ) : (
            testimonials.map((item, idx) => {
              const id = item.id || item._id;
              const avatarBroken = !item.avatar || brokenAvatars[id];
              return (
                <div key={id} className="mp-testi-row-item">
                  <span className="mp-testi-order-badge">#{idx + 1}</span>

                  <div className="mp-testi-row-avatar">
                    {avatarBroken ? (
                      <span className="mp-testi-row-initials">{getInitials(item.name)}</span>
                    ) : (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        onError={() => setBrokenAvatars((prev) => ({ ...prev, [id]: true }))}
                      />
                    )}
                  </div>

                  <div className="mp-testi-row-body">
                    <div className="mp-testi-row-meta">
                      <strong className="mp-testi-row-name">{item.name}</strong>
                      <span className="mp-testi-row-sep">·</span>
                      <span className="mp-testi-row-tagline">{item.tagline}</span>
                    </div>
                    <p className="mp-testi-row-quote">&ldquo;{item.quote}&rdquo;</p>
                  </div>

                  <div className="mp-testi-row-actions">
                    <button
                      type="button"
                      className="mp-testi-icon-btn"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0 || reorderingId !== null}
                      title="Move up"
                      aria-label={`Move ${item.name} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mp-testi-icon-btn"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === testimonials.length - 1 || reorderingId !== null}
                      title="Move down"
                      aria-label={`Move ${item.name} down`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="mp-testi-edit-btn"
                      onClick={() => openEditModal(item)}
                      title={`Edit testimonial from ${item.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="mp-testi-delete-btn"
                      onClick={() => setDeletingTarget(item)}
                      title={`Remove testimonial from ${item.name}`}
                      aria-label={`Remove testimonial from ${item.name}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full-Screen Portaled Add / Edit Studio Modal */}
      {isModalOpen &&
        createPortal(
          <div className="mp-testi-modal-backdrop" role="dialog" aria-modal="true">
            <div className="mp-testi-modal-shell">
              {/* Top Modal Bar */}
              <div className="mp-testi-modal-topbar">
                <div className="mp-testi-modal-heading-wrap">
                  <span className="mp-testi-modal-accent-bar" aria-hidden="true" />
                  <div className="mp-testi-modal-heading-text">
                    <span className="mp-testi-modal-kicker">
                      {isEditing ? 'Editing Testimonial' : 'New Testimonial'}
                    </span>
                    <div className="mp-testi-modal-title-row">
                      <h3 className="mp-testi-modal-title">
                        {isEditing ? form.name.trim() || 'Client Testimonial' : 'Add Client Testimonial'}
                      </h3>
                      {isEditing && form.tagline.trim() && (
                        <>
                          <span className="mp-testi-modal-sep">·</span>
                          <span className="mp-testi-modal-subrole">{form.tagline.trim()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mp-testi-modal-close-btn"
                  onClick={closeModal}
                  disabled={isSaving || isUploading}
                >
                  <span>Close</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Modal Body: 2-Column Live Preview + Form */}
              <div className="mp-testi-modal-body">
                <div className="mp-testi-modal-grid">
                  {/* Left: Live Client-Side Card Preview */}
                  <div className="mp-testi-preview-pane">
                    <span className="mp-testi-preview-label">LIVE CLIENT CARD PREVIEW</span>
                    <div className="mp-testi-preview-stage">
                      <LiveTestimonialPreviewCard form={form} />
                    </div>
                    <p className="mp-testi-preview-hint">
                      Updates in real time — mirrors the exact glassmorphism speech-bubble card displayed on the live Testimonials page.
                    </p>
                  </div>

                  {/* Right: Testimonial Form */}
                  <form className="mp-testi-form-pane" onSubmit={handleSubmit}>
                    {/* Avatar Upload */}
                    <div className="mp-testi-field">
                      <div className="mp-testi-field-label-row">
                        <label>Client Portrait / Avatar</label>
                        {form.avatar && (
                          <div className="mp-testi-img-label-actions">
                            <button
                              type="button"
                              className="mp-testi-crop-img-btn"
                              onClick={handleOpenCropExisting}
                            >
                              Crop / Resize
                            </button>
                            <button
                              type="button"
                              className="mp-testi-remove-img-btn"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  avatar: '',
                                  avatarPublicId: null,
                                }))
                              }
                            >
                              Remove Image
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        className={`mp-testi-upload-zone ${isDragging ? 'is-dragging' : ''}`}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFile(e.target.files?.[0])}
                        />
                        {form.avatar && !uploadThumbBroken && !isUploading ? (
                          <div className="mp-testi-upload-thumb">
                            <img
                              src={form.avatar}
                              alt={form.name || 'Client avatar preview'}
                              onError={() => setUploadThumbBroken(true)}
                            />
                            <span className="mp-testi-upload-thumb-badge" aria-hidden="true">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <div className="mp-testi-upload-icon">
                            {isUploading ? (
                              <span className="mp-testi-spinner sm" />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            )}
                          </div>
                        )}
                        <div className="mp-testi-upload-copy">
                          <strong>
                            {isUploading
                              ? 'Uploading avatar to cloud...'
                              : form.avatar
                                ? 'Change Client Avatar'
                                : 'Upload Client Avatar'}
                          </strong>
                          <span>Drag &amp; drop or click · JPG, PNG, WebP (max 10MB) · Optional</span>
                        </div>
                      </div>

                      <input
                        type="url"
                        className="mp-testi-input"
                        placeholder="Or paste direct image URL (https://...) — leave blank for initials"
                        value={form.avatar}
                        onChange={(e) => handleFieldChange('avatar', e.target.value)}
                      />
                    </div>

                    {/* Client Name + Tagline */}
                    <div className="mp-testi-form-row">
                      <div className="mp-testi-field">
                        <label htmlFor="testi-name">Client Name *</label>
                        <input
                          id="testi-name"
                          type="text"
                          className="mp-testi-input"
                          placeholder="e.g. Kavinda Perera"
                          value={form.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="mp-testi-field">
                        <label htmlFor="testi-tagline">Role / Company Tagline *</label>
                        <input
                          id="testi-tagline"
                          type="text"
                          className="mp-testi-input"
                          placeholder="e.g. Founder, CeylonPay Digital"
                          value={form.tagline}
                          onChange={(e) => handleFieldChange('tagline', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Quote Textarea */}
                    <div className="mp-testi-field">
                      <div className="mp-testi-field-label-row">
                        <label htmlFor="testi-quote">Testimonial Quote *</label>
                        <span className="mp-testi-char-count">
                          {form.quote.length} / {MAX_QUOTE_CHARS}
                        </span>
                      </div>
                      <textarea
                        id="testi-quote"
                        rows={4}
                        className="mp-testi-textarea"
                        placeholder="Write what the client loved about working with Motion Pub..."
                        value={form.quote}
                        onChange={(e) => handleFieldChange('quote', e.target.value)}
                        required
                      />
                    </div>

                    {/* Glass Card Shade */}
                    <div className="mp-testi-field">
                      <label>Glass Surface Tone</label>
                      <div className="mp-testi-tone-picker">
                        {VARIANT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`mp-testi-tone-chip ${form.variant === opt.value ? 'active' : ''}`}
                            onClick={() => handleFieldChange('variant', opt.value)}
                          >
                            <span className={`mp-testi-tone-swatch ${opt.value}`} />
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit / Cancel Row */}
                    <div className="mp-testi-form-actions">
                      <button
                        type="submit"
                        className="mp-testi-submit-btn"
                        disabled={isSaving || isUploading}
                      >
                        {isSaving
                          ? 'Saving...'
                          : isEditing
                            ? 'Save Changes'
                            : 'Add Testimonial'}
                      </button>
                      <button
                        type="button"
                        className="mp-testi-cancel-btn"
                        onClick={closeModal}
                        disabled={isSaving || isUploading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Circular Avatar Crop & Resize Modal */}
      <AvatarCropper
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource?.src || ''}
        fileName={cropSource?.fileName || 'avatar.jpg'}
        isUploading={isUploading}
        onConfirm={uploadCroppedAvatar}
        onCancel={closeCropper}
      />

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmMessage
        isOpen={Boolean(deletingTarget)}
        title="Remove Testimonial?"
        message="This testimonial will be permanently removed from the User Testimonials page."
        highlightItem={
          deletingTarget
            ? {
                name: deletingTarget.name,
                subtitle: deletingTarget.tagline,
                image: deletingTarget.avatar || null,
              }
            : null
        }
        confirmText="Remove Testimonial"
        cancelText="Keep It"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeletingTarget(null);
        }}
      />
    </div>
  );
}
