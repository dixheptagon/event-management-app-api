import multer from 'multer';
import { Request } from 'express';
import path from 'path';

export const uploadMulter = () => {
  const storage = multer.memoryStorage();

  return multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // limit file size 5MB
};
