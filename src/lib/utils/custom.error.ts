import { HttpRes } from '../constant/http.response';

export class CustomError extends Error {
  status: number;
  details: string;

  constructor(status: number, message: string, err?: string) {
    super(message);
    this.status = status;
    this.details = err || HttpRes.details.INTERNAL_SERVER_ERROR;
  }
}
