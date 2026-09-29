/**
 * Application-specific error class.
 *
 * Every error thrown in the app should be an AppError. The error middleware
 * reads `statusCode` and `code` to produce a consistent JSON shape:
 *   { success: false, error: { code, message } }
 *
 * Express 5 automatically forwards errors thrown inside async handlers
 * to the error middleware — no need for try/catch wrappers.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
