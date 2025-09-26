import { Router } from 'express'
import { scrapeAndSaveInfluencer } from '../controllers/influencer.controller.js';

const router = Router();

router.post('/:username', scrapeAndSaveInfluencer);

export default router;