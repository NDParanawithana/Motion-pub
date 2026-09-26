import { Router } from 'express';
import { handleGetHero, handleUpdateHero } from '../../controllers/content/hero_controller.js';

const router = Router();

router.get('/hero', handleGetHero);
router.put('/hero', handleUpdateHero);
router.post('/hero', handleUpdateHero);

export default router;
