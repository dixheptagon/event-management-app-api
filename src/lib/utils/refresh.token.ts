import jwt from 'jsonwebtoken';

export const refreshToken = (payload: any, privateKey: string) => {
  return jwt.sign(payload, privateKey, { expiresIn: '1d' });
};
