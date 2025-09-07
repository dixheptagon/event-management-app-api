import { Router } from 'express';
import { getListEventsController } from './list.event.controller';

const ListEventsRouter = Router();

ListEventsRouter.get('/list-events', getListEventsController);

export default ListEventsRouter;
