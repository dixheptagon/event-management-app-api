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
    // Step 1: Extract raw data from request body
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
      promotions = [],
      isDraft = false,
    } = req.body;

    // Step 2: Parse JSON fields safely BEFORE validation
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

    // Step 3: Prepare data object with parsed arrays for validation
    const dataToValidate = {
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
      ticketTypes: parsedTicketTypes,
      tags: parsedTags,
      promotions: parsedPromotions,
      isDraft,
    };

    // Step 4: Validate the prepared data
    const validatedData = await CreateEventSchema.validate(dataToValidate, {
      abortEarly: false,
    });

    console.log('Validated data:', validatedData);
    console.log('>>>');

    // Step 5: Get user details from Authorization
    const decodedToken = res?.locals?.payload;

    // Check if user is exist in database
    const user = await database.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        HttpRes.details.NOT_FOUND + ' : User not found',
      );
    }

    // Step 6: Handle file upload
    let imageFile: Express.Multer.File | null = null;

    if (req.file) {
      imageFile = req.file;
    }

    console.log('Image file:', imageFile);

    // Step 7: Create DateTime objects
    let startDateTime: Date;
    let endDateTime: Date;

    try {
      // Combine date and time properly
      const startDateStr =
        validatedData.startDate instanceof Date
          ? validatedData.startDate.toISOString().split('T')[0]
          : validatedData.startDate;
      const endDateStr =
        validatedData.endDate instanceof Date
          ? validatedData.endDate.toISOString().split('T')[0]
          : validatedData.endDate;

      startDateTime = new Date(`${startDateStr}T${startTime}`);
      endDateTime = new Date(`${endDateStr}T${endTime}`);

      // Validate datetime
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date/time format');
      }

      if (startDateTime >= endDateTime) {
        throw new Error('End date must be after start date');
      }

      if (startDateTime <= new Date()) {
        throw new Error('Start date must be in the future');
      }
    } catch (dateError) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid date/time format',
        dateError instanceof Error
          ? dateError.message
          : 'Date validation failed',
      );
    }

    // Step 8: Database transaction
    console.log('Starting database transaction...');

    const transaction = await database.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          organizerId: decodedToken?.id,
          title: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          startDate: startDateTime,
          endDate: endDateTime,
          location: validatedData.location,
          venue: validatedData.venue,
          totalSeats: validatedData.capacity as number,
          availableSeats: validatedData.capacity as number,
          status: validatedData.isDraft ? 'DRAFT' : 'PUBLISHED',
        },
      });

      console.log('Event created:', event.id);

      // Handle image upload if exists
      let imageToUpload = null;
      if (imageFile) {
        try {
          console.log('Uploading image to cloudinary...');
          const uploadEventImageToCloudinary: any = await cloudinaryUpload(
            imageFile.buffer,
          );

          if (uploadEventImageToCloudinary.error) {
            throw new Error(
              'Cloudinary upload failed: ' + uploadEventImageToCloudinary.error,
            );
          }

          imageToUpload = await tx.eventMedia.create({
            data: {
              eventId: event.id,
              url: uploadEventImageToCloudinary.url,
            },
          });

          console.log('Image uploaded and saved:', imageToUpload.id);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new CustomError(
            HttpRes.status.INTERNAL_SERVER_ERROR,
            'Failed to upload image',
            uploadError instanceof Error
              ? uploadError.message
              : 'Image upload failed',
          );
        }
      }

      // Handle event tags
      const eventTags = await tx.eventTag.createMany({
        data: (validatedData.tags as any).map((tag: any) => ({
          eventId: event.id,
          tag: tag,
        })),
      });

      console.log('Event tags created:', eventTags);

      // Handle ticket types
      const eventTicketTypes = await tx.ticketTypes.createMany({
        data: (validatedData.ticketTypes as any).map((ticketType: any) => ({
          eventId: event.id,
          name: ticketType.name,
          price: ticketType.price,
          quantity: ticketType.quantity,
          description: ticketType.description,
          ticketType: ticketType.ticketType,
        })),
      });

      console.log('Ticket types created:', eventTicketTypes);

      // Handle event promotions
      let eventPromotions = null;
      if (parsedPromotions.length > 0) {
        // Step 1: Validate unique codes within the request
        const codesInRequest = parsedPromotions
          .map((p: any) => p.code)
          .filter(Boolean); // Remove null/empty codes

        const duplicatesInRequest = codesInRequest.filter(
          (code, index) => codesInRequest.indexOf(code) !== index,
        );

        if (duplicatesInRequest.length > 0) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            'Duplicate promotion codes in request',
            `Duplicate codes: ${duplicatesInRequest.join(', ')}`,
          );
        }

        // Step 2: Check existing codes in database
        if (codesInRequest.length > 0) {
          const existingCodes = await tx.promotion.findMany({
            where: {
              code: { in: codesInRequest },
              deletedAt: null, // If you use soft delete
            },
            select: { code: true },
          });

          if (existingCodes.length > 0) {
            const duplicateCodes = existingCodes.map((p) => p.code);
            throw new CustomError(
              HttpRes.status.CONFLICT,
              'Promotion code already exists',
              `Existing codes: ${duplicateCodes.join(', ')}`,
            );
          }
        }

        eventPromotions = await tx.promotion.createMany({
          data: (validatedData.promotions as any).map((promotion: any) => ({
            eventId: event.id,
            promoType: promotion.promoType,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            code: promotion.code,
            minPurchaseAmount: promotion.minPurchaseAmount,
            maxDiscountAmount: promotion.maxDiscountAmount,
            quota: promotion.quota,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
          })),
        });

        console.log('Event promotions created:', eventPromotions);
      }

      return {
        event,
        imageToUpload,
        eventTags,
        eventTicketTypes,
        eventPromotions,
      };
    });

    console.log('Database transaction completed.');
    console.log(transaction);

    // Step 8: Fetch complete event data with relations
    const completeEvent = await database.event.findUnique({
      where: { id: transaction.event.id },
      select: {
        organizer: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
        title: true,
        description: true,
        category: true,
        startDate: true,
        endDate: true,
        location: true,
        venue: true,
        totalSeats: true,
        availableSeats: true,
        status: true,
        eventMedia: {
          select: {
            url: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
        ticketTypes: {
          select: {
            name: true,
            price: true,
            quantity: true,
            description: true,
            ticketType: true,
          },
        },
        promotions: {
          select: {
            promoType: true,
            discountType: true,
            discountValue: true,
            code: true,
            minPurchaseAmount: true,
            maxDiscountAmount: true,
            quota: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    res.status(HttpRes.status.RESOURCE_CREATED).json(
      ResponseHandler.success(
        isDraft
          ? 'Event saved as draft successfully 🎉✨'
          : 'Event created and published successfully 🎉✨',
        {
          event: completeEvent,
          summary: {
            totalSeats: transaction.event.totalSeats,
            availableSeats: transaction.event.availableSeats,
            eventLocation: transaction.event.location,
            eventVenue: transaction.event.venue,
            hasImage: transaction.imageToUpload?.url ? true : false,
            tagsCount: parsedTags.length,
            ticketTypesCount: parsedTicketTypes.length,
            promotionsCount: parsedPromotions.length,
          },
        },
      ),
    );
  } catch (error) {
    console.error('CreateEventController error:', error);
    // Handle Yup validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res
        .status(HttpRes.status.BAD_REQUEST)
        .json(ResponseHandler.error('Validation failed', error.message));
    }

    next(error);
  }
};
