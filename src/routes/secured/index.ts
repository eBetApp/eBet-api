import user from './user';
import { Router } from 'express';

const routes: Router = Router();

routes.use('/user', user);

export default routes;
