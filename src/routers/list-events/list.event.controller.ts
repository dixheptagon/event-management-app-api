import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';
import superjson from 'superjson';

export const getListEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const events = await database.event.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        eventMedia: { select: { url: true } },
        ticketTypes: { select: { price: true, ticketType: true } },
        organizer: { select: { fullname: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Get list events successfully',
          superjson.serialize(events),
        ),
      );
  } catch (error) {
    next(error);
  }
};
