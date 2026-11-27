import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './avatarCropper.css';

const CROP_SIZE = 272; // diameter of the circular crop window in px
const OUTPUT_SIZE = 512; // exported square avatar resolution (512x512)
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export default function AvatarCropper({
  isOpen = false,
  imageSrc = '',
  fileName = 'avatar.jpg',
  isUploading = false,
  onConfirm,
  onCancel,
}) {
  const [imgMeta, setImgMeta] = useState(null); // { naturalWidth, naturalHeight, baseScale }
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Reset crop state whenever a new image opens
  useEffect(() => {
    if (!isOpen) return;
    setImgMeta(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLoadError('');
    setIsExporting(false);
  }, [isOpen, imageSrc]);

  // Escape key closes cropper when not busy
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isUploading && !isExporting) {
        e.stopPropagation();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, isUploading, isExporting, onCancel]);

  // Clamp pan offset so the image always fills 100% of the circle
  const clampOffset = useCallback((nextX, nextY, nextZoom, meta) => {
    if (!meta) return { x: 0, y: 0 };
    const scaledW = meta.naturalWidth * meta.baseScale * nextZoom;
    const scaledH = meta.naturalHeight * meta.baseScale * nextZoom;
    const maxX = Math.max(0, (scaledW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (scaledH - CROP_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  }, []);

  const handleImageLoad = (e) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    const baseScale = CROP_SIZE / Math.min(nw, nh);
    setImgMeta({ naturalWidth: nw, naturalHeight: nh, baseScale });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLoadError('');
  };

  const handleZoomChange = useCallback(
    (nextZoomVal) => {
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(nextZoomVal)));
      setZoom(clampedZoom);
      setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom, imgMeta));
    },
    [clampOffset, imgMeta]
  );

  // Non-passive wheel listener so mouse-wheel zoom never scrolls background or warns
  useEffect(() => {
    const stage = stageRef.current;
    if (!isOpen || !stage) return;
    const onWheel = (e) => {
      if (!imgMeta || isUploading || isExporting) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prevZoom) => {
        const nextZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prevZoom + delta).toFixed(2)));
        setOffset((prevOff) => clampOffset(prevOff.x, prevOff.y, nextZ, imgMeta));
        return nextZ;
      });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [isOpen, imgMeta, isUploading, isExporting, clampOffset]);

  const handlePointerDown = (e) => {
    if (!imgMeta || isUploading || isExporting) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !imgMeta) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setOffset(
      clampOffset(
        dragStartRef.current.startX + dx,
        dragStartRef.current.startY + dy,
        zoom,
        imgMeta
      )
    );
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApplyCrop = async () => {
    const img = imgRef.current;
    if (!img || !imgMeta || isUploading || isExporting) return;

    setIsExporting(true);
    setLoadError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill subtle dark background in case of transparent PNG
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const totalScale = imgMeta.baseScale * zoom;
      const srcSize = CROP_SIZE / totalScale;
      const srcX = imgMeta.naturalWidth / 2 - (CROP_SIZE / 2 + offset.x) / totalScale;
      const srcY = imgMeta.naturalHeight / 2 - (CROP_SIZE / 2 + offset.y) / totalScale;

      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcSize,
        srcSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Could not export cropped image.'))),
          'image/jpeg',
          0.92
        );
      });

      const baseName = (fileName || 'avatar').replace(/\.[^.]+$/, '');
      const croppedFile = new File([blob], `${baseName}-cropped.jpg`, {
        type: 'image/jpeg',
      });

      await onConfirm?.(croppedFile);
    } catch (err) {
      console.error('Avatar crop error:', err);
      setLoadError(
        err.name === 'SecurityError'
          ? 'This external image URL blocks cropping (CORS). Please upload the image file directly from your device.'
          : err.message || 'Failed to crop image.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const busy = isUploading || isExporting;
  const displayW = imgMeta ? imgMeta.naturalWidth * imgMeta.baseScale * zoom : CROP_SIZE;
  const displayH = imgMeta ? imgMeta.naturalHeight * imgMeta.baseScale * zoom : CROP_SIZE;
  const isRemote = /^https?:\/\//i.test(imageSrc);

  return createPortal(
    <div
      className="mp-cropper-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mp-cropper-title"
      onClick={() => {
        if (!busy) onCancel?.();
      }}
    >
      <div className="mp-cropper-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mp-cropper-header">
          <div className="mp-cropper-heading">
            <span className="mp-cropper-kicker">Circular Avatar Fit</span>
            <h3 id="mp-cropper-title" className="mp-cropper-title">
              Crop &amp; Resize Portrait
            </h3>
          </div>
          <button
            type="button"
            className="mp-cropper-close"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close image cropper"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Interactive Circular Crop Canvas */}
        <div
          ref={stageRef}
          className={`mp-cropper-stage ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="mp-cropper-viewport"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              crossOrigin={isRemote ? 'anonymous' : undefined}
              draggable={false}
              onLoad={handleImageLoad}
              onError={() =>
                setLoadError('Could not load this image for cropping. Try uploading the file directly.')
              }
              className="mp-cropper-source-img"
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                opacity: imgMeta ? 1 : 0,
              }}
            />
          </div>

          {/* Circular Cutout Mask & Guide Ring */}
          <div
            className="mp-cropper-circle-mask"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
            aria-hidden="true"
          >
            <span className="mp-cropper-guide-h" />
            <span className="mp-cropper-guide-v" />
          </div>

          <span className="mp-cropper-drag-hint" aria-hidden="true">
            Drag to position · Scroll or slide to zoom
          </span>
        </div>

        {loadError && <div className="mp-cropper-error">{loadError}</div>}

        {/* Zoom / Resize Controls */}
        <div className="mp-cropper-controls">
          <div className="mp-cropper-zoom-row">
            <button
              type="button"
              className="mp-cropper-step-btn"
              onClick={() => handleZoomChange(+(zoom - 0.15).toFixed(2))}
              disabled={busy || zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.02"
              value={zoom}
              onChange={(e) => handleZoomChange(e.target.value)}
              disabled={busy || !imgMeta}
              className="mp-cropper-slider"
              aria-label="Resize zoom level"
            />

            <button
              type="button"
              className="mp-cropper-step-btn"
              onClick={() => handleZoomChange(+(zoom + 0.15).toFixed(2))}
              disabled={busy || zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>

            <span className="mp-cropper-zoom-val">{Math.round(zoom * 100)}%</span>

            <button
              type="button"
              className="mp-cropper-reset-btn"
              onClick={handleReset}
              disabled={busy || (zoom === 1 && offset.x === 0 && offset.y === 0)}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mp-cropper-footer">
          <button
            type="button"
            className="mp-cropper-cancel-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mp-cropper-apply-btn"
            onClick={handleApplyCrop}
            disabled={busy || !imgMeta || Boolean(loadError)}
          >
            {busy ? (
              <>
                <span className="mp-cropper-spinner" />
                <span>{isUploading ? 'Uploading...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Apply &amp; Upload Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
