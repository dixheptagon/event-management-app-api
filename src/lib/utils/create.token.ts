import jwt, { SignOptions } from 'jsonwebtoken';

export const createToken = (
  payload: any,
  privateKey: string,
  options: SignOptions,
) => {
  return jwt.sign(payload, privateKey, options);
};
