import { ErrorRequestHandler } from "express";

export interface HttpErrorProperties {
  statusCode: number;
  message: string;

  /// String for API use e.x. do different 401 errors by users
  reason?: string;

  /// Extra debug message for the server logs.
  /// Can contain sensitive data; not for dispatching through REST interface.
  details?: string;
}

export class HttpError extends Error {
  statusCode: number;
  reason?: string;
  details?: string;

  constructor(props: HttpErrorProperties)
  {
    super(props.message);
    this.name = "HttpError";
    this.statusCode = props.statusCode;
    this.reason = props.reason;
    this.details = props.details;
  }
}

export const middleware : ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    console.error(`${err.statusCode} ${err.reason} ${err.message}; ${err.details}`);
  }
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const response = {
    success: false,
    error: err instanceof Error ? err.message : 'Unknown error occurred',
    reason: err instanceof HttpError ? err.reason : undefined
  };
  res.status(statusCode).json(response);
} 