import { Router } from 'express';
import { GetUserPersonalInfoController } from './dashboard.controller';
import { verifyToken } from '../../lib/middleware/verify.token';

const DashboardRouter = Router();

DashboardRouter.get(
  '/dashboard/my-account',
  verifyToken,
  GetUserPersonalInfoController,
);

export default DashboardRouter;
