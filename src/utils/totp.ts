// TOTP (Time-based One-Time Password) utilities for 2FA
import * as OTPAuth from 'otplib/authenticator';
import QRCode from 'qrcode';

/**
 * Generate TOTP secret and QR code for user
 */
export async function generateTOTPSecret(email: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
  // Generate a random secret
  const secret = OTPAuth.generateSecret();
  
  // Create OTP Auth URL
  const otpauth = OTPAuth.keyuri(email, 'IndianToolsHub', secret);
  
  // Generate QR code as Data URL
  const qrCode = await QRCode.toDataURL(otpauth);
  
  // Generate 10 backup codes
  const backupCodes = generateBackupCodes();
  
  return { secret, qrCode, backupCodes };
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return OTPAuth.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Array.from({ length: 8 }, () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    codes.push(code);
  }
  return codes;
}

/**
 * Validate backup code format
 */
export function isValidBackupCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code.toUpperCase());
}

/**
 * Check if a backup code has been used
 */
export function isBackupCodeUsed(code: string, usedCodes: string[]): boolean {
  return usedCodes.includes(code.toUpperCase());
}
