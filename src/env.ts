import dotenv from 'dotenv';
import * as Yup from 'yup';

// config dotenv
dotenv.config();

// create type for config
export interface Config {
  PORT: number;
  NODE_ENV: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
  // CLOUD_NAME: string;
  // CLOUD_API_KEY: string;
  // CLOUD_API_SECRET: string;
  DATABASE_URL: string;
  DOMAIN_URL: string;
  ACTIVATION_ACCOUNT_URL: string;
  NODEMAILER_APP_EMAIL: string;
  NODEMAILER_APP_PASSWORD: string;
}

// create schema for validation
const schema = Yup.object().shape({
  PORT: Yup.number().default(2000).required(),
  NODE_ENV: Yup.string().default('development').required(),
  DIRECT_URL: Yup.string().required('DIRECT_URL is required'),
  JWT_SECRET: Yup.string().required('JWT_SECRET is required'),
  // CLOUD_NAME: Yup.string().required('CLOUD_NAME is required'),
  // CLOUD_API_KEY: Yup.string().required('CLOUD_API_KEY is required'),
  // CLOUD_API_SECRET: Yup.string().required('CLOUD_API_SECRET is required'),
  DATABASE_URL: Yup.string().required('DATABASE_URL is required'),
  DOMAIN_URL: Yup.string().required('DOMAIN_URL is required'),
  ACTIVATION_ACCOUNT_URL: Yup.string().required(
    'ACTIVATION_ACCOUNT_URL is required',
  ),
  NODEMAILER_APP_EMAIL: Yup.string().required(
    'NODEMAILER_APP_EMAIL is required',
  ),
  NODEMAILER_APP_PASSWORD: Yup.string().required(
    'NODEMAILER_APP_PASSWORD is required',
  ),
});

// validate config
try {
  schema.validateSync(process.env, { abortEarly: false });
} catch (error) {
  console.error('Invalid config:', (error as Yup.ValidationError).errors);
  process.exit(1);
}

// load config
const loadConfig = () => {
  return schema.cast(process.env);
};

// export config
export default Object.freeze<Config>({
  ...loadConfig(),
});
