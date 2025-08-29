import { Router } from 'express';
import {
  LoginController,
  RegisterController,
  ResendVerificationController,
  VerifyEmailController,
} from './auth.controller';
import {
  logReferralActivity,
  referralRateLimit,
  validateRegisterWithReferral,
} from '../../lib/middleware/validator.handler';

const authRouter = Router();

authRouter.post(
  '/auth/register',
  validateRegisterWithReferral,
  // referralRateLimit(),   //Need Be Fixed
  // logReferralActivity('REGISTER'),  //Need Be Fixed
  RegisterController,
);
authRouter.get('/auth/verify-email', VerifyEmailController);
authRouter.post('/auth/resend-verification', ResendVerificationController);
authRouter.post('/auth/login', LoginController);

export default authRouter;
