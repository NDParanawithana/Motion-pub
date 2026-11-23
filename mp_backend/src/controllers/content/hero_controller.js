import cloudinary from '../../config/cloudinary.js';
import {
  getHeroContent,
  updateHeroContent,
  updateHeroVideo,
  resetHeroVideo,
  DEFAULT_HERO_TITLE,
  DEFAULT_HERO_PARAGRAPH,
  DEFAULT_HERO_TEXT
} from '../../models/content/hero_model.js';
import {
  uploadHeroMediaToCloudinary,
  deleteFromCloudinary,
  cleanupOrphanHeroVideos
} from '../../middleware/upload.js';

/**
 * GET /api/content/hero
 * Retrieve hero title, paragraph and background media details
 */
export async function handleGetHero(req, res) {
  try {
    const data = await getHeroContent();
    res.status(200).json({
      success: true,
      title: data.title,
      paragraph: data.paragraph,
      fullText: data.fullText,
      videoUrl: data.videoUrl,
      mediaUrl: data.videoUrl,
      mediaType: data.mediaType || 'video',
      videoPublicId: data.videoPublicId,
      videoUpdatedAt: data.videoUpdatedAt,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    res.status(200).json({
      success: true,
      title: DEFAULT_HERO_TITLE,
      paragraph: DEFAULT_HERO_PARAGRAPH,
      fullText: DEFAULT_HERO_TEXT,
      videoUrl: null,
      mediaUrl: null,
      mediaType: 'video',
      videoPublicId: null,
      fallback: true
    });
  }
}

/**
 * PUT /api/content/hero
 * POST /api/content/hero
 * Update hero title and paragraph
 */
export async function handleUpdateHero(req, res) {
  try {
    const { title, paragraph, fullText } = req.body || {};
    const resolvedParagraph = paragraph !== undefined ? paragraph : fullText;

    const hasTitle = typeof title === 'string' && title.trim().length > 0;
    const hasParagraph = typeof resolvedParagraph === 'string' && resolvedParagraph.trim().length > 0;

    if (!hasTitle && !hasParagraph) {
      return res.status(400).json({
        success: false,
        message: 'Valid hero title and paragraph are required.'
      });
    }

    if (title !== undefined && !hasTitle) {
      return res.status(400).json({
        success: false,
        message: 'Hero title cannot be empty.'
      });
    }

    if (resolvedParagraph !== undefined && !hasParagraph) {
      return res.status(400).json({
        success: false,
        message: 'Hero paragraph cannot be empty.'
      });
    }

    const updated = await updateHeroContent({
      title: hasTitle ? title : undefined,
      paragraph: hasParagraph ? resolvedParagraph : undefined
    });

    res.status(200).json({
      success: true,
      message: 'Hero content updated successfully!',
      title: updated.title,
      paragraph: updated.paragraph,
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
 * GET /api/content/hero/upload-signature
 * Generate a short-lived signed upload token so the browser can upload large videos/images
 * directly to Cloudinary without routing 50MB+ through the Node server.
 */
export function handleGetHeroUploadSignature(req, res) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloud storage credentials are not configured on the server.'
      });
    }

    const folder = 'motion_pub/hero';
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      apiSecret
    );

    return res.status(200).json({
      success: true,
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature
    });
  } catch (error) {
    console.error('Error generating hero upload signature:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize direct upload.'
    });
  }
}

/**
 * POST /api/content/hero/media
 * Save metadata of a background video or image uploaded directly from the browser to Cloudinary.
 */
