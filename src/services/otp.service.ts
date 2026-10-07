import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import { AuditService } from './audit.service.ts';

export interface OtpSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  debugCode?: string; // Included only in non-production/sandbox environments for automated testing
}

export interface IOtpProvider {
  readonly name: string;
  sendOtp(recipient: string, code: string, purpose: string): Promise<OtpSendResult>;
}

/**
 * Sandbox OTP Provider for development and automated testing.
 * Explicitly decoupled from real telecom providers (MTN, Telecel, AT, Twilio, etc.).
 */
export class SandboxOtpProvider implements IOtpProvider {
  public readonly name = 'sandbox';

  public async sendOtp(recipient: string, code: string, purpose: string): Promise<OtpSendResult> {
    const messageId = `sbx_${crypto.randomBytes(8).toString('hex')}`;
    return {
      success: true,
      messageId,
      provider: this.name,
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined
    };
  }
}

import { config } from '../config/env.ts';

/**
 * Moolre SMS OTP Provider.
 * Sends a real SMS via the Moolre SMS Gateway API.
 * https://docs.moolre.com
 *
 * Required env vars:
 *   MOOLRE_VAS_KEY   – Your JWT VAS API key
 *   MOOLRE_SENDER_ID – Approved sender ID (default: Business_Ad)
 */
export class MoolreOtpProvider implements IOtpProvider {
  public readonly name = 'moolre';
  private readonly vasKey: string;
  private readonly senderId: string;
  private readonly apiUrl = 'https://api.moolre.com/open/sms/send';

  constructor(vasKey?: string, senderId?: string) {
    this.vasKey = vasKey || config.moolreVasKey;
    this.senderId = senderId || config.moolreSenderId || 'Business_Ad';
  }

  public async sendOtp(recipient: string, code: string, purpose: string): Promise<OtpSendResult> {
    const message = `Your SikaPOS verification code is: ${code}. Valid for 10 minutes. Do not share it.`;

    // Normalise number to international format (strip leading 0, prepend 233 for Ghana)
    let phone = recipient.replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '233' + phone.slice(1);
    } else if (phone.startsWith('+')) {
      phone = phone.slice(1); // strip leading +
    }

    const params = new URLSearchParams({
      type: '1',
      senderid: this.senderId,
      recipient: phone,
      message,
    });

