import * as Yup from 'yup';

// Schema for Single Promotion
export const PromotionValidationSchema = Yup.object().shape({
  promoType: Yup.string()
    .required('Promotion type is required')
    .oneOf(
      ['EARLY_BIRD', 'FLASH_SALE', 'BUNDLE', 'REFERRAL', 'VOUCHER'],
      'Invalid promotion type',
    ),

  discountType: Yup.string()
    .required('Discount type is required')
    .oneOf(['PERCENTAGE', 'FIXED_AMOUNT'], 'Invalid discount type'),

  discountValue: Yup.number()
    .required('Discount value is required')
    .positive('Discount value must be positive')
    .when('discountType', {
      is: 'PERCENTAGE',
      then: (schema) => schema.max(100, 'Percentage cannot exceed 100%'),
      otherwise: (schema) =>
        schema.min(1000, 'Minimum discount amount is Rp 1,000'),
    }),

  code: Yup.string()
    .required('Promo code is required')
    .matches(
      /^[A-Z0-9_]+$/,
      'Promo code can only contain uppercase letters, numbers, and underscores',
    )
    .min(3, 'Promo code must be at least 3 characters')
    .max(20, 'Promo code cannot exceed 20 characters'),

  minPurchaseAmount: Yup.number()
    .transform((value, originalValue) => {
      if (
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return null; // Return null instead of NaN
      }
      return Number(originalValue);
    })
    .nullable()
    .optional()
    .positive('Minimum purchase amount must be positive')
    .min(1000, 'Minimum purchase amount should be at least Rp 1,000')
    .max(100000000, 'Maximum purchase amount is Rp 100,000,000'),

  maxDiscountAmount: Yup.number()
    .transform((value, originalValue) => {
      if (
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return null; // Return null instead of NaN
      }
      return Number(originalValue);
    })
    .nullable()
    .optional()
    .positive('Maximum discount amount must be positive')
    .min(1000, 'Minimum discount amount should be at least Rp 1,000')
    .when(['discountType', 'minPurchaseAmount'], {
      is: (discountType: string, minPurchase: number) =>
        discountType === 'PERCENTAGE' && minPurchase,
      then: (schema) =>
        schema.min(1000, 'Maximum discount should be at least Rp 1,000'),
    }),

  quota: Yup.number()
    .required('Usage quota is required')
    .positive('Quota must be positive')
    .integer('Quota must be a whole number')
    .min(1, 'Minimum quota is 1')
    .max(100000, 'Maximum quota is 100,000'),

  startDate: Yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date cannot be in the past'),

  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),

  isActive: Yup.boolean().default(true),
});
