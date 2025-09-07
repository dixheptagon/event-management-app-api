import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    //if token is not provided, throw error
    if (!token) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        HttpRes.details.UNAUTHORIZED + ' : No token provided',
      );
    }

    const decodedToken = jwt.verify(token!, process.env.JWT_SECRET!);

    // Change to req.user (NEED FIX)
    res.locals.payload = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};
