import { NextFunction, Request, Response } from 'express';
import database from '../../lib/config/prisma.client';
import { HttpRes } from '../../lib/constant/http.response';
import { ResponseHandler } from '../../lib/utils/response.handler';
import { CustomError } from '../../lib/utils/custom.error';

// Endpoint untuk validasi referral code
export const ValidateReferralController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { referralCode } = req.params;

    const referrer = await database.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: {
        id: true,
        fullname: true,
        referralCode: true,
        referralsMade: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!referrer) {
      return res
        .status(HttpRes.status.NOT_FOUND)
        .json(ResponseHandler.error('Referral code not found', null));
    }

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Valid referral code', {
        referrerName: referrer.fullname,
        referralCode: referrer.referralCode,
        totalReferrals: referrer.referralsMade.length,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Endpoint untuk melihat referral stats user
export const GetReferralStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = res.locals.payload; // Dari JWT token

    const user = await database.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralPoints: true,
        referralsMade: {
          include: {
            referred: {
              select: {
                id: true,
                fullname: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        referralsGot: {
          include: {
            referrer: {
              select: {
                fullname: true,
              },
            },
          },
        },
        coupons: {
          where: {
            isUsed: false,
            deletedAt: null,
          },
          include: {
            promotion: {
              select: {
                discountType: true,
                discountValue: true,
                endDate: true,
                promoType: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        'User not found',
        'User not found',
      );
    }

    const stats = {
      myReferralCode: user.referralCode,
      totalReferralPoints: user.referralPoints,
      totalReferrals: user.referralsMade.length,
      totalEarnings: user.referralsMade.reduce(
        (sum, ref) => sum + ref.pointsEarned,
        0,
      ),
      referralHistory: user.referralsMade.map((ref) => ({
        referredUser: ref.referred.fullname,
        pointsEarned: ref.pointsEarned,
        discountGiven: ref.discountPercentage,
        date: ref.createdAt,
      })),
      referredBy: user.referralsGot[0]?.referrer.fullname || null,
      availableCoupons: user.coupons.map((coupon) => ({
        discountType: coupon.promotion.discountType,
        discountValue: coupon.promotion.discountValue,
        expiresAt: coupon.promotion.endDate,
        type: coupon.promotion.promoType,
      })),
    };

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Referral stats retrieved successfully', stats),
      );
  } catch (error) {
    next(error);
  }
};

// Endpoint untuk menukar points dengan discount coupon
export const RedeemPointsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = res.locals.payload;
    const { pointsToRedeem } = req.body;

    const user = await database.user.findUnique({
      where: { id: userId },
      select: { referralPoints: true },
    });

    if (!user || user.referralPoints < pointsToRedeem) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        'Insufficient points',
        'You do not have enough points to redeem this reward',
      );
    }

    // Hitung discount berdasarkan points (100 points = 1%)
    const discountPercentage = Math.min(Math.floor(pointsToRedeem / 100), 50); // Max 50%

    // Find atau create redemption promotion
    let redemptionPromotion = await database.promotion.findFirst({
      where: {
        promoType: 'referral_based',
        discountType: 'percentage',
        discountValue: discountPercentage,
        startDate: { lte: new Date() },
        endDate: { gte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    });

    if (!redemptionPromotion) {
      redemptionPromotion = await database.promotion.create({
        data: {
          eventId: 1, // General promotion atau bisa dibuat nullable
          promoType: 'referral_based',
          discountType: 'percentage',
          discountValue: discountPercentage,
          quota: 100,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });
    }

    // Create user coupon
    await database.userCoupon.create({
      data: {
        userId,
        promotionId: redemptionPromotion.id,
        isUsed: false,
      },
    });

    // Deduct points from user
    await database.user.update({
      where: { id: userId },
      data: {
        referralPoints: {
          decrement: pointsToRedeem,
        },
      },
    });

    res.status(HttpRes.status.RESOURCE_CREATED).json(
      ResponseHandler.success('Points redeemed successfully', {
        discountType: redemptionPromotion.discountType,
        discountValue: redemptionPromotion.discountValue,
        expiryDate: redemptionPromotion.endDate,
        pointsUsed: pointsToRedeem,
        remainingPoints: user.referralPoints - pointsToRedeem,
      }),
    );
  } catch (error) {
    next(error);
  }
};
