import { NextFunction, Request, Response } from 'express';
import { RegisterSchema } from './auth.validation';
import database from '../../lib/config/prisma.client';
import { CustomError } from '../../lib/utils/custom.error';
import { HttpRes } from '../../lib/constant/http.response';
import bcryp from 'bcrypt';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import env from '../../env';
import crypto from 'crypto';
import transporter from '../../lib/config/nodemailer.transporter';
import { ResponseHandler } from '../../lib/utils/response.handler';

const saltRounds = 10;
export const RegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // validate request body
    const { fullname, email, password, role } = await RegisterSchema.validate(
      req.body,
      {
        abortEarly: false,
      },
    );

    // Check if email already exists in the database
    const existingUser = await database.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError(
        HttpRes.status.CONFLICT,
        HttpRes.message.CONFLICT,
        HttpRes.details.CONFLICT + ' : Email already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcryp.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // 15 minutes
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Create new user into database
    const user = await database.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        role: role,
        verificationToken,
        verificationExpiry,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    // Create activation link with token
    const activationLink = `${env.ACTIVATION_ACCOUNT_URL}?token=${verificationToken}`;

    // Send email verification link
    const templateHtmlDir = path.resolve(__dirname, '../../lib/templates');
    const templateHtmlFile = 'account.activation.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');

    const compiledTemplateHtml = Handlebars.compile(templateHtml);
    const htmlToSend = compiledTemplateHtml({
      username: user.fullname,
      activate_link: activationLink,
      expiry_minutes: '15',
      current_year: new Date().getFullYear(),
    });

    await transporter.sendMail({
      from: 'Admin <sender@gmail.com>',
      to: user.email,
      subject: 'Account Activation - Event APP',

      html: htmlToSend,
    });

    // Send response
    res
      .status(HttpRes.status.RESOURCE_UPDATED)
      .json(ResponseHandler.success(HttpRes.message.RESOURCE_UPDATED, null));
  } catch (error) {
    next(error);
  }
};

export const VerifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid verification token',
        'Token is required',
      );
    }

    const user = await database.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpiry: {
          gt: new Date(), // Check if not expired
        },
      },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid or expired verification token',
        'Please request a new verification email',
      );
    }

    // Update user as verified
    await database.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now login.',
    });
  } catch (error) {
    next(error);
  }
};
