import { Request, Response, NextFunction } from 'express';

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
};

// Error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'A record with this unique value already exists.';
  }

  // Handle Prisma record not found error
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found.';
  }

  // Handle Prisma foreign key or payload validation errors
  if (err.code === 'P2003' || err.code === 'P2000' || err.code === 'P2014') {
    statusCode = 400;
    message = 'Invalid data reference or constraint violation.';
  }

  // Handle database connection pool errors
  if (
    err.message?.includes('EMAXCONNSESSION') ||
    err.message?.includes('max clients reached') ||
    err.message?.includes('pool_size') ||
    err.message?.includes('connection pool') ||
    err.code === 'P1001' ||
    err.code === 'P1002' ||
    err.code === 'P1017'
  ) {
    statusCode = 503;
    message = 'Server database is currently busy. Please try again in a few seconds.';
  }

  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(isDev ? { stack: err.stack } : {}),
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
};