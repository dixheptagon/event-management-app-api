import { Router } from 'express';
import { RegisterController } from './auth.controller';

const authRouter = Router();

authRouter.post('/auth/register', RegisterController);

export default authRouter;
