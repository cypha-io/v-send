import { config, databases } from '@/config/appwrite';
import * as Crypto from 'expo-crypto';
import { Query } from 'react-native-appwrite';

export interface PinSetupRequest {
  userId: string;
  pin: string;
  confirmPin: string;
}

export interface PinValidationRequest {
  userId: string;
  pin: string;
}

export class PinService {
  // Hash PIN for secure storage using Expo crypto
  private static async hashPin(pin: string, salt: string): Promise<string> {
    const combined = pin + salt;
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  // Generate salt for PIN hashing
  private static async generateSalt(): Promise<string> {
    // Use Expo crypto for secure random bytes
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate PIN format (4-6 digits)
  private static validatePinFormat(pin: string): boolean {
    const pinRegex = /^\d{4,6}$/;
    return pinRegex.test(pin);
  }

  // Set up user PIN during profile creation
  static async setupPin(request: PinSetupRequest): Promise<void> {
    try {
      // Validate PIN format
      if (!this.validatePinFormat(request.pin)) {
        throw new Error('PIN must be 4-6 digits');
      }

      // Confirm PIN match
      if (request.pin !== request.confirmPin) {
        throw new Error('PIN confirmation does not match');
      }

      // Generate salt and hash PIN
      const salt = await this.generateSalt();
      const hashedPin = await this.hashPin(request.pin, salt);

      // Store PIN in pins collection
      await databases.createDocument(
        config.databaseId,
        config.collections.pins,
        'unique()',
        {
          userId: request.userId,
          hashedPin: hashedPin,
          salt: salt,
          isActive: true,
          lastUsedAt: new Date().toISOString(),
        }
      );

      console.log('✅ PIN setup completed for user:', request.userId);
    } catch (error) {
      console.error('❌ PIN setup error:', error);
      throw error;
    }
  }

  // Validate PIN for transactions
  static async validatePin(request: PinValidationRequest): Promise<boolean> {
    try {
      // Get user PIN data from pins collection
      const pinResult = await databases.listDocuments(
        config.databaseId,
        config.collections.pins,
        [
          Query.equal('userId', request.userId),
          Query.equal('isActive', true)
        ]
      );
      
      if (pinResult.documents.length === 0) {
        throw new Error('PIN not set up. Please set up your PIN first.');
      }

      const pinData = pinResult.documents[0];

      // Hash provided PIN with stored salt
      const hashedPin = await this.hashPin(request.pin, pinData.salt);

      // Compare with stored hash
      const isValid = hashedPin === pinData.hashedPin;
      
      if (!isValid) {
        console.log('❌ Invalid PIN attempt for user:', request.userId);
      } else {
        console.log('✅ PIN validated successfully for user:', request.userId);
        
        // Update last used timestamp
        await databases.updateDocument(
          config.databaseId,
          config.collections.pins,
          pinData.$id,
          {
            lastUsedAt: new Date().toISOString()
          }
        );
      }

      return isValid;
    } catch (error) {
      console.error('❌ PIN validation error:', error);
      throw error;
    }
  }

  // Check if user has PIN set up
  static async isPinSet(userId: string): Promise<boolean> {
    try {
      const pinResult = await databases.listDocuments(
        config.databaseId,
        config.collections.pins,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      );
      return pinResult.documents.length > 0;
    } catch (error) {
      console.error('❌ PIN check error:', error);
      return false;
    }
  }

  // Change existing PIN
  static async changePin(userId: string, oldPin: string, newPin: string, confirmNewPin: string): Promise<void> {
    try {
      // Validate old PIN first
      const isOldPinValid = await this.validatePin({ userId, pin: oldPin });
      if (!isOldPinValid) {
        throw new Error('Current PIN is incorrect');
      }

      // Deactivate old PIN
      const pinResult = await databases.listDocuments(
        config.databaseId,
        config.collections.pins,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      );

      if (pinResult.documents.length > 0) {
        await databases.updateDocument(
          config.databaseId,
          config.collections.pins,
          pinResult.documents[0].$id,
          {
            isActive: false
          }
        );
      }

      // Set up new PIN
      await this.setupPin({
        userId,
        pin: newPin,
        confirmPin: confirmNewPin,
      });

      console.log('✅ PIN changed successfully for user:', userId);
    } catch (error) {
      console.error('❌ PIN change error:', error);
      throw error;
    }
  }
}

export const pinService = PinService;
