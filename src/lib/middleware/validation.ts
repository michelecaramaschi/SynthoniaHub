import { NextApiRequest, NextApiResponse } from 'next';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const validated = schema.parse(req.body);
        req.body = validated;
        return handler(req, res);
      } catch (error: any) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors || error.message,
        });
      }
    };
  };
}

export function withErrorHandler(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  };
}
