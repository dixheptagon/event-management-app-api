import { Router } from 'express';
import {
  LoginController,
  RegisterController,
  ResendVerificationController,
  VerifyEmailController,
} from './auth.controller';

const authRouter = Router();

authRouter.post('/auth/register', RegisterController);
authRouter.get('/auth/verify-email', VerifyEmailController);
authRouter.post('/auth/resend-verification', ResendVerificationController);
authRouter.post('/auth/login', LoginController);

export default authRouter;
