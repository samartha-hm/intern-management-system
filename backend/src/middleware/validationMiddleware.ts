import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      res.status(400);
      return next(new Error(`Validation Error: ${errorMessage}`));
    }

    req.body = value;
    next();
  };
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
  }),
  firstName: Joi.string().max(100).required().trim(),
  lastName: Joi.string().max(100).required().trim(),
  phone: Joi.string().max(20).optional().allow('', null),
  department: Joi.string().max(100).optional().allow('', null),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(1).max(128).required(),
});

export const createUserSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
  }),
  firstName: Joi.string().max(100).required().trim(),
  lastName: Joi.string().max(100).required().trim(),
  role: Joi.string().valid('ADMIN', 'HR', 'MENTOR', 'INTERN').optional(),
  department: Joi.string().max(100).optional().allow('', null),
  contractDays: Joi.number().integer().min(1).max(365).optional(),
});
