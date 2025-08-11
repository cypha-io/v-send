import { config, databases, ID } from '@/config/appwrite';
import * as crypto from 'crypto-js';
import { Query } from 'react-native-appwrite';

export interface User {
  $id?: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface WalletAccount {
  $id?: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: string;
  isDefault: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  lastTransactionAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Transaction {
  $id?: string;
  walletAccountId: string;
  type: string;
  amount: number;
  description?: string;
  reference: string;
  status: string;
  recipientPhone?: string;
  metadata?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface WalletPin {
  $id?: string;
  userId: string;
  hashedPin: string;
  salt: string;
  isActive: boolean;
  lastUsedAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface AuthToken {
  $id?: string;
  userId: string;
  token: string;
  deviceInfo?: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export class AppwriteStorageService {
  private static instance: AppwriteStorageService;

  static getInstance(): AppwriteStorageService {
    if (!AppwriteStorageService.instance) {
      AppwriteStorageService.instance = new AppwriteStorageService();
    }
    return AppwriteStorageService.instance;
  }

  // Helper method to generate unique IDs
  private generateId(): string {
    return ID.unique();
  }

  // Helper method to generate account numbers
  private generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `VSE${timestamp}${random}`;
  }

  // Helper method to generate transaction references
  private generateTransactionReference(): string {
    return `TXN${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // User Management
  async createUser(phoneNumber: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      const userId = this.generateId();
      const userData: User = {
        phoneNumber,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'user',
        isVerified: false,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
      };

      const user = await databases.createDocument(
        config.databaseId,
        config.collections.users,
        userId,
        userData
      );

      return user as unknown as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserProfile(authUserId: string, phoneNumber: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      console.log('Creating user profile with authUserId:', authUserId);
      console.log('Database config:', { databaseId: config.databaseId, collection: config.collections.users });
      
      // First check if user profile already exists
      try {
        const existingUser = await databases.getDocument(
          config.databaseId,
          config.collections.users,
          authUserId
        );
        console.log('User profile already exists:', existingUser);
        return existingUser as unknown as User;
      } catch {
        // User doesn't exist, create new one
        console.log('User profile does not exist, creating new one');
      }
      
      const userData: User = {
        phoneNumber,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'user',
        isVerified: false,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
      };

      console.log('User data to create:', userData);

      const user = await databases.createDocument(
        config.databaseId,
        config.collections.users,
        authUserId, // Use the Appwrite auth user ID instead of generating new one
        userData
      );

      console.log('User profile created successfully:', user);
      return user as unknown as User;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        [Query.equal('phoneNumber', phoneNumber)]
      );

      return response.documents.length > 0 ? (response.documents[0] as unknown as User) : null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await databases.getDocument(
        config.databaseId,
        config.collections.users,
        userId
      );
      return user as unknown as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const user = await databases.updateDocument(
        config.databaseId,
        config.collections.users,
        userId,
        updates
      );
      return user as unknown as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Wallet Account Management
  async createWalletAccount(userId: string): Promise<WalletAccount> {
    try {
      const accountId = this.generateId();
      const accountData: WalletAccount = {
        userId,
        accountNumber: this.generateAccountNumber(),
        balance: 0,
        currency: 'USD',
        status: 'active',
        isDefault: true,
        dailyLimit: 10000,
        monthlyLimit: 100000,
      };

      const account = await databases.createDocument(
        config.databaseId,
        config.collections.walletAccounts,
        accountId,
        accountData
      );

      return account as unknown as WalletAccount;
    } catch (error) {
      console.error('Error creating wallet account:', error);
      throw error;
    }
  }

  async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.walletAccounts,
        [Query.equal('userId', userId)]
      );

      return response.documents.length > 0 ? (response.documents[0] as unknown as WalletAccount) : null;
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  async updateWalletBalance(accountId: string, newBalance: number): Promise<WalletAccount> {
    try {
      const account = await databases.updateDocument(
        config.databaseId,
        config.collections.walletAccounts,
        accountId,
        { 
          balance: newBalance,
          lastTransactionAt: new Date().toISOString()
        }
      );
      return account as unknown as WalletAccount;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  // Transaction Management
  async createTransaction(
    walletAccountId: string,
    type: string,
    amount: number,
    description?: string,
    recipientPhone?: string,
    metadata?: any
  ): Promise<Transaction> {
    try {
      const transactionId = this.generateId();
      const transactionData: Transaction = {
        walletAccountId,
        type,
        amount,
        description: description || '',
        reference: this.generateTransactionReference(),
        status: 'completed',
        recipientPhone: recipientPhone || '',
        metadata: metadata ? JSON.stringify(metadata) : '',
      };

      const transaction = await databases.createDocument(
        config.databaseId,
        config.collections.transactions,
        transactionId,
        transactionData
      );

      return transaction as unknown as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactionHistory(walletAccountId: string): Promise<Transaction[]> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.transactions,
        [
          Query.equal('walletAccountId', walletAccountId),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );

      return response.documents as unknown as Transaction[];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // PIN Management
  async setWalletPin(userId: string, pin: string): Promise<void> {
    try {
      const salt = crypto.lib.WordArray.random(32).toString();
      const hashedPin = crypto.SHA256(pin + salt).toString();

      // Check if PIN already exists
      const existingPin = await this.getWalletPin(userId);
      
      if (existingPin) {
        // Update existing PIN
        await databases.updateDocument(
          config.databaseId,
          config.collections.pins,
          existingPin.$id!,
          {
            hashedPin,
            salt,
            isActive: true,
          }
        );
      } else {
        // Create new PIN
        const pinId = this.generateId();
        await databases.createDocument(
          config.databaseId,
          config.collections.pins,
          pinId,
          {
            userId,
            hashedPin,
            salt,
            isActive: true,
          }
        );
      }
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  }

  async verifyWalletPin(userId: string, pin: string): Promise<boolean> {
    try {
      const walletPin = await this.getWalletPin(userId);
      if (!walletPin || !walletPin.isActive) {
        return false;
      }

      const hashedPin = crypto.SHA256(pin + walletPin.salt).toString();
      const isValid = hashedPin === walletPin.hashedPin;

      if (isValid) {
        // Update last used timestamp
        await databases.updateDocument(
          config.databaseId,
          config.collections.pins,
          walletPin.$id!,
          {
            lastUsedAt: new Date().toISOString(),
          }
        );
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  }

  async hasWalletPin(userId: string): Promise<boolean> {
    try {
      const walletPin = await this.getWalletPin(userId);
      return walletPin !== null && walletPin.isActive;
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  }

  private async getWalletPin(userId: string): Promise<WalletPin | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.pins,
        [Query.equal('userId', userId)]
      );

      return response.documents.length > 0 ? (response.documents[0] as unknown as WalletPin) : null;
    } catch (error) {
      console.error('Error getting wallet PIN:', error);
      return null;
    }
  }

  // Auth Token Management
  async saveAuthToken(userId: string, token: string, deviceInfo?: string): Promise<void> {
    try {
      const tokenId = this.generateId();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

      await databases.createDocument(
        config.databaseId,
        config.collections.authTokens,
        tokenId,
        {
          userId,
          token,
          deviceInfo: deviceInfo || '',
          isActive: true,
          expiresAt: expiresAt.toISOString(),
          lastUsedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  async getValidAuthToken(userId: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.authTokens,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.greaterThan('expiresAt', new Date().toISOString()),
          Query.orderDesc('$createdAt'),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        const authToken = response.documents[0] as unknown as AuthToken;
        return authToken.token;
      }

      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async removeAuthToken(userId: string): Promise<void> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.authTokens,
        [Query.equal('userId', userId)]
      );

      // Deactivate all tokens for this user
      for (const token of response.documents) {
        await databases.updateDocument(
          config.databaseId,
          config.collections.authTokens,
          token.$id,
          { isActive: false }
        );
      }
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  }

  // Clear all data for a user (for logout)
  async clearUserData(userId: string): Promise<void> {
    try {
      await this.removeAuthToken(userId);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
}

export default AppwriteStorageService.getInstance();
