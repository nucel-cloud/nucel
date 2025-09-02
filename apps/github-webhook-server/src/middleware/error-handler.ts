import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode: number, details?: any) {
    super(statusCode, `GitHub API Error: ${message}`, 'GITHUB_API_ERROR', details);
  }
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export async function errorHandler(c: Context, next: Next): Promise<Response | void> {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    
    // Generate request ID for tracking
    const requestId = c.get('requestId') || crypto.randomUUID();
    
    let statusCode = 500;
    let errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      }
    };

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorResponse.error.code = error.code || 'APP_ERROR';
      errorResponse.error.message = error.message;
      errorResponse.error.details = error.details;
    } else if (error instanceof HTTPException) {
      statusCode = error.status;
      errorResponse.error.code = 'HTTP_EXCEPTION';
      errorResponse.error.message = error.message;
    } else if (error instanceof ZodError) {
      statusCode = 400;
      errorResponse.error.code = 'VALIDATION_ERROR';
      errorResponse.error.message = 'Invalid request data';
      errorResponse.error.details = error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
    } else if (error instanceof Error) {
      // Check if it's a GitHub API error
      if (error.message.includes('GitHub')) {
        statusCode = 502;
        errorResponse.error.code = 'GITHUB_API_ERROR';
        errorResponse.error.message = error.message;
      } else {
        errorResponse.error.message = 
          process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred';
      }
    }

    // Add rate limit headers if applicable
    if (error instanceof RateLimitError && error.details?.retryAfter) {
      c.header('Retry-After', String(error.details.retryAfter));
    }

    return c.json(errorResponse, statusCode === 400 ? 400 : statusCode === 401 ? 401 : statusCode === 403 ? 403 : statusCode === 404 ? 404 : statusCode === 429 ? 429 : statusCode === 502 ? 502 : statusCode === 503 ? 503 : 500);
  }
}

export function asyncHandler<T extends any[]>(
  fn: (c: Context, ...args: T) => Promise<any>
) {
  return (c: Context, ...args: T) => {
    return Promise.resolve(fn(c, ...args)).catch((error) => {
      throw error;
    });
  };
}