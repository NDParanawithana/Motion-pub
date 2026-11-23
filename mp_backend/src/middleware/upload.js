import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Memory storage keeps the uploaded file buffer in RAM without leaving orphaned temp files on disk
const storage = multer.memoryStorage();

// General multer upload middleware (10 MB limit)
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// File filter to allow both valid video and image formats for Hero background
const heroMediaFileFilter = (req, file, cb) => {
  const allowedVideoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
    'video/x-matroska', // .mkv
    'video/ogg'
  ];
  const allowedImageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif'
  ];

  const isVideo = allowedVideoMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/');
  const isImage = allowedImageMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/');

  if (isVideo || isImage) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload a valid video (MP4, WebM, MOV) or image (JPG, PNG, WebP).'), false);
  }
};

// Multer upload middleware configured for up to 100MB hero video or image files
export const uploadVideoMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max limit
  },
  fileFilter: heroMediaFileFilter,
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
 * Upload a hero media buffer (video or image) directly to Cloudinary.
 * Uses chunked streaming for videos > 6MB and a 10-minute per-request timeout
 * to prevent Cloudinary's default 60s Request Timeout error.
 * @param {Buffer} fileBuffer
 * @param {'video'|'image'} resourceType
 * @param {string} folder
 * @returns {Promise<Object>}
 */
export const uploadHeroMediaToCloudinary = (fileBuffer, resourceType = 'video', folder = 'motion_pub/hero') => {
  return new Promise((resolve, reject) => {
    const CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB chunks (Cloudinary min is 5 MB)
    const TIMEOUT_MS = 600000; // 10 minutes

    const handleResult = (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    };

    if (resourceType === 'image') {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          timeout: TIMEOUT_MS,
        },
        handleResult
      );
      uploadStream.end(fileBuffer);
      return;
    }

    // Use real chunked streaming for larger videos so each 6MB chunk uploads quickly without hitting timeouts
    if (fileBuffer.length > CHUNK_SIZE) {
      const uploadStream = cloudinary.uploader.upload_chunked_stream(
        {
          folder,
          resource_type: 'video',
          chunk_size: CHUNK_SIZE,
          timeout: TIMEOUT_MS,
        },
        handleResult
      );
      uploadStream.end(fileBuffer);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        timeout: TIMEOUT_MS,
      },
      handleResult
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
  return uploadHeroMediaToCloudinary(fileBuffer, 'video', folder);
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
 * Clean up previously uploaded or orphaned hero media (both videos and images) in Cloudinary
 * @param {string|null} keepPublicId - public ID to preserve (or null to delete all hero media)
 * @returns {Promise<{ deletedCount: number, freedBytes: number, deletedIds: string[] }>}
 */
export const cleanupOrphanHeroVideos = async (keepPublicId = null) => {
  let totalDeletedCount = 0;
  let totalFreedBytes = 0;
  const allDeletedIds = [];

  for (const resourceType of ['video', 'image']) {
    try {
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'motion_pub/hero',
        resource_type: resourceType,
        max_results: 100,
      });

      const resources = response.resources || [];
      const toDelete = resources.filter(res => res.public_id !== keepPublicId);

      if (toDelete.length === 0) continue;

      const deleteIds = toDelete.map(r => r.public_id);
      const freedBytes = toDelete.reduce((acc, r) => acc + (r.bytes || 0), 0);

      await cloudinary.api.delete_resources(deleteIds, {
        resource_type: resourceType,
        invalidate: true
      });

      totalDeletedCount += deleteIds.length;
      totalFreedBytes += freedBytes;
      allDeletedIds.push(...deleteIds);
    } catch (err) {
      console.warn(`Error cleaning up hero ${resourceType}s from Cloudinary:`, err.message);
    }
  }

  return {
    deletedCount: totalDeletedCount,
    freedBytes: totalFreedBytes,
    deletedIds: allDeletedIds
  };
};
