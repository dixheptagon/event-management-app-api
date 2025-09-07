import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { CustomError } from '../../lib/utils/custom.error';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';

export const GetUserPersonalInfoController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const decodedToken = res?.locals?.payload;

    const user = await database.user.findUnique({
      where: {
        id: decodedToken.id,
      },
      select: {
        fullname: true,
        email: true,
        referralCode: true,
        referralPoints: true,
      },
    });

    // check if user exist
    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        HttpRes.details.NOT_FOUND + ' : User not found',
      );
    }

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success('Get user info successfully', user));
  } catch (error) {
    next(error);
  }
};
