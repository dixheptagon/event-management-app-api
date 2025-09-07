import * as Yup from 'yup';

// Validation untuk redeem points
export const RedeemPointsSchema = Yup.object({
  pointsToRedeem: Yup.number()
    .required('Points to redeem is required')
    .min(100, 'Minimum redemption is 100 points')
    .max(5000, 'Maximum redemption is 5000 points per transaction')
    .integer('Points must be a whole number')
    .test('multiple-of-100', 'Points must be in multiples of 100', (value) => {
      return value % 100 === 0;
    }),
});

// Validation untuk referral code parameter
export const ReferralCodeParamSchema = Yup.object({
  referralCode: Yup.string()
    .required('Referral code is required')
    .length(8, 'Referral code must be 8 characters')
    .uppercase('Referral code must be uppercase')
    .matches(/^[A-F0-9]{8}$/, 'Invalid referral code format'),
});

// Validation untuk pagination (untuk referral stats)
export const PaginationSchema = Yup.object({
  page: Yup.number()
    .optional()
    .min(1, 'Page must be at least 1')
    .integer('Page must be a whole number')
    .default(1),

  limit: Yup.number()
    .optional()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .integer('Limit must be a whole number')
    .default(10),
});

// Validation untuk update referral settings (jika diperlukan admin panel)
export const ReferralSettingsSchema = Yup.object({
  pointsPerReferral: Yup.number()
    .required('Points per referral is required')
    .min(1, 'Points per referral must be at least 1')
    .max(1000, 'Points per referral cannot exceed 1000')
    .integer('Points per referral must be a whole number'),

  welcomeDiscountPercentage: Yup.number()
    .required('Welcome discount percentage is required')
    .min(1, 'Welcome discount must be at least 1%')
    .max(50, 'Welcome discount cannot exceed 50%')
    .integer('Welcome discount must be a whole number'),

  pointsToPercentageRatio: Yup.number()
    .required('Points to percentage ratio is required')
    .min(10, 'Ratio must be at least 10 points per 1%')
    .max(1000, 'Ratio cannot exceed 1000 points per 1%')
    .integer('Ratio must be a whole number'),
});

// Helper validation functions
export const validateReferralCode = (code: string): boolean => {
  const schema = Yup.string()
    .length(8, 'Invalid length')
    .matches(/^[A-F0-9]{8}$/, 'Invalid format');

  try {
    schema.validateSync(code);
    return true;
  } catch {
    return false;
  }
};

export const validatePoints = (points: number): boolean => {
  return points >= 100 && points <= 5000 && points % 100 === 0;
};