export async function handleSaveHeroMedia(req, res) {
  try {
    const { videoUrl, videoPublicId, mediaType, deletePrevious } = req.body || {};

    if (!videoUrl || typeof videoUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid uploaded media URL is required.'
      });
    }

    const normalizedType = mediaType === 'image' ? 'image' : 'video';
    const saveResult = await updateHeroVideo(
      videoUrl.trim(),
      videoPublicId || null,
      normalizedType
    );

    // Run orphan cleanup in the background so saving returns instantly
    if (deletePrevious !== false && videoPublicId) {
      cleanupOrphanHeroVideos(videoPublicId).catch((cleanErr) => {
        console.warn('Background media cleanup notice:', cleanErr.message);
      });
    }

    const label = normalizedType === 'image' ? 'image' : 'video';
    return res.status(200).json({
      success: true,
      message: `New hero background ${label} uploaded and published!`,
      videoUrl: saveResult.videoUrl,
      mediaUrl: saveResult.videoUrl,
      mediaType: normalizedType,
      videoPublicId: saveResult.videoPublicId,
      videoUpdatedAt: saveResult.videoUpdatedAt
    });
  } catch (error) {
    console.error('Error saving hero background media:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save hero background media.'
    });
  }
}

/**
 * POST /api/content/hero/video
 * Upload background video or image file to Cloudinary, save to MongoDB, and clean up previously uploaded media
 */
export async function handleUploadHeroVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please choose a video (MP4, WebM, MOV) or image (JPG, PNG, WebP).'
      });
    }

    // Default to true unless explicitly requested otherwise
    const shouldDeletePrevious = req.body?.deletePrevious !== 'false';
    const mediaType = req.file.mimetype?.startsWith('image/') ? 'image' : 'video';

    // 1. Upload new media buffer to Cloudinary
    const cloudinaryResult = await uploadHeroMediaToCloudinary(
      req.file.buffer,
      mediaType,
      'motion_pub/hero'
    );

    if (!cloudinaryResult?.secure_url) {
      throw new Error('Cloudinary did not return a secure URL for the uploaded file.');
    }

    // 2. Persist new media metadata in MongoDB
    const saveResult = await updateHeroVideo(
      cloudinaryResult.secure_url,
      cloudinaryResult.public_id,
      mediaType
    );

    // 3. Delete previously uploaded media from Cloudinary to eliminate storage waste
    let cleanupStats = { deletedCount: 0, freedBytes: 0 };
    if (shouldDeletePrevious) {
      try {
        cleanupStats = await cleanupOrphanHeroVideos(cloudinaryResult.public_id);
      } catch (cleanErr) {
        console.warn('Notice: Background cleanup of previous media encountered an issue:', cleanErr.message);
      }
    }

    const freedMB = (cleanupStats.freedBytes / (1024 * 1024)).toFixed(1);
    const label = mediaType === 'image' ? 'image' : 'video';
    const feedbackMessage = cleanupStats.deletedCount > 0
      ? `New hero background ${label} uploaded successfully and ${cleanupStats.deletedCount} previous file(s) removed (freed ~${freedMB} MB)!`
      : `New hero background ${label} uploaded successfully!`;

    res.status(200).json({
      success: true,
      message: feedbackMessage,
      videoUrl: cloudinaryResult.secure_url,
      mediaUrl: cloudinaryResult.secure_url,
      mediaType,
      videoPublicId: cloudinaryResult.public_id,
      videoUpdatedAt: saveResult.videoUpdatedAt,
      format: cloudinaryResult.format,
      bytes: cloudinaryResult.bytes,
      duration: cloudinaryResult.duration,
      deletedPreviousCount: cleanupStats.deletedCount,
      freedBytes: cleanupStats.freedBytes
    });
  } catch (error) {
    console.error('Error uploading hero background media:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload hero background media.',
      error: error.message
    });
  }
}

/**
 * DELETE /api/content/hero/video
 * Permanently delete custom hero background media and restore default background video
 */
export async function handleResetHeroVideo(req, res) {
  try {
    const result = await resetHeroVideo();

    let deleteStatus = null;
    if (result.previousPublicId) {
      deleteStatus = await deleteFromCloudinary(
        result.previousPublicId,
        result.previousMediaType || 'video'
      );
    }

    // Also purge any lingering orphan hero media from folder to ensure 0 waste
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
        ? 'Hero background removed and restored to default background video.'
        : 'Hero background restored to default background video.',
      videoUrl: null,
      mediaUrl: null,
      mediaType: 'video',
      videoPublicId: null,
      deletedCount: totalDeleted
    });
  } catch (error) {
    console.error('Error deleting hero background media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove hero background media.',
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
