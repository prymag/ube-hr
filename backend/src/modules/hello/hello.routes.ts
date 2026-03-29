import { Router } from 'express';
import { helloController } from './hello.controller';

const router = Router();

router.get('/hello', (req, res) => helloController.getHello(req, res));

export default router;
