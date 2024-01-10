import { Router } from 'express';
import user from './user';

const router = Router();

router.get('/server-status', (req, res) => {
  res.send('okidoki');
});

router.use('/user', user);

export default router;