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
});
