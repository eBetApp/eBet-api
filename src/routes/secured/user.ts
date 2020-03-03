import { Router } from 'express';
import UserController from '../../controllers/UserController';

const router: Router = Router();

router.get('/', UserController.all);
router.get('/:id', UserController.one);
router.delete('/:id', UserController.delete);
router.put('/', UserController.update);

export default router;
