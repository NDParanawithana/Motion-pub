import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Memory storage keeps the uploaded file buffer in RAM without leaving orphaned temp files on disk
const storage = multer.memoryStorage();

// General multer upload middleware (10 MB limit)
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// File filter to restrict uploads to valid video formats
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
    'video/x-matroska', // .mkv
    'video/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload a valid video file (MP4, WebM, MOV).'), false);
  }
};

// Multer upload middleware configured for up to 100MB video files
export const uploadVideoMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max limit
  },
  fileFilter: videoFileFilter,
});

/**
 * General helper to upload a buffer stream directly to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<Object>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'motion_pub') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload a video buffer stream directly to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<Object>}
 */
export const uploadVideoToCloudinary = (fileBuffer, folder = 'motion_pub/hero') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        chunk_size: 6000000, // 6MB chunks for reliable streaming
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a media asset from Cloudinary by public ID
 * @param {string} publicId
 * @param {string} resourceType
 * @returns {Promise<Object>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
  } catch (err) {
    console.warn('Failed to delete asset from Cloudinary:', err.message);
    return null;
  }
};

/**
 * Clean up previously uploaded or orphaned hero videos in Cloudinary to reduce storage waste
 * @param {string|null} keepPublicId - public ID to preserve (or null to delete all hero videos)
 * @returns {Promise<{ deletedCount: number, freedBytes: number, deletedIds: string[] }>}
 */
export const cleanupOrphanHeroVideos = async (keepPublicId = null) => {
  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'motion_pub/hero',
      resource_type: 'video',
      max_results: 100,
    });

    const resources = response.resources || [];
    const toDelete = resources.filter(res => res.public_id !== keepPublicId);

    if (toDelete.length === 0) {
      return { deletedCount: 0, freedBytes: 0, deletedIds: [] };
    }

    const deleteIds = toDelete.map(r => r.public_id);
    const freedBytes = toDelete.reduce((acc, r) => acc + (r.bytes || 0), 0);

    await cloudinary.api.delete_resources(deleteIds, {
      resource_type: 'video',
      invalidate: true
    });

    return {
      deletedCount: deleteIds.length,
      freedBytes,
      deletedIds
    };
  } catch (err) {
    console.warn('Error cleaning up hero videos from Cloudinary:', err.message);
    return { deletedCount: 0, freedBytes: 0, deletedIds: [] };
  }
};
