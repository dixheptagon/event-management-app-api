import { Router } from 'express';
import {
  referralRateLimit,
  validateReferralCodeParam,
} from '../../lib/middleware/validator.handler';
import { ValidateReferralController } from './referral.controller';

const referralRouter = Router();

referralRouter.get(
  '/referral/validate/:referralCode',
  validateReferralCodeParam,
  //   referralRateLimit(30000, 10), // 10 attempts per 30 seconds // Need Be Fixed ERROR
  ValidateReferralController,
);

export default referralRouter;
