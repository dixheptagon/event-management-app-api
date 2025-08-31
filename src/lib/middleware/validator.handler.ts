// MIDDLEWARE DAN VALIDATORS UNTUK REFERRAL SYSTEM

import { Request, Response, NextFunction } from 'express';
import { RegisterSchema } from '../../routers/auth/auth.validation';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';
import {
  PaginationSchema,
  RedeemPointsSchema,
  ReferralCodeParamSchema,
} from '../../routers/referral/referral.validation';
import database from '../config/prisma.client';

// Middleware untuk validasi register dengan referral
export const validateRegisterWithReferral = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate dan transform data
    const validatedData = await RegisterSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Transform usedReferralCode ke uppercase jika ada
    if (validatedData.usedReferralCode) {
      validatedData.usedReferralCode =
        validatedData.usedReferralCode.toUpperCase();
    }

    // Replace request body dengan validated data
    req.body = validatedData;
    next();
  } catch (error: any) {
    const errorMessages = error.inner?.map((err: any) => ({
      field: err.path,
      message: err.message,
    })) || [{ field: 'validation', message: error.message }];

    next(
      new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid input data',
        errorMessages,
      ),
    );
  }
};

// Middleware untuk validasi redeem points
export const validateRedeemPoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await RedeemPointsSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    req.body = validatedData;
    next();
  } catch (error: any) {
    const errorMessages = error.inner?.map((err: any) => ({
      field: err.path,
      message: err.message,
    })) || [{ field: 'validation', message: error.message }];

    next(
      new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid points redemption data',
        errorMessages,
      ),
    );
  }
};

// Middleware untuk validasi referral code parameter
export const validateReferralCodeParam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await ReferralCodeParamSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    req.params = validatedData;
    next();
  } catch (error: any) {
    next(
      new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid Referral Code',
        'Referral code format is invalid',
      ),
    );
  }
};

// Middleware untuk validasi pagination
export const validatePagination = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await PaginationSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    req.query = validatedData as any;
    next();
  } catch (error: any) {
    next(
      new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Invalid Pagination',
        'Invalid pagination parameters',
      ),
    );
  }
};

// Middleware untuk check minimum points requirement
export const checkMinimumPoints = (minPoints: number = 100) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = res.locals.payload;

      const user = await database.user.findUnique({
        where: { id: userId },
        select: { referralPoints: true },
      });

      if (!user || user.referralPoints < minPoints) {
        return next(
          new CustomError(
            HttpRes.status.BAD_REQUEST,
            'Insufficient Points',
            `You need at least ${minPoints} points to perform this action`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting middleware untuk referral actions
export const referralRateLimit = (
  windowMs: number = 60000,
  maxAttempts: number = 5,
) => {
  const attempts = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip + (res.locals.payload.userId || 'anonymous');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(
      (time: number) => time > windowStart,
    );

    if (recentAttempts.length >= maxAttempts) {
      return next(
        new CustomError(
          HttpRes.status.TOO_MANY_REQUESTS,
          'Rate Limit Exceeded',
          'Too many referral attempts. Please try again later.',
        ),
      );
    }

    // Add current attempt
    recentAttempts.push(now);
    attempts.set(identifier, recentAttempts);

    next();
  };
};

// Middleware untuk log referral activities
export const logReferralActivity = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (data: any) {
      // Log successful referral activities
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log({
          timestamp: new Date().toISOString(),
          action,
          userId: res.locals.payload.userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          data: {
            referralCode:
              req.body?.usedReferralCode || req.params?.referralCode,
            pointsInvolved: req.body?.pointsToRedeem,
          },
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};