    try {
      const response = await fetch(`${this.apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-API-VASKEY': this.vasKey,
          'Accept': 'application/json',
        },
      });

      const json = (await response.json()) as { status: number; code: string; message: string };

      if (json.status === 1) {
        return {
          success: true,
          messageId: json.code,
          provider: this.name,
        };
      }

      return {
        success: false,
        provider: this.name,
        error: `Moolre error [${json.code}]: ${json.message}`,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: `Moolre network error: ${err?.message || String(err)}`,
      };
    }
  }
}


export interface OtpVerificationResult {
  valid: boolean;
  reason?: string;
  code?: 'EXPIRED_CODE' | 'MAX_ATTEMPTS_EXCEEDED' | 'ALREADY_USED' | 'INCORRECT_CODE' | 'NOT_FOUND';
  remainingAttempts?: number;
}

export class OtpService {
  private db: Database.Database;
  private provider: IOtpProvider;
  private auditService: AuditService;
  public cooldownSeconds: number;

  constructor(customDb?: Database.Database, customProvider?: IOtpProvider, cooldownSeconds?: number) {
    this.db = customDb || getDb();
    if (customProvider) {
      this.provider = customProvider;
    } else if (config.otpProvider === 'moolre') {
      this.provider = new MoolreOtpProvider();
    } else {
      this.provider = new SandboxOtpProvider();
    }
    this.auditService = new AuditService(this.db);
    this.cooldownSeconds = cooldownSeconds !== undefined
      ? cooldownSeconds
      : (config.nodeEnv === 'test' ? 0 : 60);
  }

  private hashOtp(code: string, salt: string): string {
    return crypto.scryptSync(code, salt, 32).toString('hex');
  }

  public async requestOtp(
    recipient: string,
    purpose: 'merchant_signup' | 'cashier_login' | 'password_reset'
  ): Promise<{ success: boolean; expiresAt: string; debugCode?: string }> {
    const now = new Date();

    // Enforce server-side resend cooldown (default: 60s)
    const recentOtp = this.db.prepare(`
      SELECT created_at FROM otp_verifications
      WHERE recipient = ? AND purpose = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(recipient, purpose) as { created_at: string } | undefined;

    if (recentOtp) {
      const elapsedMs = now.getTime() - new Date(recentOtp.created_at).getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      if (elapsedSeconds < this.cooldownSeconds) {
        const remainingSeconds = this.cooldownSeconds - elapsedSeconds;
        const err = new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code`);
        (err as any).code = 'RESEND_COOLDOWN';
        (err as any).remainingSeconds = remainingSeconds;
        throw err;
      }
    }

    // Generate secure 6-digit numeric OTP
    const rawCode = (Math.floor(100000 + crypto.randomInt(900000))).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = this.hashOtp(rawCode, salt);

    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Invalidate or remove older unverified OTPs for this recipient & purpose
    this.db.prepare(`
      DELETE FROM otp_verifications
      WHERE recipient = ? AND purpose = ? AND verified_at IS NULL
    `).run(recipient, purpose);

    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO otp_verifications (id, recipient, otp_code_hash, salt, purpose, attempts_count, max_attempts, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 3, ?, ?)
    `).run(id, recipient, otpHash, salt, purpose, expiresAt, now.toISOString());

    // Dispatch via configured decoupled provider
    try {
      const sendResult = await this.provider.sendOtp(recipient, rawCode, purpose);
      if (!sendResult.success) {
        throw new Error(`Failed to dispatch OTP: ${sendResult.error || 'Provider delivery error'}`);
      }
    } catch (err) {
      // If dispatch fails, rollback the OTP record so the user isn't stuck in cooldown
      this.db.prepare('DELETE FROM otp_verifications WHERE id = ?').run(id);
      throw err;
    }

    this.auditService.record({
      action: 'auth.otp_requested',
      entityType: 'otp',
      entityId: id,
      details: { recipient, purpose, provider: this.provider.name }
    });

    return {
      success: true,
      expiresAt,
      debugCode: sendResult.debugCode
    };
  }

  public verifyOtp(
    recipient: string,
    code: string,
    purpose: 'merchant_signup' | 'cashier_login' | 'password_reset'
  ): OtpVerificationResult {
    const record = this.db.prepare(`
      SELECT * FROM otp_verifications
      WHERE recipient = ? AND purpose = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(recipient, purpose) as {
      id: string;
      otp_code_hash: string;
      salt: string;
      attempts_count: number;
      max_attempts: number;
      expires_at: string;
      verified_at: string | null;
    } | undefined;

    if (!record) {
      return {
        valid: false,
        reason: 'No pending verification code found for this recipient',
        code: 'NOT_FOUND'
      };
    }

    // Replay / single-use protection
    if (record.verified_at !== null) {
      return {
        valid: false,
        reason: 'This verification code has already been used.',
        code: 'ALREADY_USED'
      };
    }

    const now = new Date().toISOString();
    if (now > record.expires_at) {
      return {
        valid: false,
        reason: 'Verification code has expired. Please request a new one.',
        code: 'EXPIRED_CODE'
      };
    }

    // Attempt limit protection
    if (record.attempts_count >= record.max_attempts) {
      return {
        valid: false,
        reason: 'Maximum verification attempts exceeded. Please request a new code.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    const calculatedHash = this.hashOtp(code, record.salt);
    const hashBufferA = Buffer.from(calculatedHash, 'hex');
    const hashBufferB = Buffer.from(record.otp_code_hash, 'hex');

    const isMatch = hashBufferA.length === hashBufferB.length && crypto.timingSafeEqual(hashBufferA, hashBufferB);

    if (!isMatch) {
      const newAttempts = record.attempts_count + 1;
      this.db.prepare(`
        UPDATE otp_verifications
        SET attempts_count = ?
        WHERE id = ?
      `).run(newAttempts, record.id);

      const remaining = record.max_attempts - newAttempts;
      const reason = remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : 'Incorrect verification code. Maximum attempts reached.';

      this.auditService.record({
        action: 'auth.otp_verification_failed',
        entityType: 'otp',
        entityId: record.id,
        details: { recipient, purpose, attempts: newAttempts }
      });

      return {
        valid: false,
        reason,
        code: remaining > 0 ? 'INCORRECT_CODE' : 'MAX_ATTEMPTS_EXCEEDED',
        remainingAttempts: Math.max(0, remaining)
      };
    }

    // Mark as verified (Single-use completion)
    this.db.prepare(`
      UPDATE otp_verifications
      SET verified_at = ?
      WHERE id = ?
    `).run(now, record.id);

    this.auditService.record({
      action: 'auth.otp_verified',
      entityType: 'otp',
      entityId: record.id,
      details: { recipient, purpose }
    });

    return { valid: true };
  }

  public isRecipientVerified(recipient: string, purpose: string, maxAgeMinutes: number = 30): boolean {
    const threshold = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
    const record = this.db.prepare(`
      SELECT id FROM otp_verifications
      WHERE recipient = ? AND purpose = ? AND verified_at IS NOT NULL AND verified_at >= ?
      ORDER BY verified_at DESC
      LIMIT 1
    `).get(recipient, purpose, threshold);

    return !!record;
  }
}
