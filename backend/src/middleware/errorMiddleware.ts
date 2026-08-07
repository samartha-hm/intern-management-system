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

  // Handle Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === 'P2002') {
    statusCode = 400;
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    message = `A record with this value already exists${target}.`;
  }

  // Handle Prisma record not found error
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found.';
  }

  res.status(statusCode);
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  res.json({
    message,
    stack: isProduction ? null : err.stack,
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
};