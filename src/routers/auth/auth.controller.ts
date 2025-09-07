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
import { DiscountType, UserRole } from '@prisma/client';
import { createToken } from '../../lib/utils/create.token';
import { ref } from 'process';
import { refreshToken } from '../../lib/utils/refresh.token';

const saltRounds = 10;
export const RegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let transaction: any;
  try {
    // validate request body
    const { fullname, email, password, role, usedReferralCode } =
      await RegisterSchema.validate(req.body, {
        abortEarly: false,
      });

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

    let referredBy = null;
    let referralPromotion = null;

    // Check if user used a referral code
    if (usedReferralCode) {
      const referrer = await database.user.findUnique({
        where: { referralCode: usedReferralCode },
        select: {
          id: true,
          fullname: true,
          referralPoints: true,
        },
      });

      if (!referrer) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          'Invalid referral code',
          'The referral code provided does not exist',
        );
      }

      referredBy = referrer.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Expiry in 2 hours
    const verificationExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Mulai transaction
    transaction = await database.$transaction(async (tx: any) => {
      // Generate unique referral code
      let referralCode;
      let isUnique = false;

      while (!isUnique) {
        referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existingCode = await database.user.findUnique({
          where: { referralCode },
        });
        if (!existingCode) {
          isUnique = true;
        }
      }

      // Create new user
      const user = await tx.user.create({
        data: {
          fullname,
          email,
          password: hashedPassword,
          role: role as UserRole,
          referralCode,
          referralPoints: 0,
          referredBy,
          verificationToken,
          verificationExpiry,
        },
        select: {
          id: true,
          fullname: true,
          email: true,
          role: true,
          referralCode: true,
          referralPoints: true,
          isVerified: true,
        },
      });

      let welcomePromotion = null;
      let referralTransaction = null;

      // Process referral rewards jika digunakan
      if (referredBy) {
        // Create referral transaction record
        referralTransaction = await tx.referralTransaction.create({
          data: {
            referrerId: referredBy,
            referredId: user.id,
            pointsEarned: 10000, // 10000 points per referral
            discountPercentage: 10,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        });

        // Update referrer's points
        await tx.user.update({
          where: { id: referredBy },
          data: {
            referralPoints: {
              increment: 10000,
            },
          },
        });

        // Find atau create referral-based promotion
        welcomePromotion = await tx.promotion.findFirst({
          where: {
            promoType: 'REFERRAL_BASED',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            deletedAt: null,
          },
        });

        // Jika belum ada, create general referral promotion
        if (!welcomePromotion) {
          welcomePromotion = await tx.promotion.create({
            data: {
              eventId: null,
              promoType: 'REFERRAL_BASED',
              discountType: 'PERCENTAGE',
              discountValue: 10,
              quota: 10000,
              startDate: new Date(),
              endDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
            },
          });
        }

        // Assign welcome bonus coupon
        await tx.userCoupon.create({
          data: {
            userId: user.id,
            promotionId: welcomePromotion.id,
            isUsed: false,
          },
        });
      }

      return {
        user,
        welcomePromotion,
        referralTransaction,
      };
    });

    // Create activation link dengan token
    const activationLink = `${env.ACTIVATION_ACCOUNT_URL}?token=${verificationToken}`;

    // Generate timestamp
    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send email verification link (di luar transaction)
    const templateHtmlDir = path.resolve(__dirname, '../../lib/template');
    const templateHtmlFile = 'account.activation.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
    const compiledTemplateHtml = Handlebars.compile(templateHtml);

    const htmlToSend = compiledTemplateHtml({
      username: transaction.user.fullname,
      activate_link: activationLink,
      expiry_hours: 2,
      current_year: new Date().getFullYear(),
      email_timestamp: currentTimestamp,
      referral_bonus: transaction.welcomePromotion
        ? `Welcome! You got a ${transaction.welcomePromotion.discountValue}% discount coupon for using a referral code!`
        : null,
    });

    await transporter.sendMail({
      from: 'Admin <sender@gmail.com>',
      to: transaction.user.email,
      subject: 'Account Activation - ticketin.id',
      html: htmlToSend,
    });

    // Prepare response data
    const responseData = {
      ...transaction.user,
      welcomeBonus: transaction.welcomePromotion
        ? {
            discountType: transaction.welcomePromotion.discountType,
            discountValue: transaction.welcomePromotion.discountValue,
            expiresAt: transaction.welcomePromotion.endDate,
            message: `You received ${transaction.welcomePromotion.discountValue}% welcome discount!`,
          }
        : null,
    };

    // Send response
    res
      .status(HttpRes.status.RESOURCE_CREATED)
      .json(
        ResponseHandler.success(
          HttpRes.message.RESOURCE_CREATED +
            `: user ${transaction.user.fullname} has been created${transaction.welcomePromotion ? ' with referral bonus' : ''}`,
          responseData,
        ),
      );
  } catch (error) {
    // Jika terjadi error, transaction akan di-rollback otomatis
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
        expiresIn: '1d', // 1 day expiration
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

export const SessionLoginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const decodedToken = res?.locals?.payload;

    // refresh token -> update expiry time
    const token = refreshToken(
      {
        id: decodedToken.id,
        email: decodedToken.email,
        role: decodedToken.role,
      },
      env.JWT_SECRET,
    );

    // find user by id
    const user = await database.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        fullname: true,
        role: true,
      },
    });

    // check if user exist
    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        HttpRes.details.NOT_FOUND + ' : User not found',
      );
    }

    // Send response
    return res.status(HttpRes.status.OPERATION_SUCCESSFUL).json(
      ResponseHandler.success(
        HttpRes.message.OPERATION_SUCCESSFUL + ' :Session login successful',
        {
          token,
          user,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
