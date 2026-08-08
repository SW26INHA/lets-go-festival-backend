import express from 'express';
import { festivalController } from '../../controllers';

const router = express.Router();

router.get('/map', festivalController.getFestivalMapList);

export default router