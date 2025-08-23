import express, { Request, Response, Application } from 'express';
import bodyParser from 'body-parser';
import { requestLogger } from './lib/middleware/request.logger';
import { errorMiddleware } from './lib/middleware/error.handler';
// setup express
const app: Application = express();

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

// import user router

// import userRouter from '@/routers/user/index.user.route';
// import articleRouter from '@/routers/article/index.article.route';
// import authRouter from '@/routers/auth/index.auth.route';

// // use user router

// const routers = [userRouter, articleRouter, authRouter];
// routers.forEach((router) => {
//   app.use('/api', router);
// });

// setup error handler middleware
app.use(errorMiddleware);

// export app for server
export default app;
