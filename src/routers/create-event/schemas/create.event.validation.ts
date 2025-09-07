import * as Yup from 'yup';
import { PromotionValidationSchema } from './promotion.schema';

const EVENT_CATEGORIES = [
  'Music & Concerts',
  'Sports & Fitness',
  'Arts & Culture',
  'Food & Drink',
  'Technology',
  'Business',
  'Education',
  'Community',
  'Other',
] as const;

export const CreateEventSchema = Yup.object().shape({
  name: Yup.string()
    .required('Event name is required')
    .min(3, 'Event name must be at least 3 characters')
    .max(100, 'Event name must be less than 100 characters'),

  description: Yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(100000, 'Description must be less than 100000 characters'),

  category: Yup.string()
    .required('Category is required')
    .oneOf(EVENT_CATEGORIES, 'Please select a valid category'),

  startDate: Yup.date()
    .required('Start date is required')
    // date must be in the future not in the past or today
    .min(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      'Start date must be in the future(not in the past or today)',
    )
    .min(new Date(), 'Start date cannot be in the past'),

  endDate: Yup.date()
    .nullable()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),

  startTime: Yup.string()
    .required('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),

  endTime: Yup.string()
    .required('End time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),

  location: Yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters'),

  venue: Yup.string()
    .required('Venue is required')
    .min(2, 'Venue must be at least 2 characters'),

  capacity: Yup.number()
    .positive('Capacity must be a positive number')
    .integer('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(1000000, 'Capacity seems too large'),

  ticketTypes: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required(),
        name: Yup.string()
          .required('Ticket name is required')
          .min(2, 'Ticket name must be at least 2 characters'),
        quantity: Yup.number()
          .required('Quantity is required')
          .positive('Quantity must be positive')
          .integer('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1'),
        description: Yup.string().max(
          500,
          'Description must be less than 500 characters',
        ),
        ticketType: Yup.string()
          .required('Ticket type is required')
          .oneOf(['PAID', 'FREE'], 'Please select a valid ticket type'),

        price: Yup.number()
          .when('ticketType', {
            is: 'PAID',
            then: (schema) =>
              schema
                .required('Price is required for paid tickets')
                .min(0, 'Price cannot be negative')
                .max(10000000, 'Price seems too large'),
            otherwise: (schema) =>
              schema
                .notRequired()
                .default(0) // Set default 0 untuk FREE tickets
                .transform((value, originalValue) => {
                  // Handle empty string, null, undefined, NaN
                  if (
                    originalValue === '' ||
                    originalValue === null ||
                    originalValue === undefined ||
                    isNaN(value)
                  ) {
                    return 0; // Always return 0 for FREE tickets
                  }
                  return Number(value);
                }),
          })
          .transform((value, originalValue) => {
            // Global transform - handle NaN dan empty values
            if (
              isNaN(value) ||
              originalValue === '' ||
              originalValue === null ||
              originalValue === undefined
            ) {
              return 0; // Default to 0
            }
            return Number(value);
          }),
      }),
    )
    .min(1, 'At least one ticket type is required')
    .required(),

  tags: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),

  // image: Yup.mixed()
  //   .required('Image is required')
  //   .test('fileSize', 'File size too large (max 5MB)', (value) => {
  //     if (!value) return true;
  //     return (value as File).size <= 5 * 1024 * 1024; // 5MB
  //   })
  //   .test('fileType', 'Unsupported file format', (value) => {
  //     if (!value) return true;
  //     return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(
  //       (value as File).type,
  //     );
  //   }),

  promotions: Yup.array().of(PromotionValidationSchema),

  isDraft: Yup.boolean().default(false),
});

// export type CreateEventTypeSchema = Yup.InferType<typeof CreateEventSchema>;
