import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { CustomError } from '../../lib/utils/custom.error';
import { HttpRes } from '../../lib/constant/http.response';
import { Http } from 'winston/lib/winston/transports';
import { ResponseHandler } from '../../lib/utils/response.handler';
import superjson from 'superjson';

export const getEventDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const event = await database.event.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        location: true,
        venue: true,
        description: true,
        category: true,
        eventMedia: { select: { url: true } },
        ticketTypes: {
          select: {
            price: true,
            ticketType: true,
            quantity: true,
            description: true,
            name: true,
          },
        },
        organizer: { select: { fullname: true } },
      },
    });

    // if event not found, throw error
    if (!event)
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        HttpRes.details.NOT_FOUND + ' : Event not found',
      );

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Get event details successfully',
          superjson.serialize(event),
        ),
      );
  } catch (error) {
    console.log(error);

    next(error);
  }
};
