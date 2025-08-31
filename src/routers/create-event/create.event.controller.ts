import { NextFunction, Request, Response } from 'express';
import { CreateEventSchema } from './schemas/create.event.validation';
import database from '../../lib/config/prisma.client';
import { cloudinaryUpload } from '../../lib/config/cloudinary';
import { CustomError } from '../../lib/utils/custom.error';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';

export const CreateEventController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Step 1: Validate request body
    const {
      name,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      venue,
      capacity,
      ticketTypes = [],
      tags = [],
      image,
      promotions = [],
    } = await CreateEventSchema.validate(req.body, {
      abortEarly: false,
    });

    // Step 2: Get user details from Authorization
    const decodedToken = res?.locals?.payload;

    // Step 3: Parse JSON fields safely
    let parsedTicketTypes: any[] = [];
    let parsedTags: string[] = [];
    let parsedPromotions: any[] = [];

    try {
      parsedTicketTypes =
        typeof ticketTypes === 'string'
          ? JSON.parse(ticketTypes)
          : ticketTypes || [];

      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

      parsedPromotions =
        typeof promotions === 'string'
          ? JSON.parse(promotions)
          : promotions || [];

      console.log('Parsed data:', {
        parsedTicketTypes,
        parsedTags,
        parsedPromotions,
      });
    } catch (parseError) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid JSON format in ticketTypes, tags, or promotions',
        parseError instanceof Error
          ? parseError.message
          : 'JSON parsing failed',
      );
    }

    // Step 4: Handle file upload
    let imageFile: Express.Multer.File | null = null;

    if (Array.isArray(req.files)) {
      imageFile = req.files[0] || null;
    } else if (req.files && 'image' in req.files) {
      const files = req.files.image as Express.Multer.File[];
      imageFile = files[0] || null;
    } else if (req.file) {
      imageFile = req.file;
    }

    // Combine StartData and StartTime
    const datePartStart = startDate.toDateString().split('T')[0];
    const startDateTime = new Date(`${startDate} ${startTime}`);

    // Combine EndDate and EndTime
    const datePartEnd = endDate.toDateString().split('T')[0];
    const endDateTime = new Date(`${endDate} ${endTime}`);

    // const parsedTicketTypes = ticketTypes
    //   ? JSON.parse(req.body.ticketTypes)
    //   : [];
    // const parsedTags = tags ? JSON.parse(req.body.tags) : [];
    // const parsedPromotions = promotions ? JSON.parse(req.body.promotions) : [];

    const transaction = await database.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          organizerId: decodedToken?.id,
          title: name,
          description: description,
          category: category,
          startDate: startDateTime,
          endDate: endDateTime,
          location: location,
          venue: venue,
          totalSeats: capacity as number,
          availableSeats: capacity as number,
          status: 'PUBLISHED',
        },
      });

      // Upload to cloudinary (Single Upload)
      const uploadEventImageToCloudinary: any = await cloudinaryUpload(
        (image as any).buffer,
      );

      // if Upload Fail
      if (uploadEventImageToCloudinary.error) {
        throw new CustomError(
          HttpRes.status.INTERNAL_SERVER_ERROR,
          HttpRes.message.INTERNAL_SERVER_ERROR,
          HttpRes.details.INTERNAL_SERVER_ERROR,
        );
      }

      const eventImage = await tx.eventMedia.create({
        data: {
          eventId: event.id,
          url: uploadEventImageToCloudinary.url,
        },
      });

      const eventTags = await tx.eventTag.createMany({
        data: (tags as any).map((tag: any) => ({
          eventId: event.id,
          name: tag,
        })),
      });

      const eventTicketTypes = await tx.ticketTypes.createMany({
        data: (ticketTypes as any).map((ticketType: any) => ({
          eventId: event.id,
          name: ticketType.name,
          price: ticketType.price,
          quantity: ticketType.quantity,
          description: ticketType.description,
          ticketType: ticketType.ticketType,
        })),
      });

      const eventPromotions = await tx.promotion.createMany({
        data: (promotions as any).map((promotion: any) => ({
          eventId: event.id,
          promoType: promotion.promoType,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          code: promotion.code,
          minPurchaseAmount: promotion.minPurchaseAmount || null,
          maxDiscountAmount: promotion.maxDiscountAmount || null,
          quota: promotion.quota,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
        })),
      });

      return {
        event,
        eventImage,
        eventTags,
        eventTicketTypes,
        eventPromotions,
      };
    });

    res
      .status(HttpRes.status.RESOURCE_CREATED)
      .json(
        ResponseHandler.success(
          HttpRes.message.RESOURCE_CREATED + ': Event Created 🎉✨',
          transaction,
        ),
      );
  } catch (error) {
    next(error);
  }
};
