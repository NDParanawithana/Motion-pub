import { Router } from 'express';
import multer from 'multer';
import {
  handleGetTeam,
  handleCreateTeamMember,
  handleUpdateTeamMember,
  handleDeleteTeamMember,
  handleReorderTeamMembers,
  handleUploadTeamImage
} from '../../controllers/content/team_controller.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

const handlePortraitUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('image');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Portrait image exceeds the 10MB limit. Please choose a smaller image.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading portrait.'
      });
    }
    next();
  });
};

// Team Members CRUD & Ordering
router.get('/team', handleGetTeam);
router.post('/team', handleCreateTeamMember);
router.put('/team/reorder', handleReorderTeamMembers);
router.post('/team/upload-image', handlePortraitUploadMiddleware, handleUploadTeamImage);
router.put('/team/:id', handleUpdateTeamMember);
router.delete('/team/:id', handleDeleteTeamMember);

export default router;
