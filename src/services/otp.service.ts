import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';

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
    // In production, an authorized SMS/WhatsApp gateway adapter would be injected.
    const messageId = `sbx_${crypto.randomBytes(8).toString('hex')}`;
    return {
      success: true,
      messageId,
      provider: this.name,
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined
    };
  }
}

export class OtpService {
  private db: Database.Database;
  private provider: IOtpProvider;

  constructor(customDb?: Database.Database, customProvider?: IOtpProvider) {
    this.db = customDb || getDb();
    this.provider = customProvider || new SandboxOtpProvider();
  }

  private hashOtp(code: string, salt: string): string {
    return crypto.scryptSync(code, salt, 32).toString('hex');
  }

  public async requestOtp(recipient: string, purpose: 'merchant_signup' | 'cashier_login' | 'password_reset'): Promise<{ success: boolean; expiresAt: string; debugCode?: string }> {
    // Generate secure 6-digit numeric OTP
    const rawCode = (Math.floor(100000 + crypto.randomInt(900000))).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = this.hashOtp(rawCode, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Delete or expire older unverified OTPs for this recipient & purpose
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
    const sendResult = await this.provider.sendOtp(recipient, rawCode, purpose);
    if (!sendResult.success) {
      throw new Error(`Failed to dispatch OTP: ${sendResult.error || 'Provider delivery error'}`);
    }

    return {
      success: true,
      expiresAt,
      debugCode: sendResult.debugCode
    };
  }

  public verifyOtp(recipient: string, code: string, purpose: 'merchant_signup' | 'cashier_login' | 'password_reset'): { valid: boolean; reason?: string } {
    const record = this.db.prepare(`
      SELECT * FROM otp_verifications
      WHERE recipient = ? AND purpose = ? AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(recipient, purpose) as {
      id: string;
      otp_code_hash: string;
      salt: string;
      attempts_count: number;
      max_attempts: number;
      expires_at: string;
    } | undefined;

    if (!record) {
      return { valid: false, reason: 'No pending verification code found for this recipient' };
    }

    const now = new Date().toISOString();
    if (now > record.expires_at) {
      return { valid: false, reason: 'Verification code has expired' };
    }

    if (record.attempts_count >= record.max_attempts) {
      return { valid: false, reason: 'Maximum verification attempts exceeded. Please request a new code.' };
    }

    const calculatedHash = this.hashOtp(code, record.salt);
    const hashBufferA = Buffer.from(calculatedHash, 'hex');
    const hashBufferB = Buffer.from(record.otp_code_hash, 'hex');

    const isMatch = hashBufferA.length === hashBufferB.length && crypto.timingSafeEqual(hashBufferA, hashBufferB);

    if (!isMatch) {
      this.db.prepare(`
        UPDATE otp_verifications
        SET attempts_count = attempts_count + 1
        WHERE id = ?
      `).run(record.id);

      const remaining = record.max_attempts - (record.attempts_count + 1);
      return {
        valid: false,
        reason: remaining > 0
          ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
          : 'Incorrect verification code. Maximum attempts reached.'
      };
    }

    // Mark as verified
    this.db.prepare(`
      UPDATE otp_verifications
      SET verified_at = ?
      WHERE id = ?
    `).run(now, record.id);

    return { valid: true };
  }
}
