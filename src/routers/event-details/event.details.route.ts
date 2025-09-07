import { Router } from 'express';
import { getEventDetailsController } from './event.details.controller';

const EventDetailsRouter = Router();

EventDetailsRouter.get('/event-details/:id', getEventDetailsController);

export default EventDetailsRouter;
