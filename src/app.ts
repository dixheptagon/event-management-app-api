import express, { Request, Response, Application } from 'express';
import bodyParser from 'body-parser';
import { requestLogger } from './lib/middleware/request.logger';
import { errorMiddleware } from './lib/middleware/error.handler';
import cors from 'cors';

// setup express
const app: Application = express();

// setup middleware : CORS
app.use(cors()); // Semua client dapat mengakses API kita

// setup middleware: body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setup middleware: LOGGING
app.use(requestLogger);

// expose public folder
app.use('/public', express.static('public'));

// setup middleware: CORS (Cross-Origin Resource Sharing)

// define root routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Express server!',
  });
});

// import routers

import authRouter from './routers/auth/auth.route';
import referralRouter from './routers/referral/referral.route';
import CreateEventRouter from './routers/create-event/create.event.route';
import ListEventsRouter from './routers/list-events/list.events.route';
import ExploreEventsRouter from './routers/explore-events/explore.events.route';

// // use user router

const routers = [
  authRouter,
  referralRouter,
  CreateEventRouter,
  ListEventsRouter,
  ExploreEventsRouter,
];
routers.forEach((router) => {
  app.use('/api', router);
});

// setup error handler middleware
app.use(errorMiddleware);

// export app for server
export default app;
