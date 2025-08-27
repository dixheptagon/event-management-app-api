import { NextFunction, Request, Response } from 'express';
import {
  LoginSchema,
  RegisterSchema,
  ResendVerificationSchema,
  VerifyEmailSchema,
} from './auth.validation';
import database from '../../lib/config/prisma.client';
import { CustomError } from '../../lib/utils/custom.error';
import { HttpRes } from '../../lib/constant/http.response';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import env from '../../env';
import crypto from 'crypto';
import transporter from '../../lib/config/nodemailer.transporter';
import { ResponseHandler } from '../../lib/utils/response.handler';
import { UserRole } from '@prisma/client';
import { createToken } from '../../lib/utils/create.token';

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
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Expiry in 2 hours
    const verificationExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Hours

    // Generate Refferal Code
    const referralCode = crypto.randomBytes(4).toString('hex'); // 4 characters

    // Create new user into database
    const user = await database.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        role: role as UserRole,
        referralCode,
        verificationToken,
        verificationExpiry,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        referralCode: true,
        isVerified: true,
      },
    });

    // Create activation link with token
    const activationLink = `${env.ACTIVATION_ACCOUNT_URL}?token=${verificationToken}`;

    // Generate timestamp di server
    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send email verification link
    const templateHtmlDir = path.resolve(__dirname, '../../lib/template');
    const templateHtmlFile = 'account.activation.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');

    const compiledTemplateHtml = Handlebars.compile(templateHtml);

    // logo_url path
    const logo_url_path = path.resolve(
      __dirname,
      '../../lib/template/logo.png',
    );

    const htmlToSend = compiledTemplateHtml({
      username: user.fullname,
      activate_link: activationLink,
      expiry_hours: 2, // 2 hours
      current_year: new Date().getFullYear(),
      email_timestamp: currentTimestamp,
      logo_url: logo_url_path,
    });

    await transporter.sendMail({
      from: 'Admin <sender@gmail.com>',
      to: user.email,
      subject: 'Account Activation - ticketin.id',
      html: htmlToSend,
    });

    // Send response
    res
      .status(HttpRes.status.RESOURCE_CREATED)
      .json(
        ResponseHandler.success(
          HttpRes.message.RESOURCE_CREATED +
            `: user ${user.fullname} has been created`,
          user,
        ),
      );
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
    // Validate query parameters
    const { token } = await VerifyEmailSchema.validate(req.query, {
      abortEarly: false,
    });

    // Find user with matching token and not expired
    const user = await database.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    // Check if user token is invalid
    if (!user) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid verification token',
        'The verification link is invalid. Please request a new verification email.',
      );
    }

    //  Check if user token is expired
    if (user.verificationExpiry && user.verificationExpiry <= new Date()) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Verification token has expired',
        'The verification link has expired. Please request a new verification email.',
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw new CustomError(
        HttpRes.status.CONFLICT, // 409 Conflict lebih cocok untuk kasus ini
        'Email already verified',
        'Your email address has already been verified. You can log in directly.',
      );
    }

    // Update user as verified and clear verification fields
    const verifiedUser = await database.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Success response
    return res.status(HttpRes.status.ACTION_COMPLETED).json({
      success: true,
      message:
        'Email verified successfully! You can now login to your account.',
      data: {
        user: verifiedUser,
        verifiedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const ResendVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const { email } = await ResendVerificationSchema.validate(req.body, {
      abortEarly: false,
    });

    // Find user
    const user = await database.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        'User not found',
        'No account found with this email address.',
      );
    }

    // Check if already verified
    if (user.isVerified) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Account already verified',
        'This account has already been verified. You can login now.',
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Hours

    // Update user with new token
    await database.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpiry,
      },
    });

    // Send new verification email
    const activationLink = `${env.ACTIVATION_ACCOUNT_URL}?token=${verificationToken}`;

    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const templateHtmlDir = path.resolve(__dirname, '../../lib/template');
    const templateHtmlFile = 'account.activation.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');

    const compiledTemplateHtml = Handlebars.compile(templateHtml);

    // logo_url path
    const logo_url_path = path.resolve(
      __dirname,
      '../../lib/template/logo.png',
    );

    const htmlToSend = compiledTemplateHtml({
      username: user.fullname,
      activate_link: activationLink,
      expiry_hours: 2, // 2 hours
      current_year: new Date().getFullYear(),
      email_timestamp: currentTimestamp,
      logo_url: logo_url_path,
    });

    await transporter.sendMail({
      from: 'Admin <sender@gmail.com>',
      to: user.email,
      subject: 'Account Activation - ticketin.id (Resent)',
      html: htmlToSend,
    });

    // Success response
    return res.status(HttpRes.status.OK).json({
      status: 'success',
      message: 'New verification email has been sent. Please check your email.',
      data: {
        email: user.email,
        expiresAt: verificationExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const LoginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const { email, password } = await LoginSchema.validate(req.body, {
      abortEarly: false,
    });

    // Check if user already exits in the database
    const user = await database.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        HttpRes.details.NOT_FOUND + ' : Email or password is incorrect',
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        HttpRes.details.UNAUTHORIZED + ' : User is not verified',
      );
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        HttpRes.details.UNAUTHORIZED + ' : Email or password is incorrect',
      );
    }

    // Generate JWT token
    const token = createToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      {
        expiresIn: '1d',
      },
    );

    // Send response
    res
      .header('Authorization', `Bearer ${token}`)
      .status(HttpRes.status.ACTION_COMPLETED)
      .json(
        ResponseHandler.success(
          HttpRes.message.ACTION_COMPLETED +
            ` : User ${user.fullname} logged in successfully`,
          {
            token,
            user: { fullname: user.fullname, role: user.role },
          },
        ),
      );
  } catch (error) {
    next(error);
  }
};
