import type { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validator?: (val: unknown) => { valid: boolean; error?: string };
}

export function validateGhanaPhone(phone: string): { valid: boolean; normalized?: string; carrier?: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  let normalized = cleaned;
  if (cleaned.startsWith('0')) {
    normalized = '+233' + cleaned.substring(1);
  } else if (cleaned.startsWith('233')) {
    normalized = '+' + cleaned;
  } else if (!cleaned.startsWith('+233')) {
    // If international but not Ghana
    if (/^\+\d{10,15}$/.test(cleaned)) {
      return { valid: true, normalized: cleaned, carrier: 'International' };
    }
    return { valid: false, error: 'Invalid Ghanaian or international phone format (e.g. +233 24 123 4567 or 0241234567)' };
  }

  // Validate Ghana 9-digit suffix: +233 XX XXX XXXX
  const ghanaMatch = normalized.match(/^\+233(\d{2})(\d{7})$/);
  if (!ghanaMatch) {
    return { valid: false, error: 'Invalid Ghanaian phone number format' };
  }

  const prefix = ghanaMatch[1];
  let carrier = 'Unknown';

  // Telecel: 020, 050
  if (['20', '50'].includes(prefix)) {
    carrier = 'Telecel Cash';
  }
  // MTN: 024, 025, 053, 054, 055, 059
  else if (['24', '25', '53', '54', '55', '59'].includes(prefix)) {
    carrier = 'MTN MoMo';
  }
  // AT (AirtelTigo): 026, 027, 056, 057
  else if (['26', '27', '56', '57'].includes(prefix)) {
    carrier = 'AT Money';
  }

  return { valid: true, normalized, carrier };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Invalid email address format' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must include at least one number' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one uppercase letter' };
  }

  return { valid: true };
}

export function validateCashierPin(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'Cashier PIN is required' };
  }

  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, error: 'PIN must be exactly 4 numeric digits' };
  }

  return { valid: true };
}

export function validateGhanaPostAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'GhanaPost digital address is required' };
  }

  const trimmed = address.trim().toUpperCase();
  // Format: 2 letters, 3-4 digits, 4 digits (e.g. GA-183-4921 or AK-039-1234)
  if (!/^[A-Z]{2}-\d{3,4}-\d{4}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid GhanaPost GPS format (expected format e.g. GA-183-4921)' };
  }

  return { valid: true };
}

export function validateBody(rules: ValidationRule[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};
    const errors: Record<string, string> = {};

    for (const rule of rules) {
      const val = body[rule.field];

      if (rule.required && (val === undefined || val === null || val === '')) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }

      if (val !== undefined && val !== null) {
        if (rule.type) {
          const actualType = Array.isArray(val) ? 'array' : typeof val;
          if (actualType !== rule.type) {
            errors[rule.field] = `${rule.field} must be of type ${rule.type}`;
            continue;
          }
        }

        if (rule.validator) {
          const result = rule.validator(val);
          if (!result.valid) {
            errors[rule.field] = result.error || `Invalid ${rule.field}`;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'One or more request parameters failed validation',
          details: errors
        }
      });
      return;
    }

    next();
  };
}
