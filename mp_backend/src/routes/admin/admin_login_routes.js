import { Router } from 'express';
import { handleAdminLogin } from '../../controllers/admin/admin_login_controller.js';

const router = Router();

// POST /api/admin/login
router.post('/login', handleAdminLogin);

export default router;
