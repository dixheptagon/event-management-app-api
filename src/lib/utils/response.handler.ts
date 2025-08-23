export class ResponseHandler {
  success: boolean;
  message: string;
  data?: any | null;
  error?: string | string[] | null;
  count?: number;

  constructor(
    success: boolean,
    message: string,
    data?: any | null,
    error?: string | string[] | null,
  ) {
    this.success = success;
    this.message = message;
    if (success) {
      if (data !== undefined) {
        this.data = data;
        this.count = data?.length || 0;
      }
    } else {
      if (error !== undefined) {
        this.error = error;
      }
    }
  }

  static success(message: string, data: any) {
    return new ResponseHandler(true, message, data);
  }

  static error(message: string, error: string | string[] | null) {
    return new ResponseHandler(false, message, undefined, error);
  }
}
