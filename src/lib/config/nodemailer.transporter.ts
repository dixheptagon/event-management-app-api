import nodemailer from 'nodemailer';

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_APP_EMAIL,
    pass: process.env.NODEMAILER_APP_PASSWORD,
  },
});

export default transporter;
