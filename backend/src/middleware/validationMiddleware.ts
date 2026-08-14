import { Request, Response, NextFunction } from 'express';

export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter((field) => {
      const val = req.body[field];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      res.status(400);
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    next();
  };
};
