import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';

export const getListEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const events = await database.event.findMany({
      select: {
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

    console.log('events', events);

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success('Get list events successfully', events));
  } catch (error) {
    next(error);
  }
};
