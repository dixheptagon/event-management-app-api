import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';

export const getAllEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { keyword, location, category } = req.query;

    if (category === 'All Events') category = undefined;

    const events = await database.event.findMany({
      select: {
        title: true,
        startDate: true,
        endDate: true,
        eventMedia: { select: { url: true } },
        ticketTypes: { select: { price: true, ticketType: true } },
        organizer: { select: { fullname: true } },
      },
      where: {
        title: {
          contains: keyword as string,
          mode: 'insensitive', // biar huruf besar kecil ga ngaruh
        },
        location: location
          ? { contains: location as string, mode: 'insensitive' }
          : undefined,
        category: (category as string) || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success('Get list events successfully', events));
  } catch (error) {
    next(error);
  }
};
