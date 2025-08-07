import * as Crypto from 'expo-crypto';

export class CryptoService {
  /**
   * Hash a PIN using SHA256
   */
  static async hashPin(pin: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return hash;
    } catch (error) {
      console.error('Error hashing PIN:', error);
      throw new Error('Failed to hash PIN');
    }
  }

  /**
   * Verify a PIN against its hash
   */
  static async verifyPin(pin: string, hash: string): Promise<boolean> {
    try {
      const pinHash = await this.hashPin(pin);
      return pinHash === hash;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  /**
   * Generate a random string for account numbers or references
   */
  static generateRandomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a unique transaction reference
   */
  static generateTransactionReference(): string {
    const timestamp = Date.now().toString(36);
    const random = this.generateRandomString(8);
    return `TXN${timestamp}${random}`.toUpperCase();
  }

  /**
   * Generate a unique account number
   */
  static generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = this.generateRandomString(4);
    return `VSE${timestamp}${random}`;
  }

  /**
   * Generate a unique user ID
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${this.generateRandomString(8)}`;
  }

  /**
   * Generate a unique wallet ID
   */
  static generateWalletId(): string {
    return `wallet_${Date.now()}_${this.generateRandomString(8)}`;
  }

  /**
   * Generate a unique transaction ID
   */
  static generateTransactionId(): string {
    return `txn_${Date.now()}_${this.generateRandomString(8)}`;
  }
}
