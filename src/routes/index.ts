import { Router } from 'express';
import auth from './auth';
import secured from './secured/';
import passport from 'passport';

const routes: Router = Router();

routes.use('/auth', auth);

routes.use('/', passport.authenticate('jwt', { session: false }), secured);

export default routes;
