import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate.middleware';

describe('Validate Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  const testSchema = z.object({
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be at least 18'),
  });

  it('should call next() when request body is valid', async () => {
    mockRequest.body = { email: 'test@example.com', age: 25 };
    const middleware = validateRequest({ body: testSchema });

    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 400 with formatted errors when validation fails', async () => {
    mockRequest.body = { email: 'not-an-email', age: 15 };
    const middleware = validateRequest({ body: testSchema });

    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be at least 18' },
      ],
    });
  });
});
