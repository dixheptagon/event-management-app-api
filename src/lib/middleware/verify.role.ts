import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';

// Middleware to verify user role
export const verifyRole =
  (authorizeRole: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const decodedToken = res?.locals?.payload;

      // if user role is not in authorizeRole, return Unauthorized
      const userRole = decodedToken.role;
      if (!authorizeRole.includes(userRole)) {
        throw new CustomError(
          HttpRes.status.UNAUTHORIZED,
          HttpRes.message.UNAUTHORIZED,
          HttpRes.details.UNAUTHORIZED,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
