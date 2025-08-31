import { Request, Response, NextFunction } from 'express';
import * as Yup from 'yup';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CustomError } from '../utils/custom.error';
import { ResponseHandler } from '../utils/response.handler';
import { HttpRes } from '../constant/http.response';

// Error handler middleware
export const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // log the error (you can use a logging library here)
  console.error('Error occurred:', err);

  // check if the error is a Yup validation error
  if (err instanceof Yup.ValidationError) {
    return res
      .status(HttpRes.status.BAD_REQUEST)
      .json(ResponseHandler.error(HttpRes.message.BAD_REQUEST, err.errors));
  }

  // check if error is Prisma error
  if (err instanceof PrismaClientKnownRequestError) {
    return res
      .status(HttpRes.status.BAD_REQUEST)
      .json(ResponseHandler.error(HttpRes.message.BAD_REQUEST, err.message));
  }

  // handle other types of errors
  if (err instanceof CustomError) {
    return res
      .status(err.status)
      .json(ResponseHandler.error(err.message, err.details));
  }

  // handle unexpected errors
  return res
    .status(500)
    .json(
      ResponseHandler.error(
        HttpRes.message.INTERNAL_SERVER_ERROR,
        HttpRes.details.INTERNAL_SERVER_ERROR + `: ${(err as Error).message}` ||
          'Unknown error',
      ),
    );
};
