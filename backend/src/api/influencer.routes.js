import { Router } from 'express'
import { scrapeAndSaveInfluencer, getInfluencerByUsername } from '../controllers/influencer.controllers.js';

const router = Router();

router.get('/:username', getInfluencerByUsername);
router.post('/:username', scrapeAndSaveInfluencer);

export default router;