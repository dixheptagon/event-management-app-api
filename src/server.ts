import app from './app';
import env from './env';

// start the server
app.listen(env.PORT, () => {
  console.log(
    `[⚡SERVER ]Server is running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`,
  );
});
