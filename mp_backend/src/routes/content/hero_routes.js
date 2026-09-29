import { Router } from 'express';
import multer from 'multer';
import {
  handleGetHero,
  handleUpdateHero,
  handleUploadHeroVideo,
  handleResetHeroVideo,
  handleCleanupHeroVideos
} from '../../controllers/content/hero_controller.js';
import { uploadVideoMiddleware } from '../../middleware/upload.js';

const router = Router();

// Middleware wrapper for multer error handling
const handleUploadMiddleware = (req, res, next) => {
  const uploadSingle = uploadVideoMiddleware.single('video');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Video file size exceeds the 100MB limit. Please upload a smaller video.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading video.'
      });
    }
    next();
  });
};

// Hero Content (Text)
router.get('/hero', handleGetHero);
router.put('/hero', handleUpdateHero);
router.post('/hero', handleUpdateHero);

// Hero Showcase Video
router.post('/hero/video', handleUploadMiddleware, handleUploadHeroVideo);
router.delete('/hero/video', handleResetHeroVideo);
router.post('/hero/video/cleanup', handleCleanupHeroVideos);

export default router;
