import e, { Router } from 'express';
import { CreateEventController } from './create.event.controller';
import { verifyToken } from '../../lib/middleware/verify.token';
import { verifyRole } from '../../lib/middleware/verify.role';

const CreateEventRouter = Router();

CreateEventRouter.post(
  '/create-event',
  verifyToken,
  verifyRole(['ADMIN', 'EVENT_ORGANIZER']),
  CreateEventController,
);

export default CreateEventRouter;
