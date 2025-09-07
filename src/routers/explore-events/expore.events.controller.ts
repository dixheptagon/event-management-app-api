import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';
import superjson from 'superjson';

export const getAllEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { keyword, location, category, skip, limit } = req.query;

    // Parse dan validasi skip & limit
    const skipNum = Math.max(0, parseInt(skip as string, 10)) || 0;
    const limitNum =
      Math.max(1, Math.min(100, parseInt(limit as string, 10))) || 8; // max 100, min 1

    // Normalisasi category
    const categoryFilter =
      category && category !== 'All Events' ? (category as string) : undefined;

    // Query pencarian
    const where: any = {
      title: keyword
        ? { contains: keyword as string, mode: 'insensitive' }
        : undefined,
      location: location
        ? { contains: location as string, mode: 'insensitive' }
        : undefined,
      category: categoryFilter || undefined,
    };

    // Hapus field undefined dari where
    Object.keys(where).forEach(
      (key) => where[key] === undefined && delete where[key],
    );

    // Ambil events
    const events = await database.event.findMany({
      skip: skipNum,
      take: limitNum,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        eventMedia: { select: { url: true } },
        ticketTypes: { select: { price: true, ticketType: true } },
        organizer: { select: { fullname: true } },
      },
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Hitung total item untuk pagination
    const totalItems = await database.event.count({ where });

    // Hitung total pages
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Get list events successfully', {
        events: superjson.serialize(events).json,
        totalItems,
        totalPages,
      }),
    );
  } catch (error) {
    next(error);
  }
};
