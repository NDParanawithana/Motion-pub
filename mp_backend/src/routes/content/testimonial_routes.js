import { Router } from 'express';
import multer from 'multer';
import {
  handleGetTestimonials,
  handleCreateTestimonial,
  handleUpdateTestimonial,
  handleDeleteTestimonial,
  handleReorderTestimonials,
  handleUploadTestimonialImage,
} from '../../controllers/content/testimonial_controller.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

const handleAvatarUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('image');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Avatar image exceeds the 10MB limit. Please choose a smaller image.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading avatar.',
      });
    }
    next();
  });
};

// Testimonials CRUD, Ordering & Avatar Upload
router.get('/testimonials', handleGetTestimonials);
router.post('/testimonials', handleCreateTestimonial);
router.put('/testimonials/reorder', handleReorderTestimonials);
router.post('/testimonials/upload-image', handleAvatarUploadMiddleware, handleUploadTestimonialImage);
router.put('/testimonials/:id', handleUpdateTestimonial);
router.delete('/testimonials/:id', handleDeleteTestimonial);

export default router;
