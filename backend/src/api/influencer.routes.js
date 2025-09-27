import { Router } from 'express'
import { scrapeAndSaveInfluencer } from '../controllers/influencer.controllers.js';

const router = Router();

router.post('/:username', scrapeAndSaveInfluencer);

export default router;