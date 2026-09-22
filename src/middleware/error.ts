import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function notFoundHandler(req: Request, res: Response): void {
  // If requesting an API route, return JSON
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`
      }
    });
    return;
  }

  // Otherwise return 404 plain
  res.status(404).send('Not Found');
}

export function globalErrorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  // Avoid leaking internal database syntax or file paths
  const statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred';

  // Sanitize internal SQLite errors
  if (message.includes('SqliteError') || message.includes('UNIQUE constraint failed')) {
    code = 'DATABASE_CONFLICT';
    if (message.includes('UNIQUE constraint failed: users.tenant_id, users.email')) {
      message = 'A user with this email address already exists in your organization';
    } else if (message.includes('UNIQUE constraint failed: users.tenant_id, users.phone_number')) {
      message = 'A user with this phone number already exists in your organization';
    } else if (message.includes('UNIQUE constraint failed: devices.device_identifier')) {
      message = 'A device with this terminal identifier is already registered';
    } else {
      message = 'A resource with these unique attributes already exists';
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.path}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {})
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}
