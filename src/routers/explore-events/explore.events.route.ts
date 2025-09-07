import { Router } from 'express';
import { getAllEventsController } from './expore.events.controller';

const ExploreEventsRouter = Router();

ExploreEventsRouter.get('/explore-events', getAllEventsController);

export default ExploreEventsRouter;
