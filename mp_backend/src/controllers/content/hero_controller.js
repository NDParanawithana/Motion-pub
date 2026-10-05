import {
  getHeroContent,
  updateHeroContent,
  updateHeroVideo,
  resetHeroVideo,
  DEFAULT_HERO_TEXT
} from '../../models/content/hero_model.js';
import {
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  cleanupOrphanHeroVideos
} from '../../middleware/upload.js';

/**
 * GET /api/content/hero
 * Retrieve hero text statement and video details
 */
export async function handleGetHero(req, res) {
  try {
    const data = await getHeroContent();
    res.status(200).json({
      success: true,
      fullText: data.fullText,
      videoUrl: data.videoUrl,
      videoPublicId: data.videoPublicId,
      videoUpdatedAt: data.videoUpdatedAt,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    res.status(200).json({
      success: true,
      fullText: DEFAULT_HERO_TEXT,
      videoUrl: null,
      videoPublicId: null,
      fallback: true
    });
  }
}

/**
 * PUT /api/content/hero
 * POST /api/content/hero
 * Update hero text statement
 */
export async function handleUpdateHero(req, res) {
  try {
    const { fullText } = req.body || {};

    if (typeof fullText !== 'string' || !fullText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid hero text string is required.'
      });
    }

    const updated = await updateHeroContent(fullText);

    res.status(200).json({
      success: true,
      message: 'Hero content updated successfully!',
      fullText: updated.fullText,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Error updating hero content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save hero content to database.',
      error: error.message
    });
  }
}

/**
 * POST /api/content/hero/video
 * Upload video file to Cloudinary, save to MongoDB, and delete previously uploaded video(s)
 */
export async function handleUploadHeroVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided. Please choose a video file (MP4, WebM, MOV).'
      });
    }

    // Default to true unless explicitly requested otherwise
    const shouldDeletePrevious = req.body?.deletePrevious !== 'false';

    // 1. Upload new video buffer to Cloudinary
    const cloudinaryResult = await uploadVideoToCloudinary(req.file.buffer, 'motion_pub/hero');

    if (!cloudinaryResult?.secure_url) {
      throw new Error('Cloudinary did not return a secure URL for the uploaded video.');
    }

    // 2. Persist new video metadata in MongoDB
    const saveResult = await updateHeroVideo(
      cloudinaryResult.secure_url,
      cloudinaryResult.public_id
    );

    // 3. Delete previously uploaded videos from Cloudinary to eliminate storage waste
    let cleanupStats = { deletedCount: 0, freedBytes: 0 };
    if (shouldDeletePrevious) {
      try {
        cleanupStats = await cleanupOrphanHeroVideos(cloudinaryResult.public_id);
      } catch (cleanErr) {
        console.warn('Notice: Background cleanup of previous videos encountered an issue:', cleanErr.message);
      }
    }

    const freedMB = (cleanupStats.freedBytes / (1024 * 1024)).toFixed(1);
    const feedbackMessage = cleanupStats.deletedCount > 0
      ? `New video uploaded successfully and ${cleanupStats.deletedCount} previous video(s) removed (freed ~${freedMB} MB)!`
      : 'New hero video uploaded successfully!';

    res.status(200).json({
      success: true,
      message: feedbackMessage,
      videoUrl: cloudinaryResult.secure_url,
      videoPublicId: cloudinaryResult.public_id,
      videoUpdatedAt: saveResult.videoUpdatedAt,
      format: cloudinaryResult.format,
      bytes: cloudinaryResult.bytes,
      duration: cloudinaryResult.duration,
      deletedPreviousCount: cleanupStats.deletedCount,
      freedBytes: cleanupStats.freedBytes
    });
  } catch (error) {
    console.error('Error uploading hero video:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload hero video.',
      error: error.message
    });
  }
}

/**
 * DELETE /api/content/hero/video
 * Permanently delete hero video and reset database back to default template video
 */
export async function handleResetHeroVideo(req, res) {
  try {
    const result = await resetHeroVideo();

    let deleteStatus = null;
    if (result.previousPublicId) {
      deleteStatus = await deleteFromCloudinary(result.previousPublicId, 'video');
    }

    // Also purge any lingering orphan hero videos from folder to ensure 0 waste
    let cleanupStats = { deletedCount: 0, freedBytes: 0 };
    try {
      cleanupStats = await cleanupOrphanHeroVideos(null);
    } catch (e) {
      console.warn('Orphan cleanup notice:', e.message);
    }

    const totalDeleted = (deleteStatus?.result === 'ok' ? 1 : 0) + (cleanupStats.deletedCount || 0);

    res.status(200).json({
      success: true,
      message: totalDeleted > 0
        ? 'Hero video removed and restored to default showcase video.'
        : 'Hero video restored to default showcase video.',
      videoUrl: null,
      videoPublicId: null,
      deletedCount: totalDeleted
    });
  } catch (error) {
    console.error('Error deleting hero video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove hero video.',
      error: error.message
    });
  }
}

/**
 * POST /api/content/hero/video/cleanup
 * Clean up all older/unused videos to free storage space
 */
export async function handleCleanupHeroVideos(req, res) {
  try {
    const heroContent = await getHeroContent();
    const activePublicId = heroContent.videoPublicId;

    const cleanupStats = await cleanupOrphanHeroVideos(activePublicId);

    const freedMB = (cleanupStats.freedBytes / (1024 * 1024)).toFixed(1);

    res.status(200).json({
      success: true,
      message: cleanupStats.deletedCount > 0
        ? `Cleaned up ${cleanupStats.deletedCount} unused video(s) and freed ~${freedMB} MB of storage space!`
        : 'Storage is clean. No unused hero videos found.',
      deletedCount: cleanupStats.deletedCount,
      freedBytes: cleanupStats.freedBytes,
      deletedIds: cleanupStats.deletedIds
    });
  } catch (error) {
    console.error('Error cleaning up hero videos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clean up storage space.',
      error: error.message
    });
  }
}
