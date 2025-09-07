import * as Yup from 'yup';

export const RegisterSchema = Yup.object().shape({
  fullname: Yup.string().required('Fullname is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      'Password must be at least 8 characters long and contain at least one letter and one number',
    ),
  role: Yup.string().required('Role is required'),
  usedReferralCode: Yup.string()
    .optional()
    .length(8, 'Referral code must be 8 characters')
    .uppercase('Referral code must be uppercase')
    .matches(
      /^[A-F0-9]{8}$/,
      'Referral code must contain only uppercase letters and numbers',
    ),
});

export const VerifyEmailSchema = Yup.object().shape({
  token: Yup.string().required('Verification Token is required'),
});

export const ResendVerificationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

export const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      'Password must be at least 8 characters long and contain at least one letter and one number',
    ),
});
