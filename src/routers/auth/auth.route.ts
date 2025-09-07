import { Router } from 'express';
import {
  LoginController,
  RegisterController,
  ResendVerificationController,
  SessionLoginController,
  VerifyEmailController,
} from './auth.controller';
import {
  logReferralActivity,
  referralRateLimit,
  validateRegisterWithReferral,
} from '../../lib/middleware/validator.handler';
import { verifyToken } from '../../lib/middleware/verify.token';

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
authRouter.get('/auth/session-login', verifyToken, SessionLoginController);

export default authRouter;
